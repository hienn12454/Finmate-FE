import { useEffect, useState, useCallback } from "react";
import { adminApi } from "../../api/admin.api";
import type { Voucher, PlanPricing } from "../../api/admin.api";
import styles from "./AdminLayout.module.css";

export default function AdminVouchers() {
  /* ── Vouchers ── */
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [voucherLoading, setVoucherLoading] = useState(true);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);
  const [voucherForm, setVoucherForm] = useState({
    code: "",
    discountPercent: 10,
    discountAmount: 0,
    maxUses: 100,
    validFrom: "",
    validTo: "",
  });

  /* ── Plan Pricing ── */
  const [plans, setPlans] = useState<PlanPricing[]>([]);
  const [planLoading, setPlanLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<PlanPricing | null>(null);
  const [planPrice, setPlanPrice] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  /* ── Load Vouchers ── */
  const loadVouchers = useCallback(async () => {
    try {
      setVoucherLoading(true);
      const res = await adminApi.getVouchers();
      const data = (res.data as any)?.data || res.data;
      if (data?.vouchers) {
        setVouchers(data.vouchers);
      } else {
        setVouchers(getFallbackVouchers());
      }
    } catch {
      setVouchers(getFallbackVouchers());
      setError("Không thể kết nối API — đang hiển thị dữ liệu mẫu.");
    } finally {
      setVoucherLoading(false);
    }
  }, []);

  /* ── Load Plans ── */
  const loadPlans = useCallback(async () => {
    try {
      setPlanLoading(true);
      const res = await adminApi.getPlanPricings();
      const data = (res.data as any)?.data || res.data;
      if (Array.isArray(data)) {
        setPlans(data);
      } else {
        setPlans(getFallbackPlans());
      }
    } catch {
      setPlans(getFallbackPlans());
    } finally {
      setPlanLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVouchers();
    loadPlans();
  }, [loadVouchers, loadPlans]);

  /* ── Voucher CRUD ── */
  const openCreateVoucher = () => {
    setEditingVoucher(null);
    setVoucherForm({
      code: "",
      discountPercent: 10,
      discountAmount: 0,
      maxUses: 100,
      validFrom: new Date().toISOString().split("T")[0],
      validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    });
    setShowVoucherModal(true);
  };

  const openEditVoucher = (v: Voucher) => {
    setEditingVoucher(v);
    setVoucherForm({
      code: v.code,
      discountPercent: v.discountPercent,
      discountAmount: v.discountAmount || 0,
      maxUses: v.maxUses,
      validFrom: v.validFrom.split("T")[0],
      validTo: v.validTo.split("T")[0],
    });
    setShowVoucherModal(true);
  };

  const handleSaveVoucher = async () => {
    try {
      setActionLoading(true);
      if (editingVoucher) {
        await adminApi.updateVoucher(editingVoucher.id, {
          code: voucherForm.code,
          discountPercent: voucherForm.discountPercent,
          discountAmount: voucherForm.discountAmount || undefined,
          maxUses: voucherForm.maxUses,
          validFrom: voucherForm.validFrom,
          validTo: voucherForm.validTo,
        });
      } else {
        await adminApi.createVoucher({
          code: voucherForm.code,
          discountPercent: voucherForm.discountPercent,
          discountAmount: voucherForm.discountAmount || undefined,
          maxUses: voucherForm.maxUses,
          validFrom: voucherForm.validFrom,
          validTo: voucherForm.validTo,
        });
      }
      setShowVoucherModal(false);
      loadVouchers();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Thao tác thất bại");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteVoucher = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa voucher này?")) return;
    try {
      await adminApi.deleteVoucher(id);
      loadVouchers();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Xóa thất bại");
    }
  };

  /* ── Plan Pricing Edit ── */
  const openEditPlan = (plan: PlanPricing) => {
    setEditingPlan(plan);
    setPlanPrice(plan.price.toString());
  };

  const handleSavePlan = async () => {
    if (!editingPlan) return;
    try {
      setActionLoading(true);
      await adminApi.updatePlanPricing(editingPlan.planId, {
        price: Number(planPrice),
      });
      setEditingPlan(null);
      loadPlans();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Cập nhật thất bại");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Voucher & Gói đăng ký</h1>
        <p className={styles.pageSubtitle}>Quản lý voucher giảm giá và giá các gói Premium</p>
      </div>

      {error && (
        <div className={styles.card} style={{ borderColor: "rgba(234,179,8,0.3)" }}>
          <p style={{ color: "#fde047", fontSize: "0.85rem" }}>⚠️ {error}</p>
        </div>
      )}

      {/* ════════════════════ PLAN PRICING ════════════════════ */}
      <div className={styles.card}>
        <div className={styles.cardTitle}>💎 Giá các gói đăng ký Premium</div>

        {planLoading ? (
          <div className={styles.loading}>
            <div className={styles.spinner} />
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Gói</th>
                  <th>Tên</th>
                  <th>Thời hạn</th>
                  <th>Giá hiện tại</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {plans.map((plan) => (
                  <tr key={plan.id}>
                    <td style={{ fontFamily: "monospace" }}>{plan.planId}</td>
                    <td>{plan.name}</td>
                    <td>{plan.duration}</td>
                    <td>
                      {editingPlan?.id === plan.id ? (
                        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                          <input
                            type="number"
                            className={styles.formInput}
                            value={planPrice}
                            onChange={(e) => setPlanPrice(e.target.value)}
                            style={{ width: "140px" }}
                          />
                          <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.8rem" }}>₫</span>
                        </div>
                      ) : (
                        <span style={{ fontWeight: 600, color: "#86efac" }}>
                          {plan.price.toLocaleString("vi-VN")} ₫
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={`${styles.badge} ${plan.isActive ? styles.badgeGreen : styles.badgeRed}`}>
                        {plan.isActive ? "Hoạt động" : "Tắt"}
                      </span>
                    </td>
                    <td>
                      {editingPlan?.id === plan.id ? (
                        <div className={styles.btnGroup}>
                          <button
                            className={`${styles.btn} ${styles.btnSuccess} ${styles.btnSmall}`}
                            onClick={handleSavePlan}
                            disabled={actionLoading}
                          >
                            {actionLoading ? "..." : "Lưu"}
                          </button>
                          <button
                            className={`${styles.btn} ${styles.btnDanger} ${styles.btnSmall}`}
                            onClick={() => setEditingPlan(null)}
                          >
                            Hủy
                          </button>
                        </div>
                      ) : (
                        <button
                          className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSmall}`}
                          onClick={() => openEditPlan(plan)}
                        >
                          ✏️ Sửa giá
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ════════════════════ VOUCHERS ════════════════════ */}
      <div className={styles.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div className={styles.cardTitle} style={{ marginBottom: 0 }}>🎟️ Danh sách Voucher</div>
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={openCreateVoucher}>
            + Tạo voucher mới
          </button>
        </div>

        {voucherLoading ? (
          <div className={styles.loading}>
            <div className={styles.spinner} />
          </div>
        ) : vouchers.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🎟️</div>
            <p className={styles.emptyText}>Chưa có voucher nào</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Mã</th>
                  <th>Giảm (%)</th>
                  <th>Giảm (₫)</th>
                  <th>Đã dùng / Tối đa</th>
                  <th>Hiệu lực</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {vouchers.map((v) => (
                  <tr key={v.id}>
                    <td>
                      <code style={{ background: "rgba(59,130,246,0.15)", padding: "0.2rem 0.5rem", borderRadius: 4, color: "#93c5fd" }}>
                        {v.code}
                      </code>
                    </td>
                    <td>{v.discountPercent}%</td>
                    <td>{v.discountAmount ? `${v.discountAmount.toLocaleString("vi-VN")} ₫` : "—"}</td>
                    <td>{v.currentUses} / {v.maxUses}</td>
                    <td style={{ fontSize: "0.8rem" }}>
                      {new Date(v.validFrom).toLocaleDateString("vi-VN")} → {new Date(v.validTo).toLocaleDateString("vi-VN")}
                    </td>
                    <td>
                      <span className={`${styles.badge} ${v.isActive ? styles.badgeGreen : styles.badgeRed}`}>
                        {v.isActive ? "Hoạt động" : "Hết hạn"}
                      </span>
                    </td>
                    <td>
                      <div className={styles.btnGroup}>
                        <button
                          className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSmall}`}
                          onClick={() => openEditVoucher(v)}
                        >
                          ✏️
                        </button>
                        <button
                          className={`${styles.btn} ${styles.btnDanger} ${styles.btnSmall}`}
                          onClick={() => handleDeleteVoucher(v.id)}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ════════════════════ VOUCHER MODAL ════════════════════ */}
      {showVoucherModal && (
        <div className={styles.modalOverlay} onClick={() => setShowVoucherModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>
              {editingVoucher ? "Chỉnh sửa Voucher" : "Tạo Voucher mới"}
            </h2>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Mã voucher</label>
              <input
                type="text"
                className={styles.formInput}
                placeholder="VD: WELCOME2026"
                value={voucherForm.code}
                onChange={(e) => setVoucherForm({ ...voucherForm, code: e.target.value.toUpperCase() })}
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Giảm giá (%)</label>
                <input
                  type="number"
                  className={styles.formInput}
                  min={0}
                  max={100}
                  value={voucherForm.discountPercent}
                  onChange={(e) => setVoucherForm({ ...voucherForm, discountPercent: Number(e.target.value) })}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Giảm cố định (₫)</label>
                <input
                  type="number"
                  className={styles.formInput}
                  min={0}
                  value={voucherForm.discountAmount}
                  onChange={(e) => setVoucherForm({ ...voucherForm, discountAmount: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Số lần sử dụng tối đa</label>
              <input
                type="number"
                className={styles.formInput}
                min={1}
                value={voucherForm.maxUses}
                onChange={(e) => setVoucherForm({ ...voucherForm, maxUses: Number(e.target.value) })}
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Ngày bắt đầu</label>
                <input
                  type="date"
                  className={styles.formInput}
                  value={voucherForm.validFrom}
                  onChange={(e) => setVoucherForm({ ...voucherForm, validFrom: e.target.value })}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Ngày kết thúc</label>
                <input
                  type="date"
                  className={styles.formInput}
                  value={voucherForm.validTo}
                  onChange={(e) => setVoucherForm({ ...voucherForm, validTo: e.target.value })}
                />
              </div>
            </div>

            <div className={styles.modalActions}>
              <button
                className={styles.btnCancel}
                onClick={() => setShowVoucherModal(false)}
              >
                Hủy
              </button>
              <button
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={handleSaveVoucher}
                disabled={actionLoading || !voucherForm.code.trim()}
              >
                {actionLoading ? "Đang lưu..." : editingVoucher ? "Cập nhật" : "Tạo mới"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Fallback data ── */
function getFallbackVouchers(): Voucher[] {
  return [
    { id: "v1", code: "WELCOME2026", discountPercent: 20, maxUses: 500, currentUses: 123, validFrom: "2026-01-01T00:00:00Z", validTo: "2026-06-30T23:59:59Z", isActive: true, createdAt: "2025-12-20T00:00:00Z" },
    { id: "v2", code: "TET2026", discountPercent: 30, discountAmount: 50000, maxUses: 200, currentUses: 89, validFrom: "2026-01-25T00:00:00Z", validTo: "2026-02-15T23:59:59Z", isActive: true, createdAt: "2026-01-20T00:00:00Z" },
    { id: "v3", code: "VIP50", discountPercent: 50, maxUses: 50, currentUses: 50, validFrom: "2025-11-01T00:00:00Z", validTo: "2025-12-31T23:59:59Z", isActive: false, createdAt: "2025-10-28T00:00:00Z" },
    { id: "v4", code: "SUMMER2026", discountPercent: 15, maxUses: 1000, currentUses: 0, validFrom: "2026-06-01T00:00:00Z", validTo: "2026-08-31T23:59:59Z", isActive: true, createdAt: "2026-02-20T00:00:00Z" },
  ];
}

function getFallbackPlans(): PlanPricing[] {
  return [
    { id: "p1", planId: "1-month", name: "Premium", duration: "1 Tháng", price: 79000, isActive: true, updatedAt: "2026-01-01T00:00:00Z" },
    { id: "p2", planId: "6-month", name: "Premium", duration: "6 Tháng", price: 389000, isActive: true, updatedAt: "2026-01-01T00:00:00Z" },
    { id: "p3", planId: "1-year", name: "Premium", duration: "1 Năm", price: 710000, isActive: true, updatedAt: "2026-01-01T00:00:00Z" },
  ];
}
