import { FormEvent, useEffect, useState } from "react";
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

  return (
    <div className={styles.container}>
      <div className={styles.waterGradient} />
      <header className={styles.header}>
        <div className={styles.logo}>
          <span className={styles.logoText}>Finmate</span>
        </div>
        <div className={styles.headerRight}>
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
