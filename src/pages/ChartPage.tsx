import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import UpgradeModal from "../components/UpgradeModal";
import AvatarDropdown from "../components/AvatarDropdown";
import LineChart, { type ChartDataPoint } from "../components/LineChart";
import { useAuth } from "../hooks/useAuth";
import { useAvatar } from "../hooks/useAvatar";
import { dashboardApi } from "../api/dashboard.api";
import styles from "./Dashboard.module.css";
import homeStyles from "./Homepage.module.css";

const DASHBOARD_SECTIONS = [
  { id: "overview", label: "Tổng quan", path: "/dashboard" },
  { id: "balances", label: "Tài khoản & số dư", path: "/accounts" },
  { id: "goals", label: "Mục tiêu", path: "/goals" },
  { id: "transactions", label: "Giao dịch", path: "/transactions" },
  { id: "chart", label: "Biểu đồ", path: "/chart" },
] as const;

export default function ChartPage() {
  const { isLoading: authLoading, signOut, user } = useAuth();
  const navigate = useNavigate();
  const [greeting, setGreeting] = useState("");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  type FilterType = "12months" | "6months" | "3months" | "custom";
  const [filterType, setFilterType] = useState<FilterType>("12months");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loadingChart, setLoadingChart] = useState(true);
  const [chartError, setChartError] = useState<string | null>(null);

  const {
    avatarUrl,
    displayName,
    currentPlan,
    avatarBorderClass,
    premiumStatus,
    planDisplayName,
    planBadgeClass,
  } = useAvatar(user);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Chào buổi sáng");
    else if (hour < 18) setGreeting("Chào buổi chiều");
    else setGreeting("Chào buổi tối");
  }, []);

  const currentRange = useMemo(() => {
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let start: Date;

    if (filterType === "6months") {
      start = new Date(end);
      start.setMonth(start.getMonth() - 5);
    } else if (filterType === "3months") {
      start = new Date(end);
      start.setMonth(start.getMonth() - 2);
    } else if (filterType === "custom" && customStartDate && customEndDate) {
      return {
        start: new Date(customStartDate),
        end: new Date(customEndDate),
      };
    } else {
      // 12 tháng mặc định
      start = new Date(end);
      start.setMonth(start.getMonth() - 11);
    }

    return { start, end };
  }, [filterType, customStartDate, customEndDate]);

  useEffect(() => {
    if (authLoading) return;

    const loadChart = async () => {
      try {
        setLoadingChart(true);
        setChartError(null);

        const { start, end } = currentRange;
        const res = await dashboardApi.getExpenseChartData(
          start.toISOString(),
          end.toISOString()
        );

        const raw = res.data?.data ?? [];
        const mapped: ChartDataPoint[] = raw.map((row) => {
          const d = new Date(row.date);
          const label = `${d.getMonth() + 1}/${d.getFullYear().toString().slice(-2)}`;
          return {
            label,
            value: row.totalExpense,
            date: d,
          };
        });

        // nếu backend trả nhiều điểm, sort theo thời gian
        mapped.sort((a, b) => (a.date && b.date ? a.date.getTime() - b.date.getTime() : 0));
        setChartData(mapped);
      } catch (err: any) {
        console.error("Load expense chart error", err);
        const status = err?.response?.status;
        const msg =
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Không thể tải dữ liệu biểu đồ chi tiêu";

        // Nếu backend chưa có endpoint (404) thì coi như "chưa có dữ liệu" chứ không hiện lỗi đỏ
        if (status === 404) {
          setChartData([]);
          setChartError(null);
        } else {
          setChartError(msg);
        }
      } finally {
        setLoadingChart(false);
      }
    };

    loadChart();
  }, [authLoading, currentRange]);

  if (authLoading) {
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
            {greeting}, {displayName}!
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
        <aside className={isSidebarCollapsed ? `${styles.sidebar} ${styles.sidebarCollapsed}` : styles.sidebar}>
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
                className={`${styles.sidebarItem} ${section.id === "chart" ? styles.active : ""}`}
                onClick={() => navigate(section.path)}
              >
                <span className={styles.sidebarBullet} />
                {!isSidebarCollapsed && <span>{section.label}</span>}
              </button>
            ))}
          </nav>
        </aside>

        <main className={styles.main}>
          <section className={styles.sectionBlock}>
            <h1 className={styles.sectionHeading}>Biểu đồ chi tiêu</h1>
            <p className={styles.welcomeText}>
              Theo dõi xu hướng chi tiêu của bạn theo từng tháng và khoảng thời gian tuỳ chọn.
            </p>

            {chartError && (
              <div className={styles.errorBanner}>
                <p>{chartError}</p>
              </div>
            )}

            <div
              style={{
                marginTop: "1.75rem",
                display: "grid",
                gridTemplateColumns: "minmax(0, 2.2fr) minmax(0, 1.1fr)",
                gap: "1.5rem",
                alignItems: "flex-start",
              }}
            >
              <div className={styles.card}>
                <h2
                  className={styles.sectionHeading}
                  style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}
                >
                  Biểu đồ tổng chi tiêu
                </h2>
                <p
                  style={{
                    marginBottom: "1rem",
                    color: "#94a3b8",
                    fontSize: "0.9rem",
                  }}
                >
                  Mỗi điểm là tổng số tiền chi trong tháng tương ứng. Bạn có thể thay đổi
                  khoảng thời gian bên dưới.
                </p>

                {/* Bộ lọc thời gian – style giống trang Tài khoản & số dư */}
                <div style={{ marginBottom: "1.25rem" }}>
                  <div
                    style={{
                      display: "flex",
                      gap: "1rem",
                      flexWrap: "wrap",
                      alignItems: "center",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setFilterType("12months")}
                      style={{
                        padding: "0.5rem 1rem",
                        borderRadius: "6px",
                        border: "1px solid",
                        background:
                          filterType === "12months"
                            ? "rgba(59, 130, 246, 0.2)"
                            : "transparent",
                        borderColor:
                          filterType === "12months"
                            ? "#3b82f6"
                            : "rgba(148, 163, 184, 0.3)",
                        color: filterType === "12months" ? "#3b82f6" : "#94a3b8",
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                    >
                      12 tháng
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterType("6months")}
                      style={{
                        padding: "0.5rem 1rem",
                        borderRadius: "6px",
                        border: "1px solid",
                        background:
                          filterType === "6months"
                            ? "rgba(59, 130, 246, 0.2)"
                            : "transparent",
                        borderColor:
                          filterType === "6months"
                            ? "#3b82f6"
                            : "rgba(148, 163, 184, 0.3)",
                        color: filterType === "6months" ? "#3b82f6" : "#94a3b8",
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                    >
                      6 tháng
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterType("3months")}
                      style={{
                        padding: "0.5rem 1rem",
                        borderRadius: "6px",
                        border: "1px solid",
                        background:
                          filterType === "3months"
                            ? "rgba(59, 130, 246, 0.2)"
                            : "transparent",
                        borderColor:
                          filterType === "3months"
                            ? "#3b82f6"
                            : "rgba(148, 163, 184, 0.3)",
                        color: filterType === "3months" ? "#3b82f6" : "#94a3b8",
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                    >
                      3 tháng
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterType("custom")}
                      style={{
                        padding: "0.5rem 1rem",
                        borderRadius: "6px",
                        border: "1px solid",
                        background:
                          filterType === "custom"
                            ? "rgba(59, 130, 246, 0.2)"
                            : "transparent",
                        borderColor:
                          filterType === "custom"
                            ? "#3b82f6"
                            : "rgba(148, 163, 184, 0.3)",
                        color: filterType === "custom" ? "#3b82f6" : "#94a3b8",
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                    >
                      Tùy chọn
                    </button>
                  </div>

                  {filterType === "custom" && (
                    <div
                      style={{
                        display: "flex",
                        gap: "1rem",
                        marginTop: "1rem",
                        flexWrap: "wrap",
                        alignItems: "center",
                      }}
                    >
                      <label
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.25rem",
                          fontSize: "0.9rem",
                          color: "#e5e7eb",
                        }}
                      >
                        Từ ngày
                        <input
                          type="date"
                          value={customStartDate}
                          onChange={(e) => setCustomStartDate(e.target.value)}
                          style={{
                            padding: "0.5rem",
                            borderRadius: "6px",
                            border: "1px solid rgba(148, 163, 184, 0.3)",
                            background: "rgba(15, 23, 42, 0.7)",
                            color: "#e2e8f0",
                          }}
                        />
                      </label>
                      <label
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.25rem",
                          fontSize: "0.9rem",
                          color: "#e5e7eb",
                        }}
                      >
                        Đến ngày
                        <input
                          type="date"
                          value={customEndDate}
                          onChange={(e) => setCustomEndDate(e.target.value)}
                          style={{
                            padding: "0.5rem",
                            borderRadius: "6px",
                            border: "1px solid rgba(148, 163, 184, 0.3)",
                            background: "rgba(15, 23, 42, 0.7)",
                            color: "#e2e8f0",
                          }}
                        />
                      </label>
                    </div>
                  )}
                </div>

                <LineChart
                  data={chartData}
                  height={360}
                  showGrid
                  showPoints
                  lineColor="#22c55e"
                  fillColor="rgba(34,197,94,0.12)"
                  emptyMessage={
                    loadingChart
                      ? "Đang tải dữ liệu..."
                      : "Chưa có dữ liệu chi tiêu trong khoảng thời gian này"
                  }
                />
              </div>

              {/* Tóm tắt nhanh */}
              <div className={styles.card}>
                <h2
                  className={styles.sectionHeading}
                  style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}
                >
                  Gợi ý sử dụng biểu đồ
                </h2>
                <ul
                  style={{
                    listStyle: "disc",
                    paddingLeft: "1.25rem",
                    color: "#e5e7eb",
                    fontSize: "0.9rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                  }}
                >
                  <li>Xem nhanh các tháng chi tiêu tăng đột biến để tìm nguyên nhân.</li>
                  <li>Kết hợp với mục tiêu tiết kiệm để điều chỉnh ngân sách phù hợp.</li>
                  <li>
                    Dùng bộ lọc <b>Tùy chọn</b> để xem chi tiêu trong các kỳ nghỉ, dịp lễ
                    hoặc các sự kiện đặc biệt.
                  </li>
                </ul>
              </div>
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
        onUpgradeClick={(planId) => navigate(`/payment?plan=${planId}`)}
      />
    </div>
  );
}

