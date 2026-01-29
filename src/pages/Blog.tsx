import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import LoginModal from "../components/LoginModal";
import UpgradeModal from "../components/UpgradeModal";
import AvatarDropdown from "../components/AvatarDropdown";
import { useAuth } from "../hooks/useAuth";
import { useAvatar } from "../hooks/useAvatar";
import { usePremium } from "../hooks/usePremium";
import homeStyles from "./Homepage.module.css";
import styles from "./Blog.module.css";
import { BLOG_POSTS } from "./blogData";

export default function Blog() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const navigate = useNavigate();
  const hasRefreshedAuth = useRef(false);

  const handleLogin = () => setIsLoginModalOpen(true);
  const goHomeAndScroll = (scrollTo: string) => navigate("/", { state: { scrollTo } });

  const { isAuthenticated, user, signOut, isLoading, refreshUser } = useAuth();
  const {
    avatarUrl,
    displayName,
    avatarBorderClass,
    currentPlan,
    premiumStatus,
    planDisplayName,
    planBadgeClass,
  } = useAvatar(user);
  const { refreshSubscription } = usePremium();

  // Refresh auth and premium state when component mounts
  useEffect(() => {
    if (hasRefreshedAuth.current) return;
    
    const token = localStorage.getItem("access_token");
    if (!token) {
      hasRefreshedAuth.current = true;
      return;
    }

    // Wait for initial auth check to complete
    if (isLoading) return;

    hasRefreshedAuth.current = true;

    // Refresh user if token exists but user is not loaded
    if (!isAuthenticated || !user) {
      refreshUser().catch(() => {
        localStorage.removeItem("access_token");
      });
    }

    // Always refresh subscription if authenticated
    if (isAuthenticated) {
      refreshSubscription();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, isAuthenticated]); // Run when isLoading or isAuthenticated changes

  const handleUpgradeClick = (planId: string) => {
    if (isAuthenticated) {
      navigate(`/payment?plan=${planId}`);
      setIsUpgradeModalOpen(false);
    } else {
      setIsUpgradeModalOpen(false);
      setIsLoginModalOpen(true);
      sessionStorage.setItem("upgradePlanId", planId);
    }
  };

  return (
    <div className={homeStyles.container}>
      <div className={homeStyles.waterGradient} />

      <header className={homeStyles.header}>
        <div className={homeStyles.headerLeft}>
          <Link to="/" className={homeStyles.logo}>
            <span className={homeStyles.logoMark}>F</span>
            <div className={homeStyles.brand}>
              <span className={homeStyles.logoText}>Finmate</span>
              <span className={homeStyles.tagline}>Ứng dụng Quản Lý Tài Chính Cá Nhân</span>
            </div>
          </Link>
        </div>

        <nav className={homeStyles.nav}>
          <Link to="/" className={homeStyles.navLink}>
            TRANG CHỦ
          </Link>
          <button type="button" onClick={() => goHomeAndScroll("tinh-nang")} className={homeStyles.navLink}>
            TÍNH NĂNG
          </button>
          <button type="button" onClick={() => goHomeAndScroll("tien-ich")} className={homeStyles.navLink}>
            TIỆN ÍCH
          </button>
          <Link to="/support" className={homeStyles.navLink}>
            HỖ TRỢ
          </Link>
        </nav>

        {isAuthenticated ? (
          <div className={homeStyles.headerRightAuth}>
            <AvatarDropdown
              avatarUrl={avatarUrl}
              alt={displayName}
              wrapperClassName={`${homeStyles.avatarSmall} ${avatarBorderClass ? homeStyles[avatarBorderClass] : ""}`}
              imageClassName={homeStyles.avatarImage}
              menuLabel={displayName}
              items={[
                { label: "Dashboard", onClick: () => navigate("/dashboard") },
                { label: "Đăng xuất", variant: "danger", onClick: () => signOut() },
              ]}
            />
            <span className={homeStyles.userGreeting}>Xin chào, {displayName}</span>
            {currentPlan && premiumStatus ? (
              <div className={homeStyles.premiumInfoContainer}>
                <div className={homeStyles.premiumInfo}>
                  <span
                    className={`${homeStyles.currentPlanBadge} ${
                      planBadgeClass ? homeStyles[planBadgeClass] : ""
                    }`}
                  >
                    {planDisplayName}
                  </span>
                  <div className={homeStyles.premiumDates}>
                    <span className={homeStyles.premiumDate}>
                      Mua:{" "}
                      {premiumStatus.purchasedAt
                        ? new Date(premiumStatus.purchasedAt).toLocaleDateString("vi-VN")
                        : "N/A"}
                    </span>
                    <span className={homeStyles.premiumDate}>
                      Hết hạn:{" "}
                      {premiumStatus.expiresAt
                        ? new Date(premiumStatus.expiresAt).toLocaleDateString("vi-VN")
                        : "N/A"}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsUpgradeModalOpen(true)}
                  className={homeStyles.upgradeTextButton}
                >
                  Nâng cấp
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsUpgradeModalOpen(true)}
                className={homeStyles.upgradeButton}
              >
                <span className={homeStyles.buttonText}>Nâng cấp tài khoản</span>
              </button>
            )}
          </div>
        ) : (
          <div className={homeStyles.headerRight}>
            <button type="button" onClick={() => setIsUpgradeModalOpen(true)} className={homeStyles.upgradeButton}>
              <span className={homeStyles.buttonText}>Nâng cấp tài khoản</span>
            </button>
            <button type="button" onClick={handleLogin} className={homeStyles.loginButton}>
              <span className={homeStyles.buttonText}>Đăng nhập</span>
            </button>
          </div>
        )}
      </header>

      <main className={styles.main}>
        <div className={styles.hero}>
          <h1 className={styles.title}>
            Blog <span className={homeStyles.finmateText}>Finmate</span>
          </h1>
          <p className={styles.subtitle}>
            Tổng hợp bài viết (demo) về cách sử dụng Finmate, mẹo tài chính cá nhân, và cập nhật tính năng.
          </p>
        </div>

        <div className={styles.grid}>
          {BLOG_POSTS.map((post) => (
            <Link key={post.slug} to={`/blog/${post.slug}`} className={styles.card}>
              <div className={styles.meta}>
                <span>{new Date(post.date).toLocaleDateString("vi-VN")}</span>
                <span>•</span>
                <span>{post.readingMinutes} phút đọc</span>
              </div>
              <div className={styles.cardTitle}>{post.title}</div>
              <div className={styles.excerpt}>{post.excerpt}</div>
              <div className={styles.tags}>
                {post.tags.map((t) => (
                  <span key={t} className={styles.tag}>
                    {t}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </main>

      <footer className={homeStyles.footer}>
        <div className={homeStyles.footerGrid}>
          <div className={homeStyles.footerCol}>
            <div className={homeStyles.footerBrand}>
              <span className={homeStyles.logoMark}>F</span>
              <span className={homeStyles.footerLogoText}>Finmate</span>
            </div>
            <p className={homeStyles.footerTagline}>Ứng dụng Quản Lý Tài Chính Cá Nhân</p>
            <p className={homeStyles.footerContact}>
              © 2026 <span className={homeStyles.finmateText}>Finmate</span>. All rights reserved.
            </p>
          </div>
          <div className={homeStyles.footerCol}>
            <h4>Khám phá</h4>
            <Link to="/" className={homeStyles.footerLink}>
              Trang chủ
            </Link>
            <button type="button" onClick={() => goHomeAndScroll("tinh-nang")} className={homeStyles.footerLink}>
              Tính năng
            </button>
            <button type="button" onClick={handleLogin} className={homeStyles.footerLink}>
              Đăng nhập
            </button>
          </div>
          <div className={homeStyles.footerCol}>
            <h4>Tài nguyên</h4>
            <Link to="/support" className={homeStyles.footerLink}>
              Hỗ trợ
            </Link>
            <Link to="/guides" className={homeStyles.footerLink}>
              Hướng dẫn
            </Link>
            <Link to="/blog" className={homeStyles.footerLink}>
              Blog
            </Link>
          </div>
        </div>
      </footer>

      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        onUpgradeClick={handleUpgradeClick}
      />
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </div>
  );
}

