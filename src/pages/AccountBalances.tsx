import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useAvatar } from "../hooks/useAvatar";
import { dashboardApi } from "../api/dashboard.api";
import type {
  MoneySourceGroupedResponseDto,
  CreateMoneySourceRequest,
} from "../api/dashboard.api";
import LineChart, { type ChartDataPoint } from "../components/LineChart";
import UpgradeModal from "../components/UpgradeModal";
import AvatarDropdown from "../components/AvatarDropdown";
import styles from "./Dashboard.module.css";
import homeStyles from "./Homepage.module.css";

interface ChartPoint {
  label: string;
  value: number;
}

function buildMonthlyPoints(totalBalance: number, months: number): ChartPoint[] {
  const now = new Date();
  const points: ChartPoint[] = [];
  const safeTotal = totalBalance || 0;

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const factor = 0.85 + 0.25 * Math.sin((i / Math.max(1, months - 1)) * Math.PI * 2);
    const value = Math.max(0, Math.round(safeTotal * factor));
    points.push({
      label: `${d.getMonth() + 1}/${d.getFullYear().toString().slice(-2)}`,
      value,
    });
  }

  return points;
}

const DASHBOARD_SECTIONS = [
  { id: "overview", label: "Tổng quan", path: "/dashboard" },
  { id: "balances", label: "Tài khoản & số dư", path: "/accounts" },
  { id: "goals", label: "Mục tiêu", path: "/goals" },
  { id: "transactions", label: "Giao dịch", path: "/transactions" },
  { id: "chart", label: "Biểu đồ", path: "/chart" },
] as const;

