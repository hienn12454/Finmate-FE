import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { dashboardApi } from "../api/dashboard.api";
import type {
  MoneySourceGroupedResponseDto,
  OverviewReportDto,
  TransactionDto,
  TransactionTypeDto,
  CategoryDto,
  MoneySourceDto,
} from "../api/dashboard.api";
import styles from "./Dashboard.module.css";

interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
}

const DASHBOARD_SECTIONS = [
  { id: "overview", label: "Tổng quan" },
  { id: "balances", label: "Tài khoản & số dư" },
  { id: "goals", label: "Mục tiêu" },
  { id: "transactions", label: "Giao dịch" },
  { id: "chart", label: "Biểu đồ" },
] as const;

export default function Dashboard() {
  const { user, isLoading: authLoading, signOut } = useAuth();
  const [greeting, setGreeting] = useState("");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const [overview, setOverview] = useState<OverviewReportDto | null>(null);
  const [moneySourcesGrouped, setMoneySourcesGrouped] =
    useState<MoneySourceGroupedResponseDto | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<TransactionDto[]>([]);
  const [transactionTypes, setTransactionTypes] = useState<TransactionTypeDto[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [moneySources, setMoneySources] = useState<MoneySourceDto[]>([]);

  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [goals, setGoals] = useState<Goal[]>([]);
  const [newGoalName, setNewGoalName] = useState("");
  const [newGoalTarget, setNewGoalTarget] = useState("");
  const [newGoalCurrent, setNewGoalCurrent] = useState("");

  const [newTxTypeId, setNewTxTypeId] = useState<string>("");
  const [newTxCategoryId, setNewTxCategoryId] = useState<string>("");
  const [newTxMoneySourceId, setNewTxMoneySourceId] = useState<string>("");
  const [newTxAmount, setNewTxAmount] = useState<string>("");
  const [newTxDescription, setNewTxDescription] = useState<string>("");

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

        const [
          overviewRes,
          moneySourcesGroupedRes,
          recentTxRes,
          txTypesRes,
          moneySourcesRes,
        ] = await Promise.all([
          dashboardApi.getOverview(),
          dashboardApi.getMoneySourcesGrouped(),
          dashboardApi.getRecentTransactions(1, 5),
          dashboardApi.getTransactionTypes(),
          dashboardApi.getMoneySources(),
        ]);

        if (isCancelled) return;

        setOverview(overviewRes.data);
        setMoneySourcesGrouped(moneySourcesGroupedRes.data);
        setRecentTransactions(recentTxRes.data.transactions);
        setTransactionTypes(txTypesRes.data);
        setMoneySources(moneySourcesRes.data);

        // Mặc định chọn loại giao dịch đầu tiên + category theo loại đó
        const defaultTxType = txTypesRes.data[0];
        if (defaultTxType) {
          setNewTxTypeId(defaultTxType.id);
          const categoriesRes = await dashboardApi.getCategories(defaultTxType.id);
          if (!isCancelled) {
            setCategories(categoriesRes.data);
            const defaultCategory = categoriesRes.data[0];
            if (defaultCategory) {
              setNewTxCategoryId(defaultCategory.id);
            }
          }
        }

        const defaultMoneySource = moneySourcesRes.data[0];
        if (defaultMoneySource) {
          setNewTxMoneySourceId(defaultMoneySource.id);
        }

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

  const handleChangeTxType = async (transactionTypeId: string) => {
    setNewTxTypeId(transactionTypeId);
    try {
      const res = await dashboardApi.getCategories(transactionTypeId);
      setCategories(res.data);
      setNewTxCategoryId(res.data[0]?.id ?? "");
    } catch (err) {
      console.error("Load categories error", err);
    }
  };

  const handleAddGoal = (e: FormEvent) => {
    e.preventDefault();
    const target = parseFloat(newGoalTarget || "0");
    const current = parseFloat(newGoalCurrent || "0");
    if (!newGoalName.trim() || target <= 0) return;

    const goal: Goal = {
      id: crypto.randomUUID?.() ?? String(Date.now()),
      name: newGoalName.trim(),
      targetAmount: target,
      currentAmount: current < 0 ? 0 : current,
    };

    setGoals((prev) => [...prev, goal]);
    setNewGoalName("");
    setNewGoalTarget("");
    setNewGoalCurrent("");
  };

  const handleCreateTransaction = async (e: FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(newTxAmount || "0");
    if (!newTxTypeId || !newTxCategoryId || !newTxMoneySourceId || amount === 0) {
      return;
    }

    try {
      await dashboardApi.createTransaction({
        transactionTypeId: newTxTypeId,
        categoryId: newTxCategoryId,
        moneySourceId: newTxMoneySourceId,
        amount,
        transactionDate: new Date().toISOString(),
        description: newTxDescription || undefined,
      });

      // Refresh nhanh: overview + balances + recent transactions
      const [overviewRes, moneySourcesGroupedRes, recentTxRes] = await Promise.all([
        dashboardApi.getOverview(),
        dashboardApi.getMoneySourcesGrouped(),
        dashboardApi.getRecentTransactions(1, 5),
      ]);
      setOverview(overviewRes.data);
      setMoneySourcesGrouped(moneySourcesGroupedRes.data);
      setRecentTransactions(recentTxRes.data.transactions);

      setNewTxAmount("");
      setNewTxDescription("");
    } catch (err) {
      console.error("Create transaction error", err);
    }
  };

  const handleScrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  if (authLoading || loadingData) {
    return (
      <div className={styles.container}>
        <div className={styles.waterGradient} />
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Đang tải dữ liệu...</p>
          <span className={styles.loadingSubtext}>Vui lòng đợi một chút</span>
        </div>
      </div>
    );
  }

  const displayName =
    user?.fullName || user?.email?.split("@")[0] || "Người dùng";

  const avatarUrl =
    user?.avatarUrl && user.avatarUrl.trim().length > 0
      ? user.avatarUrl
      : "data:image/jpeg;base64,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";

  return (
    <div className={styles.container}>
      <div className={styles.waterGradient} />
      <header className={styles.header}>
        <Link to="/" className={styles.logo}>
          <span className={styles.logoText}>Finmate</span>
        </Link>
        <div className={styles.headerRight}>
          <div className={styles.avatarWrapper}>
            <img
              src={avatarUrl}
              alt={displayName}
              className={styles.avatarImage}
            />
          </div>
          <span className={styles.userName}>
            {greeting}, {displayName}! 👋
          </span>
          <button onClick={handleSignOut} className={styles.signOutButton}>
            Đăng xuất
          </button>
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
                className={styles.sidebarItem}
                onClick={() => handleScrollToSection(section.id)}
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

          <section id="overview" className={styles.sectionBlock}>
            <div className={styles.welcomeSection}>
              <h1>Dashboard</h1>
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
          </section>

          <section id="balances" className={styles.sectionBlock}>
            <h2 className={styles.sectionHeading}>Tài khoản & số dư</h2>
            {moneySourcesGrouped?.groups?.length ? (
              <div className={styles.balancesGrid}>
                {moneySourcesGrouped.groups.map((group) => (
                  <div
                    key={group.accountTypeId}
                    className={styles.balanceGroupCard}
                  >
                    <div className={styles.balanceGroupHeader}>
                      <h3>{group.accountTypeName}</h3>
                      <span className={styles.balanceGroupTotal}>
                        {group.totalBalance.toLocaleString("vi-VN")} ₫
                      </span>
                    </div>
                    <ul className={styles.balanceList}>
                      {group.moneySources.map((ms) => (
                        <li key={ms.id} className={styles.balanceItem}>
                          <span className={styles.balanceItemName}>
                            {ms.name}
                          </span>
                          <span className={styles.balanceItemAmount}>
                            {ms.balance.toLocaleString("vi-VN")} ₫
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.card}>
                <h3>Chưa có nguồn tiền nào</h3>
                <p className={styles.emptyStateText}>
                  Hãy tạo nguồn tiền ở màn Account để theo dõi số dư chi tiết.
                </p>
              </div>
            )}
          </section>

          <section id="goals" className={styles.sectionBlock}>
            <h2 className={styles.sectionHeading}>Mục tiêu tài chính</h2>
            <div className={styles.goalsLayout}>
              <form className={styles.card} onSubmit={handleAddGoal}>
                <h3>Tạo mục tiêu mới (lưu cục bộ)</h3>
                <div className={styles.formRow}>
                  <label>
                    Tên mục tiêu
                    <input
                      type="text"
                      value={newGoalName}
                      onChange={(e) => setNewGoalName(e.target.value)}
                      placeholder="VD: Quỹ khẩn cấp, Mua xe..."
                    />
                  </label>
                </div>
                <div className={styles.formRowInline}>
                  <label>
                    Số tiền mục tiêu
                    <input
                      type="number"
                      min={0}
                      value={newGoalTarget}
                      onChange={(e) => setNewGoalTarget(e.target.value)}
                      placeholder="10000000"
                    />
                  </label>
                  <label>
                    Đã đạt được
                    <input
                      type="number"
                      min={0}
                      value={newGoalCurrent}
                      onChange={(e) => setNewGoalCurrent(e.target.value)}
                      placeholder="0"
                    />
                  </label>
                </div>
                <button type="submit" className={styles.primaryButton}>
                  Lưu mục tiêu
                </button>
              </form>

              <div className={styles.card}>
                <h3>Danh sách mục tiêu</h3>
                {goals.length === 0 ? (
                  <div className={styles.emptyState}>
                    <p>Chưa có mục tiêu nào. Hãy thêm mục tiêu bên cạnh.</p>
                  </div>
                ) : (
                  <ul className={styles.goalList}>
                    {goals.map((g) => {
                      const progress =
                        g.targetAmount > 0
                          ? Math.min(
                              100,
                              Math.round(
                                (g.currentAmount / g.targetAmount) * 100
                              )
                            )
                          : 0;
                      return (
                        <li key={g.id} className={styles.goalItem}>
                          <div className={styles.goalHeader}>
                            <span className={styles.goalName}>{g.name}</span>
                            <span className={styles.goalAmount}>
                              {g.currentAmount.toLocaleString("vi-VN")} /{" "}
                              {g.targetAmount.toLocaleString("vi-VN")} ₫
                            </span>
                          </div>
                          <div className={styles.goalProgressBar}>
                            <div
                              className={styles.goalProgressFill}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className={styles.goalProgressText}>
                            {progress}% hoàn thành
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          </section>

          <section id="transactions" className={styles.sectionBlock}>
            <h2 className={styles.sectionHeading}>Giao dịch</h2>
            <div className={styles.contentGrid}>
              <form className={styles.card} onSubmit={handleCreateTransaction}>
                <h3>Thêm giao dịch nhanh</h3>
                <div className={styles.formRow}>
                  <label>
                    Loại giao dịch
                    <select
                      value={newTxTypeId}
                      onChange={(e) => handleChangeTxType(e.target.value)}
                    >
                      {transactionTypes.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className={styles.formRow}>
                  <label>
                    Danh mục
                    <select
                      value={newTxCategoryId}
                      onChange={(e) => setNewTxCategoryId(e.target.value)}
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className={styles.formRow}>
                  <label>
                    Nguồn tiền
                    <select
                      value={newTxMoneySourceId}
                      onChange={(e) => setNewTxMoneySourceId(e.target.value)}
                    >
                      {moneySources.map((ms) => (
                        <option key={ms.id} value={ms.id}>
                          {ms.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className={styles.formRowInline}>
                  <label>
                    Số tiền
                    <input
                      type="number"
                      step="1000"
                      value={newTxAmount}
                      onChange={(e) => setNewTxAmount(e.target.value)}
                      placeholder="0"
                    />
                  </label>
                </div>
                <div className={styles.formRow}>
                  <label>
                    Ghi chú
                    <input
                      type="text"
                      value={newTxDescription}
                      onChange={(e) => setNewTxDescription(e.target.value)}
                      placeholder="VD: Ăn trưa, Lương tháng 1..."
                    />
                  </label>
                </div>
                <button type="submit" className={styles.primaryButton}>
                  Lưu giao dịch
                </button>
              </form>

              <div className={styles.card}>
                <h3>Giao dịch gần đây</h3>
                {recentTransactions.length === 0 ? (
                  <div className={styles.emptyState}>
                    <p>Chưa có giao dịch nào</p>
                  </div>
                ) : (
                  <ul className={styles.transactionList}>
                    {recentTransactions.map((tx) => (
                      <li key={tx.id} className={styles.transactionItem}>
                        <div className={styles.transactionMain}>
                          <span className={styles.transactionName}>
                            {tx.categoryName}
                          </span>
                          <span
                            className={
                              tx.isIncome
                                ? styles.transactionAmountIncome
                                : styles.transactionAmountExpense
                            }
                          >
                            {tx.isIncome ? "+" : "-"}
                            {tx.amount.toLocaleString("vi-VN")} ₫
                          </span>
                        </div>
                        <div className={styles.transactionSub}>
                          <span>{tx.moneySourceName}</span>
                          <span>
                            {new Date(tx.transactionDate).toLocaleString(
                              "vi-VN",
                              { hour12: false }
                            )}
                          </span>
                        </div>
                        {tx.description && (
                          <div className={styles.transactionNote}>
                            {tx.description}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </section>

          <section id="chart" className={styles.sectionBlock}>
            <h2 className={styles.sectionHeading}>Biểu đồ chi tiêu theo danh mục</h2>
            <div className={styles.card}>
              {overview?.categoryStats?.length ? (
                <div className={styles.chartPlaceholder}>
                  {overview.categoryStats.map((c) => (
                    <div key={c.categoryId} className={styles.chartRow}>
                      <div className={styles.chartLabel}>
                        <span
                          className={styles.chartColorDot}
                          style={{ backgroundColor: c.color || "#4b5563" }}
                        />
                        <span>{c.categoryName}</span>
                      </div>
                      <div className={styles.chartBarWrapper}>
                        <div
                          className={styles.chartBar}
                          style={{
                            width: `${Math.max(5, c.percentage)}%`,
                          }}
                        />
                      </div>
                      <span className={styles.chartValue}>
                        {c.amount.toLocaleString("vi-VN")} ₫ (
                        {c.percentage.toFixed(1)}%)
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <p>
                    Chưa có dữ liệu. Khi bạn thêm giao dịch, biểu đồ sẽ hiển thị
                    các cột theo danh mục.
                  </p>
                </div>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
