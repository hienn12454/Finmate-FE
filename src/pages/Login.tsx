import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import styles from "./Login.module.css";

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isRegisterMode = searchParams.get("register") === "true";
  
  const { login, register, isAuthenticated, isLoading, error } = useAuth();
  
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (isRegisterMode) {
      if (!username.trim() || !password.trim()) {
        setLocalError("Vui lòng nhập đầy đủ thông tin");
        return;
      }

      if (password !== confirmPassword) {
        setLocalError("Mật khẩu xác nhận không khớp");
        return;
      }

      if (password.length < 6) {
        setLocalError("Mật khẩu phải có ít nhất 6 ký tự");
        return;
      }

      const success = await register(
        username,
        password,
        email || undefined,
        firstName || undefined,
        lastName || undefined
      );
      if (!success) {
        setLocalError(error || "Đăng ký thất bại");
      }
    } else {
      if (!username.trim() || !password.trim()) {
        setLocalError("Vui lòng nhập đầy đủ thông tin");
        return;
      }

      const success = await login(username, password);
      if (!success) {
        setLocalError(error || "Đăng nhập thất bại");
      }
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.logo} onClick={() => navigate("/")}>
          <span className={styles.logoText}>Finmate</span>
        </div>
      </div>
      
      <div className={styles.loginContainer}>
        <div className={styles.loginCard}>
          <h1 className={styles.title}>
            {isRegisterMode ? "Đăng ký" : "Đăng nhập"}
          </h1>
          <p className={styles.subtitle}>
            {isRegisterMode
              ? "Tạo tài khoản mới để bắt đầu"
              : "Chào mừng trở lại với Finmate"}
          </p>
          
          <form onSubmit={handleSubmit} className={styles.form}>
            {(localError || error) && (
              <div className={styles.errorMessage}>
                {localError || error}
              </div>
            )}

            {isRegisterMode && (
              <>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="firstName">Họ</label>
                    <input
                      id="firstName"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Nhập họ"
                      disabled={isLoading}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="lastName">Tên</label>
                    <input
                      id="lastName"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Nhập tên"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="email">Email (tùy chọn)</label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Nhập email"
                    disabled={isLoading}
                  />
                </div>
              </>
            )}

            <div className={styles.formGroup}>
              <label htmlFor="username">Tên đăng nhập</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nhập tên đăng nhập"
                disabled={isLoading}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="password">Mật khẩu</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu"
                disabled={isLoading}
                required
              />
            </div>

            {isRegisterMode && (
              <div className={styles.formGroup}>
                <label htmlFor="confirmPassword">Xác nhận mật khẩu</label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu"
                  disabled={isLoading}
                  required
                />
              </div>
            )}

            <button
              type="submit"
              className={styles.submitButton}
              disabled={isLoading}
            >
              {isLoading
                ? isRegisterMode
                  ? "Đang đăng ký..."
                  : "Đang đăng nhập..."
                : isRegisterMode
                ? "Đăng ký"
                : "Đăng nhập"}
            </button>

            <div className={styles.footer}>
              <p>
                {isRegisterMode ? (
                  <>
                    Đã có tài khoản?{" "}
                    <button
                      type="button"
                      className={styles.linkButton}
                      onClick={() => navigate("/login")}
                    >
                      Đăng nhập ngay
                    </button>
                  </>
                ) : (
                  <>
                    Chưa có tài khoản?{" "}
                    <button
                      type="button"
                      className={styles.linkButton}
                      onClick={() => navigate("/login?register=true")}
                    >
                      Đăng ký ngay
                    </button>
                  </>
                )}
              </p>
            </div>
          </form>
        </div>
      </div>

      <footer className={styles.footer}>
        <p>&copy; 2026 Finmate. All rights reserved.</p>
      </footer>
    </div>
  );
}