export default function AccountBalances() {
  const { isLoading: authLoading, signOut, user } = useAuth();
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  const [data, setData] = useState<MoneySourceGroupedResponseDto | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<CreateMoneySourceRequest>({
    accountTypeId: "",
    name: "",
    icon: "account-balance-wallet",
    color: "#51A2FF",
    balance: 0,
    currency: "VND",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAccountTypeHintOpen, setIsAccountTypeHintOpen] = useState(false);

  // Filter giống trang biểu đồ: 12/6/3 tháng + custom
  const [filterType, setFilterType] = useState<"12months" | "6months" | "3months" | "custom">(
    "12months"
  );
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");

  // Tính toán khoảng thời gian dựa trên filter
  const dateRange = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    if (filterType === "custom" && customStartDate && customEndDate) {
      startDate = new Date(customStartDate);
      endDate = new Date(customEndDate);
    } else {
      const months = filterType === "12months" ? 12 : filterType === "6months" ? 6 : 3;
      startDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);
    }

    return { startDate, endDate };
  }, [filterType, customStartDate, customEndDate]);

  useEffect(() => {
    if (authLoading) return;

    let isCancelled = false;

    const load = async () => {
      try {
        setLoadingData(true);
        setError(null);
        const res = await dashboardApi.getMoneySourcesGrouped();
        if (isCancelled) return;
        setData(res.data);
        setLoadingData(false);
      } catch (err: any) {
        if (isCancelled) return;
        console.error("Load balances page error", err);
        setError(
          err?.response?.data?.error ||
            err?.response?.data?.message ||
            err?.message ||
            "Không thể tải dữ liệu tài khoản & số dư"
        );
        setLoadingData(false);
      }
    };

    load();

    return () => {
      isCancelled = true;
    };
  }, [authLoading]);

  // Dữ liệu cho line chart: dựa trên tổng số dư hiện tại + khoảng thời gian
  const chartData: ChartDataPoint[] = useMemo(() => {
    if (!data) return [];

    const total = data.totalBalance ?? 0;

    // Số tháng hiển thị dựa trên filter hoặc custom range
    let months = 6;
    const { startDate, endDate } = dateRange;
    if (filterType === "custom" && startDate && endDate) {
      const diffYears = endDate.getFullYear() - startDate.getFullYear();
      const diffMonths = endDate.getMonth() - startDate.getMonth();
      months = Math.max(1, diffYears * 12 + diffMonths + 1);
    } else if (filterType === "12months") {
      months = 12;
    } else if (filterType === "6months") {
      months = 6;
    } else if (filterType === "3months") {
      months = 3;
    }

    const points = buildMonthlyPoints(total, months);

    // Map sang ChartDataPoint để dùng với LineChart
    return points.map((p, index) => {
      // Cố gắng parse lại label thành date tương đối (không quá quan trọng, chủ yếu để sort)
      const [month, yearSuffix] = p.label.split("/");
      const year = 2000 + parseInt(yearSuffix, 10);
      const date = new Date(year, parseInt(month, 10) - 1, 1);
      return {
        label: p.label,
        value: p.value,
        date: isNaN(date.getTime())
          ? new Date(dateRange.startDate.getTime() + index * 30 * 24 * 60 * 60 * 1000)
          : date,
      };
    });
  }, [data, dateRange, filterType]);

  const handleChangeForm = (field: keyof CreateMoneySourceRequest, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]:
        field === "balance"
          ? Number.isNaN(parseFloat(value)) ? 0 : parseFloat(value)
          : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.accountTypeId || !form.name.trim()) return;

    try {
      setIsSubmitting(true);
      await dashboardApi.createMoneySource(form);
      const res = await dashboardApi.getMoneySourcesGrouped();
      setData(res.data);
      setForm((prev) => ({
        ...prev,
        name: "",
        balance: 0,
      }));
    } catch (err) {
      console.error("Create money source error", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpgradeClick = (planId: string) => {
    // Đã đăng nhập rồi, chuyển đến trang thanh toán
    navigate(`/payment?plan=${planId}`);
    setIsUpgradeModalOpen(false);
  };

  const handleNavigateToSection = (section: string) => {
    const sectionData = DASHBOARD_SECTIONS.find((s) => s.id === section);
    if (sectionData) {
      navigate(sectionData.path);
    }
  };

  // Avatar dùng chung như các trang dashboard khác
  const {
    avatarUrl,
    displayName,
    currentPlan,
    avatarBorderClass,
    premiumStatus,
    planDisplayName,
    planBadgeClass,
  } = useAvatar(user);

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
                className={`${styles.sidebarItem} ${section.id === "balances" ? styles.active : ""}`}
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
            <h1 className={styles.sectionHeading}>Tài khoản & số dư</h1>
            <p style={{ marginBottom: "2rem", color: "#94a3b8" }}>
              Quản lý tất cả các tài khoản và nguồn tiền của bạn. Xem tổng số dư và
              thêm nguồn tiền mới.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1.6fr) minmax(0, 1.2fr)",
                gap: "1.5rem",
                alignItems: "flex-start",
              }}
            >
              {/* Biểu đồ số dư - dùng LineChart giống trang Biểu đồ */}
              <div className={styles.card}>
                <h3 style={{ marginBottom: "1.25rem", fontSize: "1.1rem" }}>
                  Biểu đồ tổng số dư theo thời gian
                </h3>
                <p style={{ marginBottom: "1.25rem", color: "#94a3b8", fontSize: "0.9rem" }}>
                  Xem xu hướng thay đổi tổng số dư tất cả tài khoản của bạn qua từng tháng.
                </p>

                {/* Filter Controls giống ChartPage */}
                <div style={{ marginBottom: "1.25rem" }}>
                  <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
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
                        alignItems: "center",
                      }}
                    >
                      <label
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.25rem",
                          fontSize: "0.9rem",
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
                  emptyMessage="Chưa có dữ liệu số dư để hiển thị. Hãy thêm nguồn tiền để xem biểu đồ."
                />

                <div style={{ marginTop: "1rem", fontSize: "0.85rem", color: "#94a3b8" }}>
                  <strong>Tổng số dư hiện tại: </strong>
                  {(data?.totalBalance ?? 0).toLocaleString("vi-VN")} ₫ •{" "}
                  <strong>Số tài khoản: </strong>
                  {data?.groups.reduce((sum, g) => sum + g.moneySources.length, 0) ?? 0}
                </div>
              </div>

              {/* Form + danh sách nguồn tiền */}
              <div className={styles.card}>
                <h3 style={{ marginBottom: "1.25rem", fontSize: "1.1rem" }}>
                  Thêm nguồn tiền mới
                </h3>

                <form
                  onSubmit={handleSubmit}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                    gap: "1rem",
                  }}
                >
                  <div className={styles.formRow}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "0.75rem",
                      }}
                    >
                      <label style={{ margin: 0 }}>Loại tài khoản</label>
                      <button
                        type={data && data.groups.length > 0 ? "button" : "button"}
                        onClick={() => setIsAccountTypeHintOpen((v) => !v)}
                        style={{
                          padding: "0.25rem 0.7rem",
                          borderRadius: "999px",
                          border: "none",
                          background:
                            "linear-gradient(135deg, rgba(56,189,248,0.95), rgba(129,140,248,0.95))",
                          color: "#0f172a",
                          fontSize: "0.78rem",
                          fontWeight: 600,
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                        }}
                      >
                        + Thêm loại tài khoản
                      </button>
                    </div>
                    <select
                      value={form.accountTypeId}
                      onChange={(e) =>
                        handleChangeForm("accountTypeId", e.target.value)
                      }
                      disabled={!data || data.groups.length === 0}
                    >
                      {!data || data.groups.length === 0 ? (
                        <option value="">Chưa có loại tài khoản (liên hệ admin)</option>
                      ) : (
                        <>
                          <option value="">Chọn loại tài khoản</option>
                          {data.groups.map((g) => (
                            <option key={g.accountTypeId} value={g.accountTypeId}>
                              {g.accountTypeName}
                            </option>
                          ))}
                        </>
                      )}
                    </select>
                    {isAccountTypeHintOpen && (
                      <p
                        style={{
                          marginTop: "0.35rem",
                          fontSize: "0.8rem",
                          color: "rgba(248,250,252,0.9)",
                        }}
                      >
                        Bạn có thể phân loại nguồn tiền theo các nhóm như: Tiền mặt, Ngân hàng, Ví
                        điện tử, Thẻ tín dụng... Các loại này đã được hệ thống chuẩn bị sẵn – chỉ
                        cần chọn mục phù hợp cho nguồn tiền của bạn.
                      </p>
                    )}
                    {!data || data.groups.length === 0 ? (
                      <p
                        style={{
                          marginTop: "0.35rem",
                          fontSize: "0.8rem",
                          color: "rgba(248,250,252,0.8)",
                        }}
                      >
                        Hiện chưa có loại tài khoản nào hiển thị trong hệ thống của bạn.
                      </p>
                    ) : null}
                  </div>

                  <div className={styles.formRow}>
                    <label>Tên nguồn tiền</label>
                    <input
                      id="money-source-name"
                      type="text"
                      placeholder="VD: Ví tiền mặt, Techcombank..."
                      value={form.name}
                      onChange={(e) =>
                        handleChangeForm("name", e.target.value)
                      }
                    />
                  </div>

                  <div className={styles.formRow}>
                    <label>Số dư ban đầu</label>
                    <input
                      type="number"
                      min={0}
                      placeholder="0"
                      value={form.balance ?? 0}
                      onChange={(e) =>
                        handleChangeForm("balance", e.target.value)
                      }
                    />
                  </div>

                  <div className={styles.formRow}>
                    <label>Loại tiền tệ</label>
                    <input
                      type="text"
                      placeholder="VND"
                      value={form.currency}
                      onChange={(e) =>
                        handleChangeForm("currency", e.target.value)
                      }
                    />
                  </div>

                  <div
                    style={{
                      gridColumn: "1 / -1",
                      display: "flex",
                      justifyContent: "flex-end",
                    }}
                  >
                    <button
                      type="submit"
                      className={styles.primaryButton}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Đang lưu..." : "Lưu nguồn tiền"}
                    </button>
                  </div>
                </form>

                <div style={{ marginTop: "1.5rem", borderTop: "1px solid rgba(148,163,184,0.4)", paddingTop: "1rem" }}>
                  <h4 style={{ marginBottom: "0.75rem", fontSize: "0.95rem" }}>
                    Danh sách nguồn tiền
                  </h4>
                  {!data?.groups.length ? (
                    <div className={styles.emptyState}>
                      <p>Chưa có nguồn tiền nào.</p>
                      <button
                        type="button"
                        onClick={() => {
                          const el = document.getElementById("money-source-name");
                          if (el instanceof HTMLInputElement) {
                            el.focus();
                            el.scrollIntoView({ behavior: "smooth", block: "center" });
                          }
                        }}
                        style={{
                          marginTop: "0.5rem",
                          padding: "0.45rem 1.1rem",
                          borderRadius: "999px",
                          border: "none",
                          background:
                            "linear-gradient(135deg, rgba(59,130,246,1), rgba(129,140,248,1))",
                          color: "#e5e7eb",
                          fontWeight: 600,
                          fontSize: "0.85rem",
                          cursor: "pointer",
                          boxShadow: "0 6px 16px rgba(37,99,235,0.5)",
                        }}
                      >
                        + Thêm nguồn tiền
                      </button>
                    </div>
                  ) : (
                    <ul style={{ display: "flex", flexDirection: "column", gap: "0.6rem", listStyle: "none", padding: 0, margin: 0 }}>
                      {data?.groups.flatMap((g) =>
                        g.moneySources.map((ms) => (
                          <li
                            key={ms.id}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              fontSize: "0.9rem",
                              color: "rgba(226,232,240,0.9)",
                            }}
                          >
                            <div>
                              <div>{ms.name}</div>
                              <div
                                style={{
                                  fontSize: "0.8rem",
                                  color: "rgba(148,163,184,0.95)",
                                }}
                              >
                                {g.accountTypeName} • {ms.currency}
                              </div>
                            </div>
                            <div>{ms.balance.toLocaleString("vi-VN")} ₫</div>
                          </li>
                        ))
                      )}
                    </ul>
                  )}
                </div>
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
        onUpgradeClick={handleUpgradeClick}
      />
    </div>
  );
}


