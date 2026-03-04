import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import styles from "./LoginModal.module.css";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  redirectTo?: string;
}

export default function LoginModal({ isOpen, onClose, redirectTo }: LoginModalProps) {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();

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

  // Nếu đã đăng nhập (sau khi quay lại từ Clerk), đóng modal và redirect
  useEffect(() => {
    if (isOpen && isAuthenticated && !isLoading) {
      onClose();
      const upgradePlanId = sessionStorage.getItem("upgradePlanId");
      if (redirectTo) {
        navigate(redirectTo);
      } else if (upgradePlanId) {
        sessionStorage.removeItem("upgradePlanId");
        navigate(`/payment?plan=${upgradePlanId}`);
      } else {
        navigate("/dashboard");
      }
    }
  }, [isOpen, isAuthenticated, isLoading, navigate, onClose, redirectTo]);

  const handleLoginClick = () => {
    onClose();
    if (redirectTo) {
      sessionStorage.setItem("clerkRedirectAfterLogin", redirectTo);
    }
    navigate("/login");
  };

  const handleRegisterClick = () => {
    onClose();
    navigate("/sign-up-clerk");
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
            <h2>
              Đăng nhập vào <span className={styles.finmateText}>Finmate</span>
            </h2>
            <p>Quản lý tài chính thông minh hơn</p>
          </div>

          <div className={styles.form}>
            <button className={styles.submitButton} onClick={handleLoginClick}>
              Đăng nhập
            </button>

            <div className={styles.footer}>
              <p>
                Chưa có tài khoản?{" "}
                <button
                  type="button"
                  className={styles.linkButton}
                  onClick={handleRegisterClick}
                >
                  Đăng ký ngay
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
