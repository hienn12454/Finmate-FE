import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import LoginModal from "../components/LoginModal";
import UpgradeModal from "../components/UpgradeModal";
import AvatarDropdown from "../components/AvatarDropdown";
import { useAuth } from "../hooks/useAuth";
import { useAvatar } from "../hooks/useAvatar";
import styles from "./Homepage.module.css";

function scrollToSection(id: string) {
  const el = document.getElementById(id);
  el?.scrollIntoView({ behavior: "smooth" });
}

export default function Homepage() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, signOut, user, isLoading, refreshUser } = useAuth();
  const {
    avatarUrl,
    displayName,
    avatarBorderClass,
    currentPlan,
    premiumStatus,
    planDisplayName,
    planBadgeClass,
  } = useAvatar(user);

  // Refresh auth state when component mounts or location changes
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token && !isAuthenticated && !isLoading) {
      // Token exists but isAuthenticated is false, try to refresh
      refreshUser().catch(() => {
        // If refresh fails, token is invalid, clear it
        localStorage.removeItem("access_token");
      });
    }
  }, [location.pathname, isAuthenticated, isLoading, refreshUser]);

  const handleLogin = () => setIsLoginModalOpen(true);

  const handleUpgradeClick = (planId: string) => {
    if (isAuthenticated) {
      // Đã đăng nhập, chuyển đến trang thanh toán
      navigate(`/payment?plan=${planId}`);
      setIsUpgradeModalOpen(false);
    } else {
      // Chưa đăng nhập, mở modal login với redirect
      setIsUpgradeModalOpen(false);
      setIsLoginModalOpen(true);
      // Lưu planId vào sessionStorage để sau khi login sẽ redirect
      sessionStorage.setItem("upgradePlanId", planId);
    }
  };

  useEffect(() => {
    const scrollTo = (location.state as { scrollTo?: string } | null)?.scrollTo;
    if (!scrollTo) return;

    // Đợi paint/layout rồi mới scroll để tránh lệch vị trí
    requestAnimationFrame(() => scrollToSection(scrollTo));
    // Clear state để refresh không scroll lại
    navigate("/", { replace: true, state: null });
  }, [location.state, navigate]);

  return (
    <div className={styles.container}>
      <div className={styles.waterGradient} />
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Link to="/" className={styles.logo}>
            <span className={styles.logoMark}>F</span>
            <div className={styles.brand}>
              <span className={styles.logoText}>Finmate</span>
              <span className={styles.tagline}>Ứng dụng Quản Lý Tài Chính Cá Nhân</span>
            </div>
          </Link>
        </div>
        <nav className={styles.nav}>
          <Link to="/" className={styles.navLink}>TRANG CHỦ</Link>
          <button type="button" onClick={() => scrollToSection("tinh-nang")} className={styles.navLink}>TÍNH NĂNG</button>
          <button type="button" onClick={() => scrollToSection("tien-ich")} className={styles.navLink}>TIỆN ÍCH</button>
          <Link to="/support" className={styles.navLink}>HỖ TRỢ</Link>
        </nav>
        {isAuthenticated ? (
          <div className={styles.headerRightAuth}>
            <AvatarDropdown
              avatarUrl={avatarUrl}
              alt={displayName}
              wrapperClassName={`${styles.avatarSmall} ${avatarBorderClass ? styles[avatarBorderClass] : ""}`}
              imageClassName={styles.avatarImage}
              menuLabel={displayName}
              items={[
                { label: "Dashboard", onClick: () => navigate("/dashboard") },
                { label: "Đăng xuất", variant: "danger", onClick: () => signOut() },
              ]}
            />
            <span className={styles.userGreeting}>Xin chào, {displayName}</span>
            {currentPlan && premiumStatus ? (
              <div className={styles.premiumInfoContainer}>
                <div className={styles.premiumInfo}>
                  <span
                    className={`${styles.currentPlanBadge} ${
                      planBadgeClass ? styles[planBadgeClass] : ""
                    }`}
                  >
                    {planDisplayName}
                  </span>
                  <div className={styles.premiumDates}>
                    <span className={styles.premiumDate}>
                      Mua: {premiumStatus.purchasedAt ? new Date(premiumStatus.purchasedAt).toLocaleDateString("vi-VN") : "N/A"}
                    </span>
                    <span className={styles.premiumDate}>
                      Hết hạn: {premiumStatus.expiresAt ? new Date(premiumStatus.expiresAt).toLocaleDateString("vi-VN") : "N/A"}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsUpgradeModalOpen(true)}
                  className={styles.upgradeTextButton}
                >
                  Nâng cấp
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsUpgradeModalOpen(true)}
                className={styles.upgradeButton}
              >
                <span className={styles.buttonText}>Nâng cấp tài khoản</span>
              </button>
            )}
          </div>
        ) : (
          <div className={styles.headerRight}>
            <button
              type="button"
              onClick={() => setIsUpgradeModalOpen(true)}
              className={styles.upgradeButton}
            >
              <span className={styles.buttonText}>Nâng cấp tài khoản</span>
            </button>
            <button type="button" onClick={handleLogin} className={styles.loginButton}>
              <span className={styles.buttonText}>Đăng nhập</span>
            </button>
          </div>
        )}
      </header>

      <section className={styles.introduce}>
        <div className={styles.introduceInner}>
          <h1 className={styles.introduceTitle}>Finmate</h1>
          <p className={styles.introduceTagline}>Ứng dụng Quản Lý Tài Chính Cá Nhân thông minh</p>
          <p className={styles.introduceDesc}>
            Kiểm soát chi tiêu, lập kế hoạch ngân sách, theo dõi thu nhập và đạt mục tiêu tài chính. 
            Bắt đầu hành trình tự do tài chính ngay hôm nay.
          </p>
          <button type="button" onClick={handleLogin} className={styles.ctaButton}>
            Bắt đầu ngay - Miễn phí
          </button>
        </div>
      </section>

      <main className={styles.main}>
        <section id="tinh-nang" className={styles.section}>
          <h2 className={styles.sectionTitle}>Tính năng</h2>
          <div className={styles.features}>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>💰</div>
              <h3>Quản lý chi tiêu thông minh</h3>
              <p>Ghi nhận và phân loại mọi khoản chi tiêu tự động. Cảnh báo vượt ngân sách. Phân tích xu hướng theo thời gian.</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>📊</div>
              <h3>Báo cáo & Phân tích</h3>
              <p>Biểu đồ trực quan dòng tiền. Thống kê theo danh mục. Dự báo tài chính từ dữ liệu lịch sử.</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>🎯</div>
              <h3>Mục tiêu & Tiết kiệm</h3>
              <p>Đặt mục tiêu tiết kiệm cụ thể. Theo dõi tiến độ hàng ngày. Gợi ý tiết kiệm hiệu quả.</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>🏦</div>
              <h3>Quản lý tài khoản</h3>
              <p>Kết nối nhiều tài khoản ngân hàng. Đồng bộ giao dịch. Quản lý thẻ tín dụng và nợ.</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>💳</div>
              <h3>Ngân sách thông minh</h3>
              <p>Kế hoạch chi tiêu hàng tháng. Phân bổ theo danh mục. Điều chỉnh linh hoạt.</p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>🔔</div>
              <h3>Nhắc nhở & Cảnh báo</h3>
              <p>Nhắc thanh toán hóa đơn. Cảnh báo chi tiêu bất thường. Thông báo khi đạt mục tiêu.</p>
            </div>
          </div>
        </section>

        <section id="tien-ich" className={styles.section}>
          <h2 className={styles.sectionTitle}>Tại sao chọn Finmate?</h2>
          <div className={styles.benefitsGrid}>
            <div className={styles.benefitItem}>
              <span className={styles.benefitNumber}>01</span>
              <h4>Dễ sử dụng</h4>
              <p>Giao diện thân thiện. Chỉ 5 phút bắt đầu quản lý tài chính hiệu quả.</p>
            </div>
            <div className={styles.benefitItem}>
              <span className={styles.benefitNumber}>02</span>
              <h4>Bảo mật tuyệt đối</h4>
              <p>Dữ liệu mã hóa cao cấp. Tuân thủ chuẩn bảo mật. Quyền riêng tư ưu tiên hàng đầu.</p>
            </div>
            <div className={styles.benefitItem}>
              <span className={styles.benefitNumber}>03</span>
              <h4>Đồng bộ mọi nơi</h4>
              <p>Web, mobile, tablet. Đồng bộ real-time. Quản lý mọi lúc mọi nơi.</p>
            </div>
            <div className={styles.benefitItem}>
              <span className={styles.benefitNumber}>04</span>
              <h4>AI thông minh</h4>
              <p>Phân tích chi tiêu tự động. Gợi ý tiết kiệm. Dự báo tài chính chính xác.</p>
            </div>
          </div>
        </section>

        <section id="ho-tro" className={styles.section}>
          <div className={styles.statsSection}>
            <div className={styles.statItem}>
              <h3>10,000+</h3>
              <p>Người dùng tin tưởng</p>
            </div>
            <div className={styles.statItem}>
              <h3>50M+</h3>
              <p>Giao dịch được quản lý</p>
            </div>
            <div className={styles.statItem}>
              <h3>4.8/5</h3>
              <p>Đánh giá trung bình</p>
            </div>
            <div className={styles.statItem}>
              <h3>24/7</h3>
              <p>Hỗ trợ khách hàng</p>
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerGrid}>
          <div className={styles.footerCol}>
            <div className={styles.footerBrand}>
              <span className={styles.logoMark}>F</span>
              <span className={styles.footerLogoText}>Finmate</span>
            </div>
            <p className={styles.footerTagline}>Ứng dụng Quản Lý Tài Chính Cá Nhân</p>
            <p className={styles.footerContact}>© 2026 <span className={styles.finmateText}>Finmate</span>. All rights reserved.</p>
          </div>
          <div className={styles.footerCol}>
            <h4>Khám phá</h4>
            <Link to="/" className={styles.footerLink}>Trang chủ</Link>
            <button type="button" onClick={() => scrollToSection("tinh-nang")} className={styles.footerLink}>Tính năng</button>
            <button type="button" onClick={handleLogin} className={styles.footerLink}>Đăng nhập</button>
          </div>
          <div className={styles.footerCol}>
            <h4>Tài nguyên</h4>
            <Link to="/support" className={styles.footerLink}>Hỗ trợ</Link>
            <Link to="/guides" className={styles.footerLink}>Hướng dẫn</Link>
            <Link to="/blog" className={styles.footerLink}>Blog</Link>
          </div>
        </div>
      </footer>

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        redirectTo={sessionStorage.getItem("upgradePlanId") ? `/payment?plan=${sessionStorage.getItem("upgradePlanId")}` : undefined}
      />
      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        onUpgradeClick={handleUpgradeClick}
      />
    </div>
  );
}
