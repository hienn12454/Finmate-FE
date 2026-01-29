import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import UpgradeModal from "../components/UpgradeModal";
import AvatarDropdown from "../components/AvatarDropdown";
import { useAuth } from "../hooks/useAuth";
import { useAvatar } from "../hooks/useAvatar";
import {
  dashboardApi,
  type TransactionDto,
  type TransactionListResponseDto,
  type MoneySourceDto,
  type TransactionTypeDto,
  type CategoryDto,
} from "../api/dashboard.api";
import styles from "./Dashboard.module.css";
import homeStyles from "./Homepage.module.css";

const DASHBOARD_SECTIONS = [
  { id: "overview", label: "Tổng quan", path: "/dashboard" },
  { id: "balances", label: "Tài khoản & số dư", path: "/accounts" },
  { id: "goals", label: "Mục tiêu", path: "/goals" },
  { id: "transactions", label: "Giao dịch", path: "/transactions" },
  { id: "chart", label: "Biểu đồ", path: "/chart" },
] as const;

export default function TransactionsPage() {
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

  const [transactions, setTransactions] = useState<TransactionDto[]>([]);
  const [loadingTx, setLoadingTx] = useState(true);
  const [txError, setTxError] = useState<string | null>(null);

  const [page] = useState(1);
  const [pageSize] = useState(20);

  const [moneySources, setMoneySources] = useState<MoneySourceDto[]>([]);
  const [transactionTypes, setTransactionTypes] = useState<TransactionTypeDto[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [isCreatingTx, setIsCreatingTx] = useState(false);
  const [txForm, setTxForm] = useState<{
    transactionTypeId: string;
    categoryId: string;
    moneySourceId: string;
    amount: string;
    transactionDate: string;
    description: string;
  }>({
    transactionTypeId: "",
    categoryId: "",
    moneySourceId: "",
    amount: "",
    transactionDate: new Date().toISOString().slice(0, 10),
    description: "",
  });

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Chào buổi sáng");
    else if (hour < 18) setGreeting("Chào buổi chiều");
    else setGreeting("Chào buổi tối");
  }, []);

  useEffect(() => {
    if (authLoading) return;

    const loadTransactions = async () => {
      try {
        setLoadingTx(true);
        setTxError(null);
        const res = await dashboardApi.getRecentTransactions(page, pageSize);
        const data: TransactionListResponseDto = res.data;
        setTransactions(data.transactions ?? []);
      } catch (err: any) {
        console.error("Load transactions error", err);
        const msg =
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Không thể tải danh sách giao dịch";
        setTxError(msg);
      } finally {
        setLoadingTx(false);
      }
    };

    loadTransactions();
  }, [authLoading, page, pageSize]);

  useEffect(() => {
    if (authLoading) return;

    const loadMeta = async () => {
      try {
        const [moneySourceRes, typeRes] = await Promise.all([
          dashboardApi.getMoneySources(),
          dashboardApi.getTransactionTypes(),
        ]);
        setMoneySources(moneySourceRes.data ?? []);
        setTransactionTypes(typeRes.data ?? []);
      } catch (err: any) {
        // Nếu lỗi 401 hay lỗi khác: chỉ log lại, vẫn cho phép xem dữ liệu đã có
        // các lỗi khác giữ nguyên, người dùng vẫn xem được bảng đã có
      }
    };

    loadMeta();
  }, [authLoading, navigate, signOut]);

  const handleTransactionTypeChange = async (transactionTypeId: string) => {
    setTxForm((prev) => ({ ...prev, transactionTypeId, categoryId: "" }));
    if (!transactionTypeId) {
      setCategories([]);
      return;
    }

    try {
      const res = await dashboardApi.getCategories(transactionTypeId);
      setCategories(res.data ?? []);
    } catch (err: any) {
      console.error("Load categories error", err);
    }
  };

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !txForm.transactionTypeId ||
      !txForm.categoryId ||
      !txForm.moneySourceId ||
      !txForm.amount.trim()
    ) {
      return;
    }

    const amount = Number(txForm.amount.replace(/\D/g, ""));
    if (!Number.isFinite(amount) || amount <= 0) return;

    try {
      setIsCreatingTx(true);
      setTxError(null);
      const payload = {
        transactionTypeId: txForm.transactionTypeId,
        categoryId: txForm.categoryId,
        moneySourceId: txForm.moneySourceId,
        amount,
        transactionDate: new Date(txForm.transactionDate).toISOString(),
        description: txForm.description.trim() || undefined,
      };
      const res = await dashboardApi.createTransaction(payload);
      const created = res.data;
      setTransactions((prev) => [created, ...prev]);
      setTxForm((prev) => ({
        ...prev,
        amount: "",
        description: "",
      }));
    } catch (err: any) {
      console.error("Create transaction error", err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Không thể tạo giao dịch mới";
      setTxError(msg);
    } finally {
      setIsCreatingTx(false);
    }
  };

  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const tx of transactions) {
      if (tx.isIncome) income += tx.amount;
      else expense += tx.amount;
    }
    return { income, expense, net: income - expense };
  }, [transactions]);

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
                className={`${styles.sidebarItem} ${section.id === "transactions" ? styles.active : ""}`}
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
            <h1 className={styles.sectionHeading}>Giao dịch</h1>
            <p className={styles.welcomeText}>
              Xem nhanh các giao dịch thu / chi gần đây của bạn và tổng quan số liệu.
            </p>

            {txError && (
              <div className={styles.errorBanner}>
                <p>{txError}</p>
              </div>
            )}

            <div
              style={{
                marginTop: "1.75rem",
                display: "grid",
                gridTemplateColumns: "minmax(0, 1.8fr) minmax(0, 1.1fr)",
                gap: "1.5rem",
                alignItems: "flex-start",
              }}
            >
              {/* Bảng giao dịch */}
              <div className={styles.card}>
                <h2
                  className={styles.sectionHeading}
                  style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}
                >
                  Giao dịch gần đây
                </h2>
                {loadingTx ? (
                  <p>Đang tải giao dịch...</p>
                ) : transactions.length === 0 ? (
                  <p>Chưa có giao dịch nào. Hãy bắt đầu ghi chép từ hôm nay.</p>
                ) : (
                  <div
                    style={{
                      maxHeight: "420px",
                      overflow: "auto",
                      borderRadius: "12px",
                      border: "1px solid rgba(148,163,184,0.35)",
                      background: "rgba(15,23,42,0.8)",
                    }}
                  >
                    <table
                      style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        fontSize: "0.9rem",
                      }}
                    >
                      <thead>
                        <tr
                          style={{
                            background: "rgba(15,23,42,0.9)",
                            position: "sticky",
                            top: 0,
                            zIndex: 1,
                          }}
                        >
                          <th style={{ padding: "0.6rem 0.75rem", textAlign: "left" }}>
                            Ngày
                          </th>
                          <th style={{ padding: "0.6rem 0.75rem", textAlign: "left" }}>
                            Loại
                          </th>
                          <th style={{ padding: "0.6rem 0.75rem", textAlign: "left" }}>
                            Danh mục
                          </th>
                          <th style={{ padding: "0.6rem 0.75rem", textAlign: "left" }}>
                            Tài khoản
                          </th>
                          <th
                            style={{
                              padding: "0.6rem 0.75rem",
                              textAlign: "right",
                              whiteSpace: "nowrap",
                            }}
                          >
                            Số tiền
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map((tx) => (
                          <tr
                            key={tx.id}
                            style={{
                              borderTop: "1px solid rgba(30,64,175,0.35)",
                              background: "rgba(15,23,42,0.7)",
                            }}
                          >
                            <td style={{ padding: "0.55rem 0.75rem" }}>
                              {new Date(tx.transactionDate).toLocaleDateString("vi-VN")}
                            </td>
                            <td style={{ padding: "0.55rem 0.75rem" }}>
                              <span
                                style={{
                                  padding: "0.15rem 0.55rem",
                                  borderRadius: "999px",
                                  fontSize: "0.8rem",
                                  color: "#0b1120",
                                  background: tx.isIncome
                                    ? "rgba(74,222,128,0.9)"
                                    : "rgba(248,113,113,0.9)",
                                }}
                              >
                                {tx.isIncome ? "Thu" : "Chi"}
                              </span>
                            </td>
                            <td style={{ padding: "0.55rem 0.75rem" }}>
                              {tx.categoryName}
                            </td>
                            <td style={{ padding: "0.55rem 0.75rem" }}>
                              {tx.moneySourceName}
                            </td>
                            <td
                              style={{
                                padding: "0.55rem 0.75rem",
                                textAlign: "right",
                                color: tx.isIncome ? "#4ade80" : "#f97373",
                                fontWeight: 600,
                              }}
                            >
                              {tx.amount.toLocaleString("vi-VN")} ₫
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Cột phải: tạo giao dịch + tổng quan thu / chi */}
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {/* Form tạo giao dịch mới */}
                <div className={styles.card}>
                  <h2
                    className={styles.sectionHeading}
                    style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}
                  >
                    Thêm giao dịch
                  </h2>
                  <p
                    style={{
                      fontSize: "0.9rem",
                      color: "rgba(209,213,219,0.9)",
                      marginBottom: "0.75rem",
                    }}
                  >
                    Ghi lại nhanh một giao dịch với loại, tài khoản và mô tả.
                  </p>
                  <form
                    onSubmit={handleCreateTransaction}
                    style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      <label
                        htmlFor="tx-type"
                        style={{ fontSize: "0.85rem", color: "#e5e7eb", fontWeight: 500 }}
                      >
                        Loại giao dịch
                      </label>
                      <select
                        id="tx-type"
                        value={txForm.transactionTypeId}
                        onChange={(e) => handleTransactionTypeChange(e.target.value)}
                        style={{
                          borderRadius: "10px",
                          padding: "0.6rem 0.75rem",
                          border: "1px solid rgba(148,163,184,0.5)",
                          background: "rgba(15,23,42,0.75)",
                          color: "#f9fafb",
                          fontSize: "0.9rem",
                        }}
                      >
                        <option value="">-- Chọn loại giao dịch --</option>
                        {transactionTypes.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      <label
                        htmlFor="tx-category"
                        style={{ fontSize: "0.85rem", color: "#e5e7eb", fontWeight: 500 }}
                      >
                        Danh mục
                      </label>
                      <select
                        id="tx-category"
                        value={txForm.categoryId}
                        onChange={(e) =>
                          setTxForm((prev) => ({ ...prev, categoryId: e.target.value }))
                        }
                        style={{
                          borderRadius: "10px",
                          padding: "0.6rem 0.75rem",
                          border: "1px solid rgba(148,163,184,0.5)",
                          background: "rgba(15,23,42,0.75)",
                          color: "#f9fafb",
                          fontSize: "0.9rem",
                        }}
                      >
                        <option value="">-- Chọn danh mục --</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      <label
                        htmlFor="tx-account"
                        style={{ fontSize: "0.85rem", color: "#e5e7eb", fontWeight: 500 }}
                      >
                        Tài khoản
                      </label>
                      <select
                        id="tx-account"
                        value={txForm.moneySourceId}
                        onChange={(e) =>
                          setTxForm((prev) => ({ ...prev, moneySourceId: e.target.value }))
                        }
                        disabled={moneySources.length === 0}
                        style={{
                          borderRadius: "10px",
                          padding: "0.6rem 0.75rem",
                          border: "1px solid rgba(148,163,184,0.5)",
                          background: "rgba(15,23,42,0.75)",
                          color: moneySources.length === 0 ? "rgba(148,163,184,0.8)" : "#f9fafb",
                          fontSize: "0.9rem",
                          cursor: moneySources.length === 0 ? "not-allowed" : "pointer",
                        }}
                      >
                        {moneySources.length === 0 ? (
                          <option value="">Chưa có tài khoản nào</option>
                        ) : (
                          <>
                            <option value="">-- Chọn tài khoản --</option>
                            {moneySources.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.name}
                              </option>
                            ))}
                          </>
                        )}
                      </select>
                      {moneySources.length === 0 && (
                        <div
                          style={{
                            marginTop: "0.35rem",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: "0.5rem",
                            fontSize: "0.8rem",
                            color: "rgba(209,213,219,0.9)",
                            flexWrap: "wrap",
                          }}
                        >
                          <span>Chưa có tài khoản giao dịch nào. Hãy tạo tài khoản trước.</span>
                          <button
                            type="button"
                            onClick={() => navigate("/accounts")}
                            style={{
                              padding: "0.25rem 0.7rem",
                              borderRadius: "999px",
                              border: "none",
                              background: "rgba(59,130,246,0.9)",
                              color: "#e5e7eb",
                              fontWeight: 600,
                              cursor: "pointer",
                              fontSize: "0.8rem",
                              boxShadow: "0 4px 10px rgba(37,99,235,0.45)",
                            }}
                          >
                            Thêm tài khoản
                          </button>
                        </div>
                      )}
                    </div>

                    <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                      <div
                        style={{
                          flex: "1 1 45%",
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.25rem",
                        }}
                      >
                        <label
                          htmlFor="tx-amount"
                          style={{ fontSize: "0.85rem", color: "#e5e7eb", fontWeight: 500 }}
                        >
                          Số tiền (₫)
                        </label>
                        <input
                          id="tx-amount"
                          type="number"
                          min={0}
                          value={txForm.amount}
                          onChange={(e) =>
                            setTxForm((prev) => ({ ...prev, amount: e.target.value }))
                          }
                          placeholder="Ví dụ: 200000"
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
                        style={{
                          flex: "1 1 45%",
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.25rem",
                        }}
                      >
                        <label
                          htmlFor="tx-date"
                          style={{ fontSize: "0.85rem", color: "#e5e7eb", fontWeight: 500 }}
                        >
                          Ngày giao dịch
                        </label>
                        <input
                          id="tx-date"
                          type="date"
                          value={txForm.transactionDate}
                          onChange={(e) =>
                            setTxForm((prev) => ({
                              ...prev,
                              transactionDate: e.target.value,
                            }))
                          }
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
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      <label
                        htmlFor="tx-description"
                        style={{ fontSize: "0.85rem", color: "#e5e7eb", fontWeight: 500 }}
                      >
                        Mô tả (tuỳ chọn)
                      </label>
                      <textarea
                        id="tx-description"
                        rows={2}
                        value={txForm.description}
                        onChange={(e) =>
                          setTxForm((prev) => ({ ...prev, description: e.target.value }))
                        }
                        placeholder="Ví dụ: Ăn tối với bạn bè, tiền điện tháng 1..."
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

                    <button
                      type="submit"
                      disabled={isCreatingTx}
                      style={{
                        marginTop: "0.5rem",
                        alignSelf: "flex-start",
                        padding: "0.6rem 1.3rem",
                        borderRadius: "999px",
                        border: "none",
                        background: "linear-gradient(135deg,#38bdf8,#818cf8,#c4b5fd)",
                        color: "#0f172a",
                        fontWeight: 700,
                        fontSize: "0.95rem",
                        cursor: isCreatingTx ? "wait" : "pointer",
                        boxShadow: "0 8px 20px rgba(59,130,246,0.5)",
                      }}
                    >
                      {isCreatingTx ? "Đang lưu..." : "Lưu giao dịch"}
                    </button>
                  </form>
                </div>

                {/* Tổng quan thu / chi */}
                <div className={styles.statsGrid}>
                  <div className={styles.statCard}>
                    <div className={styles.statIcon}>⬆️</div>
                    <div className={styles.statContent}>
                      <h3>Tổng thu</h3>
                      <p className={styles.statValue}>
                        {totals.income.toLocaleString("vi-VN")} ₫
                      </p>
                    </div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statIcon}>⬇️</div>
                    <div className={styles.statContent}>
                      <h3>Tổng chi</h3>
                      <p className={styles.statValue}>
                        {totals.expense.toLocaleString("vi-VN")} ₫
                      </p>
                    </div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statIcon}>↕️</div>
                    <div className={styles.statContent}>
                      <h3>Chênh lệch (thu - chi)</h3>
                      <p className={styles.statValue}>
                        {totals.net.toLocaleString("vi-VN")} ₫
                      </p>
                    </div>
                  </div>
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

