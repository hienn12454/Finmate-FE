import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import styles from "./Login.module.css";

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isRegisterMode = searchParams.get("register") === "true";
  const hasRedirected = useRef(false);
  
  const { login, register, isAuthenticated, isLoading, error, user } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    // Prevent multiple redirects
    if (isAuthenticated && !hasRedirected.current && !isLoading) {
      hasRedirected.current = true;
      // Kiểm tra xem có redirect URL không
      const redirect = searchParams.get("redirect");
      const upgradePlanId = sessionStorage.getItem("upgradePlanId");

      // Check if admin user → redirect to admin dashboard
      const userRole = (user as any)?.role || (user as any)?.userRole || "";
      const isAdmin = userRole.toLowerCase() === "admin";
      
      if (upgradePlanId) {
        sessionStorage.removeItem("upgradePlanId");
        navigate(`/payment?plan=${upgradePlanId}`);
      } else if (redirect) {
        navigate(redirect);
      } else if (isAdmin) {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    }
  }, [isAuthenticated, isLoading, navigate, searchParams, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (isRegisterMode) {
      if (!email.trim() || !password.trim() || !fullName.trim() || !phoneNumber.trim()) {
        setLocalError("Vui lòng nhập đầy đủ thông tin");
        return;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setLocalError("Email không hợp lệ");
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

      if (!/^[0-9]{10,11}$/.test(phoneNumber)) {
        setLocalError("Số điện thoại không hợp lệ (10-11 số)");
        return;
      }

      const success = await register(email, password, fullName, phoneNumber);
      if (!success) {
        setLocalError(error || "Đăng ký thất bại");
      } else {
        // Backend hiện đang trả user (không kèm token) sau khi đăng ký
        // => chuyển sang màn đăng nhập để user login lấy token
        navigate("/login");
      }
    } else {
      if (!email.trim() || !password.trim()) {
        setLocalError("Vui lòng nhập đầy đủ thông tin");
        return;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setLocalError("Email không hợp lệ");
        return;
      }

      const success = await login(email, password);
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
              : <>Chào mừng trở lại với <span className={styles.finmateText}>Finmate</span></>}
          </p>
          
          <form onSubmit={handleSubmit} className={styles.form}>
            {(localError || error) && (
              <div className={styles.errorMessage}>
                {localError || error}
              </div>
            )}

            <div className={styles.formGroup}>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Nhập email"
                disabled={isLoading}
                required
              />
            </div>

            {isRegisterMode && (
              <>
                <div className={styles.formGroup}>
                  <label htmlFor="fullName">Họ và tên</label>
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nhập họ và tên"
                    disabled={isLoading}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="phoneNumber">Số điện thoại</label>
                  <input
                    id="phoneNumber"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Nhập số điện thoại"
                    disabled={isLoading}
                    required
                  />
                </div>
              </>
            )}

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
