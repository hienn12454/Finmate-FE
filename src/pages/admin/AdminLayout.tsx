import { useState } from "react";
import { Link, useNavigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import styles from "./AdminLayout.module.css";

const ADMIN_SECTIONS = [
  { id: "dashboard", label: "Tổng quan", path: "/admin", icon: "📊" },
  { id: "users", label: "Quản lý người dùng", path: "/admin/users", icon: "👥" },
  { id: "revenue", label: "Doanh thu", path: "/admin/revenue", icon: "💰" },
  { id: "vouchers", label: "Voucher & Gói", path: "/admin/vouchers", icon: "🎟️" },
  { id: "posts", label: "Quản lý bài viết", path: "/admin/posts", icon: "📝" },
] as const;

export default function AdminLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const displayName = (user as any)?.fullName || (user as any)?.email || "Admin";

  const getActiveSection = () => {
    const path = location.pathname;
    if (path === "/admin") return "dashboard";
    const match = ADMIN_SECTIONS.find((s) => s.path !== "/admin" && path.startsWith(s.path));
    return match?.id || "dashboard";
  };

  const activeSection = getActiveSection();

  return (
    <div className={styles.adminContainer}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Link to="/admin" className={styles.logo}>
            <span className={styles.logoMark}>F</span>
            <span className={styles.logoText}>Finmate</span>
          </Link>
          <span className={styles.adminBadge}>Admin</span>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.userName}>👤 {displayName}</span>
          <button
            type="button"
            className={styles.logoutBtn}
            onClick={() => signOut()}
          >
            Đăng xuất
          </button>
        </div>
      </header>

      {/* Body */}
      <div className={styles.body}>
        {/* Sidebar */}
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
            {ADMIN_SECTIONS.map((section) => (
              <button
                key={section.id}
                type="button"
                className={`${styles.sidebarItem} ${
                  activeSection === section.id ? styles.active : ""
                }`}
                onClick={() => navigate(section.path)}
              >
                <span className={styles.sidebarIcon}>{section.icon}</span>
                {!isSidebarCollapsed && <span>{section.label}</span>}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className={styles.main}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
