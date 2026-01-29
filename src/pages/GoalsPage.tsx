import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import UpgradeModal from "../components/UpgradeModal";
import AvatarDropdown from "../components/AvatarDropdown";
import { useAuth } from "../hooks/useAuth";
import { useAvatar } from "../hooks/useAvatar";
import { dashboardApi, type GoalDto } from "../api/dashboard.api";
import styles from "./Dashboard.module.css";
import homeStyles from "./Homepage.module.css";

type GoalContribution = {
  date: string;
  amount: number;
};

const DASHBOARD_SECTIONS = [
  { id: "overview", label: "Tổng quan", path: "/dashboard" },
  { id: "balances", label: "Tài khoản & số dư", path: "/accounts" },
  { id: "goals", label: "Mục tiêu", path: "/goals" },
  { id: "transactions", label: "Giao dịch", path: "/transactions" },
  { id: "chart", label: "Biểu đồ", path: "/chart" },
] as const;

export default function GoalsPage() {
  const { isLoading: authLoading, signOut, user } = useAuth();
  const navigate = useNavigate();
  const [greeting, setGreeting] = useState("");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  const {
    avatarUrl,
    displayName,
    currentPlan,
    avatarBorderClass,
    premiumStatus,
    planDisplayName,
    planBadgeClass,
  } = useAvatar(user);

  const [goals, setGoals] = useState<GoalDto[]>([]);
  const [loadingGoals, setLoadingGoals] = useState(true);
  const [goalsError, setGoalsError] = useState<string | null>(null);
  const [form, setForm] = useState<{ name: string; targetAmount: string; description: string }>({
    name: "",
    targetAmount: "",
    description: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  const [selectedGoalId, setSelectedGoalId] = useState<string>("");
  const [contributionAmount, setContributionAmount] = useState<string>("");
  const [contributionDate, setContributionDate] = useState<string>(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [contributionHistory, setContributionHistory] = useState<
    Record<string, GoalContribution[]>
  >({});
  const [isSavingContribution, setIsSavingContribution] = useState(false);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Chào buổi sáng");
    else if (hour < 18) setGreeting("Chào buổi chiều");
    else setGreeting("Chào buổi tối");
  }, []);

  // Load / lưu lịch sử góp tiền mục tiêu từ localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("finmate_goal_contributions_v1");
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, GoalContribution[]>;
        setContributionHistory(parsed);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        "finmate_goal_contributions_v1",
        JSON.stringify(contributionHistory)
      );
    } catch {
      // ignore
    }
  }, [contributionHistory]);

  // Load danh sách mục tiêu
  useEffect(() => {
    if (authLoading) return;

    const loadGoals = async () => {
      try {
        setLoadingGoals(true);
        setGoalsError(null);
        const res = await dashboardApi.getGoals();
        setGoals(res.data ?? []);
      } catch (err: any) {
        console.error("Load goals error", err);
        const status = err?.response?.status;
        const msg =
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Không thể tải danh sách mục tiêu";

        // Backend chưa có /goals (404) -> coi như chưa có dữ liệu, không show lỗi đỏ
        if (status === 404) {
          setGoals([]);
          setGoalsError(null);
        } else {
          setGoalsError(msg);
        }
      } finally {
        setLoadingGoals(false);
      }
    };

    loadGoals();
  }, [authLoading]);

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.targetAmount.trim()) return;

    const target = Number(form.targetAmount.replace(/\D/g, ""));
    if (!Number.isFinite(target) || target <= 0) return;

    try {
      setIsSaving(true);
      setGoalsError(null);
      const res = await dashboardApi.createGoal({
        title: form.name.trim(),
        description: form.description.trim() || undefined,
        targetAmount: target,
      });
      setGoals((prev) => [res.data, ...prev]);
      setForm({ name: "", targetAmount: "", description: "" });
    } catch (err: any) {
      console.error("Create goal error", err);
      const status = err?.response?.status;
      // Nếu backend chưa hỗ trợ (404) thì vẫn tạo mục tiêu "ảo" trên FE để user thấy kết quả
      if (status === 404) {
        const now = new Date().toISOString();
        setGoals((prev) => [
          {
            id: `local-${Date.now()}`,
            userId: user?.id ?? "local",
            title: form.name.trim(),
            description: form.description.trim() || undefined,
            targetAmount: target,
            currentAmount: 0,
            targetDate: null,
            status: "Active",
            currency: "VND",
            icon: "flag",
            color: "#51A2FF",
            isActive: true,
            progressPercentage: 0,
            createdAt: now,
            updatedAt: now,
          },
          ...prev,
        ]);
        setForm({ name: "", targetAmount: "", description: "" });
      } else {
        const msg =
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Không thể tạo mục tiêu mới";
        setGoalsError(msg);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddContribution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoalId) return;

    const raw = contributionAmount.replace(/\D/g, "");
    const amount = Number(raw);
    if (!Number.isFinite(amount) || amount <= 0) return;

    const goal = goals.find((g) => g.id === selectedGoalId);
    if (!goal) return;

    const newTotal = goal.currentAmount + amount;

    try {
      setIsSavingContribution(true);
      setGoalsError(null);

      let updatedGoal: GoalDto | null = null;
      try {
        const res = await dashboardApi.updateGoal(goal.id, {
          currentAmount: newTotal,
        });
        updatedGoal = res.data;
      } catch (err: any) {
        const status = err?.response?.status;
        // Nếu backend chưa hỗ trợ (404) thì chỉ cập nhật trên FE
        if (status === 404) {
          updatedGoal = {
            ...goal,
            currentAmount: newTotal,
            updatedAt: new Date().toISOString(),
          };
        } else {
          throw err;
        }
      }

      if (updatedGoal) {
        setGoals((prev) => prev.map((g) => (g.id === updatedGoal!.id ? updatedGoal! : g)));
      }

      const date = contributionDate || new Date().toISOString().slice(0, 10);
      setContributionHistory((prev) => {
        const list = prev[selectedGoalId] ?? [];
        return {
          ...prev,
          [selectedGoalId]: [...list, { date, amount }],
        };
      });
      setContributionAmount("");
    } catch (err: any) {
      console.error("Add contribution error", err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Không thể ghi nhận khoản góp tiền";
      setGoalsError(msg);
    } finally {
      setIsSavingContribution(false);
    }
  };

  const selectedContributions = useMemo(
    () => contributionHistory[selectedGoalId] ?? [],
    [contributionHistory, selectedGoalId]
  );

  const contributionChartPoints = useMemo(() => {
    if (!selectedContributions.length) return [];
    const sorted = [...selectedContributions].sort((a, b) => a.date.localeCompare(b.date));
    let total = 0;
    return sorted.map((c) => {
      total += c.amount;
      return { date: c.date, total };
    });
  }, [selectedContributions]);

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
                className={`${styles.sidebarItem} ${section.id === "goals" ? styles.active : ""}`}
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
            <h1 className={styles.sectionHeading}>Mục tiêu tài chính</h1>
            <p className={styles.welcomeText}>
              Đặt mục tiêu và theo dõi tiến độ tiết kiệm cho từng mục tiêu quan trọng của bạn.
            </p>

            {goalsError && (
              <div className={styles.errorBanner}>
                <p>{goalsError}</p>
              </div>
            )}

            <div
              style={{
                marginTop: "1.75rem",
                display: "grid",
                gridTemplateColumns: "minmax(0, 1.8fr) minmax(0, 1.2fr)",
                gap: "1.5rem",
                alignItems: "flex-start",
              }}
            >
              {/* Danh sách mục tiêu */}
              <div>
                <h2
                  className={styles.sectionHeading}
                  style={{ fontSize: "1.25rem", marginBottom: "0.75rem" }}
                >
                  Danh sách mục tiêu
                </h2>

                {loadingGoals ? (
                  <div className={styles.balanceGroupCard}>
                    <p>Đang tải danh sách mục tiêu...</p>
                  </div>
                ) : goals.length === 0 ? (
                  <div className={styles.balanceGroupCard}>
                    <p>Chưa có mục tiêu nào. Hãy tạo mục tiêu đầu tiên ở bên phải.</p>
                  </div>
                ) : (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                      gap: "1rem",
                    }}
                  >
                    {goals.map((goal) => {
                      const percent =
                        goal.targetAmount > 0
                          ? Math.min(
                              100,
                              Math.round((goal.currentAmount / goal.targetAmount) * 100)
                            )
                          : 0;
                      return (
                        <div key={goal.id} className={styles.balanceGroupCard}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              marginBottom: "0.5rem",
                            }}
                          >
                            <h3
                              style={{
                                margin: 0,
                                fontSize: "1rem",
                                color: "#f9fafb",
                              }}
                            >
                              {goal.title}
                            </h3>
                            <span
                              style={{
                                fontSize: "0.8rem",
                                color: "#a5b4fc",
                                fontWeight: 600,
                              }}
                            >
                              {percent}% hoàn thành
                            </span>
                          </div>
                          <div
                            style={{
                              position: "relative",
                              height: "8px",
                              borderRadius: "999px",
                              background: "rgba(15,23,42,0.8)",
                              overflow: "hidden",
                              marginBottom: "0.5rem",
                            }}
                          >
                            <div
                              style={{
                                position: "absolute",
                                inset: 0,
                                transformOrigin: "left",
                                width: `${percent}%`,
                                background:
                                  "linear-gradient(90deg,#22c55e,#4ade80,#a7f3d0)",
                                boxShadow: "0 0 12px rgba(34,197,94,0.6)",
                              }}
                            />
                          </div>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              fontSize: "0.85rem",
                              color: "rgba(148,163,184,0.9)",
                            }}
                          >
                            <span>
                              Hiện có:{" "}
                              <strong>
                                {goal.currentAmount.toLocaleString("vi-VN")} ₫
                              </strong>
                            </span>
                            <span>
                              Mục tiêu:{" "}
                              <strong>
                                {goal.targetAmount.toLocaleString("vi-VN")} ₫
                              </strong>
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Cột bên phải: thêm mục tiêu + ghi nhận tiền bỏ vào quỹ */}
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {/* Form thêm mục tiêu */}
                <div className={styles.balanceGroupCard}>
                  <h2
                    className={styles.sectionHeading}
                    style={{ fontSize: "1.25rem", marginBottom: "0.75rem" }}
                  >
                    Thêm mục tiêu mới
                  </h2>
                  <p
                    style={{
                      fontSize: "0.9rem",
                      color: "rgba(209, 213, 219, 0.9)",
                      marginBottom: "0.75rem",
                    }}
                  >
                    Ví dụ: “Quỹ dự phòng khẩn cấp”, “Mua laptop mới”, “Đi du lịch Đà Lạt”.
                  </p>
                  <form
                    onSubmit={handleCreateGoal}
                    style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      <label
                        htmlFor="goal-name"
                        style={{ fontSize: "0.85rem", color: "#e5e7eb", fontWeight: 500 }}
                      >
                        Tên mục tiêu
                      </label>
                      <input
                        id="goal-name"
                        type="text"
                        value={form.name}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, name: e.target.value }))
                        }
                        placeholder="Ví dụ: Quỹ du lịch Nhật Bản"
                        style={{
                          borderRadius: "10px",
                          padding: "0.6rem 0.75rem",
                          border: "1px solid rgba(148,163,184,0.5)",
                          background: "rgba(15,23,42,0.75)",
                          color: "#f9fafb",
                          fontSize: "0.9rem",
                        }}
                      />
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      <label
                        htmlFor="goal-description"
                        style={{ fontSize: "0.85rem", color: "#e5e7eb", fontWeight: 500 }}
                      >
                        Mô tả (tuỳ chọn)
                      </label>
                      <textarea
                        id="goal-description"
                        rows={2}
                        value={form.description}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, description: e.target.value }))
                        }
                        placeholder="Ví dụ: Nạp game mỗi tháng, du lịch cuối năm..."
                        style={{
                          borderRadius: "10px",
                          padding: "0.6rem 0.75rem",
                          border: "1px solid rgba(148,163,184,0.5)",
                          background: "rgba(15,23,42,0.75)",
                          color: "#f9fafb",
                          fontSize: "0.9rem",
                          resize: "vertical",
                          minHeight: "56px",
                        }}
                      />
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      <label
                        htmlFor="goal-target"
                        style={{ fontSize: "0.85rem", color: "#e5e7eb", fontWeight: 500 }}
                      >
                        Số tiền mục tiêu (₫)
                      </label>
                      <input
                        id="goal-target"
                        type="number"
                        min={0}
                        value={form.targetAmount}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, targetAmount: e.target.value }))
                        }
                        placeholder="Ví dụ: 20000000"
                        style={{
                          borderRadius: "10px",
                          padding: "0.6rem 0.75rem",
                          border: "1px solid rgba(148,163,184,0.5)",
                          background: "rgba(15,23,42,0.75)",
                          color: "#f9fafb",
                          fontSize: "0.9rem",
                        }}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSaving}
                      style={{
                        marginTop: "0.5rem",
                        alignSelf: "flex-start",
                        padding: "0.6rem 1.3rem",
                        borderRadius: "999px",
                        border: "none",
                        background:
                          "linear-gradient(135deg, #22c55e, #4ade80, #a7f3d0)",
                        color: "#022c22",
                        fontWeight: 700,
                        fontSize: "0.95rem",
                        cursor: isSaving ? "wait" : "pointer",
                        boxShadow: "0 8px 20px rgba(16,185,129,0.5)",
                      }}
                    >
                      {isSaving ? "Đang lưu..." : "Lưu mục tiêu"}
                    </button>
                  </form>
                </div>

                {/* Ghi nhận tiền bỏ vào quỹ + biểu đồ tiến độ */}
                <div className={styles.balanceGroupCard}>
                  <h2
                    className={styles.sectionHeading}
                    style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}
                  >
                    Bỏ tiền vào quỹ
                  </h2>
                  {goals.length === 0 ? (
                    <p style={{ fontSize: "0.9rem", color: "rgba(209,213,219,0.9)" }}>
                      Hãy tạo ít nhất một mục tiêu trước khi ghi nhận tiền bỏ vào quỹ.
                    </p>
                  ) : (
                    <>
                      <form
                        onSubmit={handleAddContribution}
                        style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
                      >
                        <div
                          style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}
                        >
                          <label
                            htmlFor="goal-select"
                            style={{ fontSize: "0.85rem", color: "#e5e7eb", fontWeight: 500 }}
                          >
                            Chọn mục tiêu
                          </label>
                          <select
                            id="goal-select"
                            value={selectedGoalId}
                            onChange={(e) => setSelectedGoalId(e.target.value)}
                            style={{
                              borderRadius: "10px",
                              padding: "0.6rem 0.75rem",
                              border: "1px solid rgba(148,163,184,0.5)",
                              background: "rgba(15,23,42,0.75)",
                              color: "#f9fafb",
                              fontSize: "0.9rem",
                            }}
                          >
                            <option value="">-- Chọn mục tiêu --</option>
                            {goals.map((g) => (
                              <option key={g.id} value={g.id}>
                                {g.title}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div
                          style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}
                        >
                          <label
                            htmlFor="contribution-amount"
                            style={{ fontSize: "0.85rem", color: "#e5e7eb", fontWeight: 500 }}
                          >
                            Số tiền bỏ vào hôm nay (₫)
                          </label>
                          <input
                            id="contribution-amount"
                            type="number"
                            min={0}
                            value={contributionAmount}
                            onChange={(e) => setContributionAmount(e.target.value)}
                            placeholder="Ví dụ: 500000"
                            style={{
                              borderRadius: "10px",
                              padding: "0.6rem 0.75rem",
                              border: "1px solid rgba(148,163,184,0.5)",
                              background: "rgba(15,23,42,0.75)",
                              color: "#f9fafb",
                              fontSize: "0.9rem",
                            }}
                          />
                        </div>

                        <div
                          style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}
                        >
                          <label
                            htmlFor="contribution-date"
                            style={{ fontSize: "0.85rem", color: "#e5e7eb", fontWeight: 500 }}
                          >
                            Ngày góp
                          </label>
                          <input
                            id="contribution-date"
                            type="date"
                            value={contributionDate}
                            onChange={(e) => setContributionDate(e.target.value)}
                            style={{
                              borderRadius: "10px",
                              padding: "0.6rem 0.75rem",
                              border: "1px solid rgba(148,163,184,0.5)",
                              background: "rgba(15,23,42,0.75)",
                              color: "#f9fafb",
                              fontSize: "0.9rem",
                            }}
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={isSavingContribution || !selectedGoalId}
                          style={{
                            marginTop: "0.5rem",
                            alignSelf: "flex-start",
                            padding: "0.6rem 1.3rem",
                            borderRadius: "999px",
                            border: "none",
                            background:
                              "linear-gradient(135deg, #38bdf8, #818cf8, #c4b5fd)",
                            color: "#0f172a",
                            fontWeight: 700,
                            fontSize: "0.95rem",
                            cursor: isSavingContribution ? "wait" : "pointer",
                            boxShadow: "0 8px 20px rgba(59,130,246,0.5)",
                          }}
                        >
                          {isSavingContribution ? "Đang lưu..." : "Lưu khoản góp tiền"}
                        </button>
                      </form>

                      {selectedGoalId && contributionChartPoints.length > 0 && (
                        <div
                          style={{
                            marginTop: "1rem",
                            paddingTop: "0.75rem",
                            borderTop: "1px dashed rgba(148,163,184,0.4)",
                          }}
                        >
                          <p
                            style={{
                              fontSize: "0.85rem",
                              color: "rgba(209,213,219,0.9)",
                              marginBottom: "0.5rem",
                            }}
                          >
                            Tiến độ góp tiền cho mục tiêu này:
                          </p>
                          <div
                            style={{
                              width: "100%",
                              height: "120px",
                              borderRadius: "12px",
                              background: "rgba(15,23,42,0.9)",
                              padding: "0.5rem 0.75rem",
                              boxSizing: "border-box",
                            }}
                          >
                            {(() => {
                              const width = 260;
                              const height = 80;
                              const maxTotal = Math.max(
                                ...contributionChartPoints.map((p) => p.total),
                                0
                              );
                              const len = contributionChartPoints.length;
                              const pathD = contributionChartPoints
                                .map((p, idx) => {
                                  const x =
                                    len === 1
                                      ? width / 2
                                      : (idx / (len - 1)) * width;
                                  const y =
                                    height -
                                    (maxTotal > 0 ? (p.total / maxTotal) * height : 0);
                                  return `${idx === 0 ? "M" : "L"}${x},${y}`;
                                })
                                .join(" ");

                              return (
                                <svg
                                  viewBox={`0 0 ${width} ${height}`}
                                  width="100%"
                                  height="100%"
                                  preserveAspectRatio="none"
                                >
                                  <defs>
                                    <linearGradient
                                      id="goalProgressGradient"
                                      x1="0"
                                      y1="0"
                                      x2="0"
                                      y2="1"
                                    >
                                      <stop offset="0%" stopColor="#22c55e" stopOpacity="0.9" />
                                      <stop
                                        offset="100%"
                                        stopColor="#22c55e"
                                        stopOpacity="0.1"
                                      />
                                    </linearGradient>
                                  </defs>
                                  <path
                                    d={pathD}
                                    fill="none"
                                    stroke="#4ade80"
                                    strokeWidth={2}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                  <path
                                    d={`${pathD} L${width},${height} L0,${height} Z`}
                                    fill="url(#goalProgressGradient)"
                                    opacity={0.55}
                                  />
                                </svg>
                              );
                            })()}
                          </div>
                        </div>
                      )}
                    </>
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
        onUpgradeClick={(planId) => navigate(`/payment?plan=${planId}`)}
      />
    </div>
  );
}

