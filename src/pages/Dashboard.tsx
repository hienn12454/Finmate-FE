import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useAvatar } from "../hooks/useAvatar";
import { dashboardApi } from "../api/dashboard.api";
import type {
  MoneySourceGroupedResponseDto,
  OverviewReportDto,
} from "../api/dashboard.api";
import UpgradeModal from "../components/UpgradeModal";
import AvatarDropdown from "../components/AvatarDropdown";
import styles from "./Dashboard.module.css";
import homeStyles from "./Homepage.module.css";

const DASHBOARD_SECTIONS = [
  { id: "overview", label: "Tổng quan", path: "/dashboard" },
  { id: "balances", label: "Tài khoản & số dư", path: "/accounts" },
  { id: "goals", label: "Mục tiêu", path: "/goals" },
  { id: "transactions", label: "Giao dịch", path: "/transactions" },
  { id: "chart", label: "Biểu đồ", path: "/chart" },
] as const;

export default function Dashboard() {
  const { isLoading: authLoading, signOut, user } = useAuth();
  const navigate = useNavigate();
  const [greeting, setGreeting] = useState("");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  const [overview, setOverview] = useState<OverviewReportDto | null>(null);
  const [moneySourcesGrouped, setMoneySourcesGrouped] =
    useState<MoneySourceGroupedResponseDto | null>(null);

  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    // Set greeting based on time
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Chào buổi sáng");
    else if (hour < 18) setGreeting("Chào buổi chiều");
    else setGreeting("Chào buổi tối");
  }, []);

  // Load dữ liệu dashboard sau khi auth xong
  useEffect(() => {
    if (authLoading) return;

    let isCancelled = false;
    const load = async () => {
      try {
        setLoadingData(true);
        setError(null);

        const [overviewRes, moneySourcesGroupedRes] = await Promise.all([
          dashboardApi.getOverview(),
          dashboardApi.getMoneySourcesGrouped(),
        ]);

        if (isCancelled) return;

        setOverview(overviewRes.data);
        setMoneySourcesGrouped(moneySourcesGroupedRes.data);

        setLoadingData(false);
      } catch (err: any) {
        if (isCancelled) return;
        console.error("Load dashboard data error", err);
        const raw = err?.response?.data;
        const message =
          raw?.message ||
          raw?.error ||
          err?.message ||
          "Không thể tải dữ liệu dashboard";
        setError(message);
        setLoadingData(false);
      }
    };

    load();

    return () => {
      isCancelled = true;
    };
  }, [authLoading]);

  // Phải gọi TẤT CẢ hooks trước early return để tuân thủ quy tắc hooks
  const {
    avatarUrl,
    displayName,
    currentPlan,
    avatarBorderClass,
    premiumStatus,
    planDisplayName,
    planBadgeClass,
  } = useAvatar(user);

  const handleNavigateToSection = (section: string) => {
    const sectionData = DASHBOARD_SECTIONS.find((s) => s.id === section);
    if (sectionData) {
      navigate(sectionData.path);
    }
  };

  const handleUpgradeClick = (planId: string) => {
    // Đã đăng nhập rồi, chuyển đến trang thanh toán
    navigate(`/payment?plan=${planId}`);
    setIsUpgradeModalOpen(false);
  };

  if (authLoading || loadingData) {
    return (
      <div className={homeStyles.container}>
        <div className={homeStyles.waterGradient} />
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Đang tải dữ liệu...</p>
          <span className={styles.loadingSubtext}>Vui lòng đợi một chút</span>
        </div>
      </div>
    );
  }

  const goHomeAndScroll = (scrollTo: string) =>
    navigate("/", { state: { scrollTo } });

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
          <button
            type="button"
            onClick={() => goHomeAndScroll("tinh-nang")}
            className={homeStyles.navLink}
          >
            TÍNH NĂNG
          </button>
          <button
            type="button"
            onClick={() => goHomeAndScroll("tien-ich")}
            className={homeStyles.navLink}
          >
            TIỆN ÍCH
          </button>
          <Link to="/support" className={homeStyles.navLink}>
            HỖ TRỢ
          </Link>
        </nav>

        <div className={homeStyles.headerRightAuth}>
          <AvatarDropdown
            avatarUrl={avatarUrl}
            alt={displayName}
            wrapperClassName={`${homeStyles.avatarSmall} ${
              avatarBorderClass ? homeStyles[avatarBorderClass] : ""
            }`}
            imageClassName={homeStyles.avatarImage}
            menuLabel={displayName}
            items={[
              { label: "Dashboard", onClick: () => navigate("/dashboard") },
              { label: "Trang chủ", onClick: () => navigate("/") },
              { label: "Đăng xuất", variant: "danger", onClick: () => signOut() },
            ]}
          />
          <span className={homeStyles.userGreeting}>
            {greeting}, {displayName}! 👋
          </span>
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
      </header>

      <div className={styles.layout}>
        <aside
          className={
            isSidebarCollapsed
              ? `${styles.sidebar} ${styles.sidebarCollapsed}`
              : styles.sidebar
          }
        >
          <button
            type="button"
            className={styles.sidebarToggle}
            onClick={() => setIsSidebarCollapsed((v) => !v)}
          >
            {isSidebarCollapsed ? "›" : "‹"}
          </button>
          <nav className={styles.sidebarNav}>
            {DASHBOARD_SECTIONS.map((section) => (
              <button
                key={section.id}
                type="button"
                className={`${styles.sidebarItem} ${section.id === "overview" ? styles.active : ""}`}
                onClick={() => handleNavigateToSection(section.id)}
              >
                <span className={styles.sidebarBullet} />
                {!isSidebarCollapsed && <span>{section.label}</span>}
              </button>
            ))}
          </nav>
        </aside>

        <main className={styles.main}>
          {error && (
            <div className={styles.errorBanner}>
              <p>{error}</p>
            </div>
          )}

          <section className={styles.sectionBlock}>
            <div className={styles.welcomeSection}>
              <h1>Dashboard - Tổng quan</h1>
              <p className={styles.welcomeText}>
                Quản lý tài chính của bạn một cách thông minh
              </p>
              <div className={styles.verifiedBadge}>
                <span className={styles.checkmark}>✓</span> Đã đăng nhập thành công
              </div>
            </div>

            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>💰</div>
                <div className={styles.statContent}>
                  <h3>Tổng thu nhập</h3>
                  <p className={styles.statValue}>
                    {(overview?.totalIncome ?? 0).toLocaleString("vi-VN")} ₫
                  </p>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIcon}>💸</div>
                <div className={styles.statContent}>
                  <h3>Tổng chi tiêu</h3>
                  <p className={styles.statValue}>
                    {(overview?.totalExpense ?? 0).toLocaleString("vi-VN")} ₫
                  </p>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIcon}>📊</div>
                <div className={styles.statContent}>
                  <h3>Số dư (thu - chi)</h3>
                  <p className={styles.statValue}>
                    {(overview?.difference ?? 0).toLocaleString("vi-VN")} ₫
                  </p>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statIcon}>🏦</div>
                <div className={styles.statContent}>
                  <h3>Tổng số dư tài khoản</h3>
                  <p className={styles.statValue}>
                    {(moneySourcesGrouped?.totalBalance ?? 0).toLocaleString(
                      "vi-VN"
                    )} ₫
                  </p>
                </div>
              </div>
            </div>

            <div className={styles.quickLinksGrid}>
              <Link
                to="/accounts"
                className={styles.card}
              >
                <h3>💳 Tài khoản & số dư</h3>
                <p>
                  Quản lý các tài khoản và nguồn tiền của bạn
                </p>
              </Link>

              <Link
                to="/goals"
                className={styles.card}
              >
                <h3>🎯 Mục tiêu tài chính</h3>
                <p>
                  Theo dõi và quản lý các mục tiêu tiết kiệm
                </p>
              </Link>

              <Link
                to="/transactions"
                className={styles.card}
              >
                <h3>📝 Giao dịch</h3>
                <p>
                  Xem và quản lý tất cả các giao dịch thu chi
                </p>
              </Link>

              <Link
                to="/chart"
                className={styles.card}
              >
                <h3>📊 Biểu đồ</h3>
                <p>
                  Phân tích chi tiêu theo danh mục và thời gian
                </p>
              </Link>
            </div>
          </section>
        </main>
      </div>

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
            <button
              type="button"
              onClick={() => goHomeAndScroll("tinh-nang")}
              className={homeStyles.footerLink}
            >
              Tính năng
            </button>
            <button
              type="button"
              onClick={() => goHomeAndScroll("tien-ich")}
              className={homeStyles.footerLink}
            >
              Tiện ích
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
    </div>
  );
}
