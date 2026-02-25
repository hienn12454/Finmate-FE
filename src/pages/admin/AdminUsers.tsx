import { useEffect, useState, useCallback } from "react";
import { userApi } from "../../api/user.api";
import { adminApi } from "../../api/admin.api";
import type { User } from "../../api/user.api";
import styles from "./AdminLayout.module.css";

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const limit = 10;

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await userApi.getUsers({ page, limit, search: search || undefined });
      const data = (res.data as any)?.data || res.data;
      if (data?.users) {
        setUsers(data.users);
        setTotal(data.total || data.users.length);
      } else if (Array.isArray(data)) {
        setUsers(data);
        setTotal(data.length);
      } else {
        // Fallback demo data
        setUsers(getFallbackUsers());
        setTotal(25);
      }
    } catch {
      setUsers(getFallbackUsers());
      setTotal(25);
      setError("Không thể kết nối API — đang hiển thị dữ liệu mẫu.");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadUsers();
  };

  const handlePromoteToAdmin = async (userId: string) => {
    if (!confirm("Bạn có chắc chắn muốn thăng cấp người dùng này thành Admin?")) return;
    try {
      setActionLoading(userId);
      await adminApi.promoteUser(userId, { role: "admin" });
      loadUsers();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Thăng cấp thất bại");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDemoteToUser = async (userId: string) => {
    if (!confirm("Bạn có chắc chắn muốn hạ cấp admin này thành user?")) return;
    try {
      setActionLoading(userId);
      await adminApi.promoteUser(userId, { role: "user" });
      loadUsers();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Hạ cấp thất bại");
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus?: string) => {
    try {
      setActionLoading(userId);
      if (currentStatus === "active") {
        await userApi.deactivateUser(userId);
      } else {
        await userApi.activateUser(userId);
      }
      loadUsers();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Thao tác thất bại");
    } finally {
      setActionLoading(null);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Quản lý người dùng</h1>
        <p className={styles.pageSubtitle}>
          Tổng: {total} người dùng
        </p>
      </div>

      {error && (
        <div className={styles.card} style={{ borderColor: "rgba(234,179,8,0.3)" }}>
          <p style={{ color: "#fde047", fontSize: "0.85rem" }}>⚠️ {error}</p>
        </div>
      )}

      {/* Search */}
      <div className={styles.toolbar}>
        <form onSubmit={handleSearch} style={{ display: "flex", gap: "0.5rem", flex: 1, maxWidth: 400 }}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Tìm kiếm theo tên, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`}>
            Tìm
          </button>
        </form>
      </div>

      {/* Table */}
      <div className={styles.card}>
        {loading ? (
          <div className={styles.loading}>
            <div className={styles.spinner} />
            <p>Đang tải...</p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: "auto" }}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Họ tên</th>
                    <th>Vai trò</th>
                    <th>Trạng thái</th>
                    <th>Ngày tạo</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>
                        {u.id.slice(0, 8)}...
                      </td>
                      <td>{u.username}</td>
                      <td>{u.email || "—"}</td>
                      <td>{[u.firstName, u.lastName].filter(Boolean).join(" ") || "—"}</td>
                      <td>
                        <span
                          className={`${styles.badge} ${
                            u.role === "admin" ? styles.badgePurple : styles.badgeBlue
                          }`}
                        >
                          {u.role === "admin" ? "Admin" : "User"}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`${styles.badge} ${
                            u.status === "active"
                              ? styles.badgeGreen
                              : u.status === "suspended"
                              ? styles.badgeRed
                              : styles.badgeYellow
                          }`}
                        >
                          {u.status === "active" ? "Hoạt động" : u.status === "suspended" ? "Bị khóa" : "Không hoạt động"}
                        </span>
                      </td>
                      <td>
                        {u.createdAt
                          ? new Date(u.createdAt).toLocaleDateString("vi-VN")
                          : "—"}
                      </td>
                      <td>
                        <div className={styles.btnGroup}>
                          {u.role !== "admin" ? (
                            <button
                              className={`${styles.btn} ${styles.btnSuccess} ${styles.btnSmall}`}
                              onClick={() => handlePromoteToAdmin(u.id)}
                              disabled={actionLoading === u.id}
                            >
                              {actionLoading === u.id ? "..." : "⬆ Admin"}
                            </button>
                          ) : (
                            <button
                              className={`${styles.btn} ${styles.btnDanger} ${styles.btnSmall}`}
                              onClick={() => handleDemoteToUser(u.id)}
                              disabled={actionLoading === u.id}
                            >
                              {actionLoading === u.id ? "..." : "⬇ User"}
                            </button>
                          )}
                          <button
                            className={`${styles.btn} ${
                              u.status === "active" ? styles.btnDanger : styles.btnSuccess
                            } ${styles.btnSmall}`}
                            onClick={() => handleToggleStatus(u.id, u.status)}
                            disabled={actionLoading === u.id}
                          >
                            {u.status === "active" ? "Khóa" : "Mở khóa"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className={styles.pagination}>
                <button
                  className={styles.pageBtn}
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  ← Trước
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const p = i + 1;
                  return (
                    <button
                      key={p}
                      className={`${styles.pageBtn} ${page === p ? styles.active : ""}`}
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </button>
                  );
                })}
                {totalPages > 5 && <span style={{ color: "rgba(255,255,255,0.4)" }}>...</span>}
                <button
                  className={styles.pageBtn}
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Sau →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* Demo fallback data */
function getFallbackUsers(): User[] {
  return [
    { id: "u001-abcd-1234-efgh", username: "nguyenvana", email: "nguyenvana@gmail.com", firstName: "Văn A", lastName: "Nguyễn", role: "user", status: "active", createdAt: "2025-11-15T08:00:00Z" },
    { id: "u002-abcd-1234-efgh", username: "tranthib", email: "tranthib@gmail.com", firstName: "Thị B", lastName: "Trần", role: "user", status: "active", createdAt: "2025-12-01T08:00:00Z" },
    { id: "u003-abcd-1234-efgh", username: "admin01", email: "admin@finmate.vn", firstName: "Admin", lastName: "Finmate", role: "admin", status: "active", createdAt: "2025-01-01T08:00:00Z" },
    { id: "u004-abcd-1234-efgh", username: "lethic", email: "lethic@gmail.com", firstName: "Thị C", lastName: "Lê", role: "user", status: "inactive", createdAt: "2026-01-10T08:00:00Z" },
    { id: "u005-abcd-1234-efgh", username: "phamvand", email: "phamvand@gmail.com", firstName: "Văn D", lastName: "Phạm", role: "user", status: "active", createdAt: "2026-02-01T08:00:00Z" },
    { id: "u006-abcd-1234-efgh", username: "hoangthie", email: "hoangthie@gmail.com", firstName: "Thị E", lastName: "Hoàng", role: "user", status: "suspended", createdAt: "2025-08-20T08:00:00Z" },
    { id: "u007-abcd-1234-efgh", username: "dangvanf", email: "dangvanf@yahoo.com", firstName: "Văn F", lastName: "Đặng", role: "user", status: "active", createdAt: "2026-01-25T08:00:00Z" },
    { id: "u008-abcd-1234-efgh", username: "vothig", email: "vothig@outlook.com", firstName: "Thị G", lastName: "Võ", role: "user", status: "active", createdAt: "2026-02-10T08:00:00Z" },
  ];
}
