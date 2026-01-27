import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import styles from "./Dashboard.module.css";

export default function Dashboard() {
  const { user, isLoading: authLoading, refreshUser, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    // Set greeting based on time
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Chào buổi sáng");
    else if (hour < 18) setGreeting("Chào buổi chiều");
    else setGreeting("Chào buổi tối");
  }, []);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        setLoading(true);
        await refreshUser();
      } catch (err: any) {
        console.error("Failed to load user data:", err);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      loadUserData();
    }
  }, [authLoading, refreshUser]);

  const handleSignOut = async () => {
    await signOut();
  };

  if (loading || authLoading) {
    return (
      <div className={styles.container}>
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

      <main className={styles.main}>
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
              <p className={styles.statValue}>0 ₫</p>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>💸</div>
            <div className={styles.statContent}>
              <h3>Tổng chi tiêu</h3>
              <p className={styles.statValue}>0 ₫</p>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>📊</div>
            <div className={styles.statContent}>
              <h3>Số dư</h3>
              <p className={styles.statValue}>0 ₫</p>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>🎯</div>
            <div className={styles.statContent}>
              <h3>Mục tiêu</h3>
              <p className={styles.statValue}>0/0</p>
            </div>
          </div>
        </div>

        <div className={styles.contentGrid}>
          <div className={styles.card}>
            <h2>Giao dịch gần đây</h2>
            <div className={styles.emptyState}>
              <p>Chưa có giao dịch nào</p>
            </div>
          </div>

          <div className={styles.card}>
            <h2>Biểu đồ chi tiêu</h2>
            <div className={styles.emptyState}>
              <p>Dữ liệu sẽ hiển thị ở đây</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
