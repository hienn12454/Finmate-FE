import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import styles from "./LoginModal.module.css";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading, error } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    if (isAuthenticated) {
      onClose();
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!username.trim() || !password.trim()) {
      setLocalError("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    const success = await login(username, password);
    if (!success) {
      setLocalError(error || "Đăng nhập thất bại");
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>
          ✕
        </button>
        <div className={styles.content}>
          <div className={styles.header}>
            <h2>Đăng nhập vào Finmate</h2>
            <p>Quản lý tài chính thông minh hơn</p>
          </div>
          
          <form onSubmit={handleSubmit} className={styles.form}>
            {(localError || error) && (
              <div className={styles.errorMessage}>
                {localError || error}
              </div>
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

            <button
              type="submit"
              className={styles.submitButton}
              disabled={isLoading}
            >
              {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>

            <div className={styles.footer}>
              <p>
                Chưa có tài khoản?{" "}
                <button
                  type="button"
                  className={styles.linkButton}
                  onClick={() => {
                    onClose();
                    navigate("/login?register=true");
                  }}
                >
                  Đăng ký ngay
                </button>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
