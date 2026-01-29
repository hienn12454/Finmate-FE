import { useEffect } from "react";
import styles from "./SuccessModal.module.css";

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  planName: string;
  planDuration: string;
}

export default function SuccessModal({
  isOpen,
  onClose,
  planName,
  planDuration,
}: SuccessModalProps) {
  useEffect(() => {
    if (isOpen) {
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.content}>
          {/* Animated Success Icon */}
          <div className={styles.iconContainer}>
            <div className={styles.checkmarkCircle}>
              <svg
                className={styles.checkmark}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 52 52"
              >
                <circle
                  className={styles.checkmarkCircleBg}
                  cx="26"
                  cy="26"
                  r="25"
                  fill="none"
                />
                <path
                  className={styles.checkmarkCheck}
                  fill="none"
                  d="M14.1 27.2l7.1 7.2 16.7-16.8"
                />
              </svg>
            </div>
            <div className={styles.confetti}>
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className={styles.confettiPiece}
                  style={{
                    "--delay": `${i * 0.1}s`,
                    "--rotation": `${i * 30}deg`,
                  } as React.CSSProperties}
                />
              ))}
            </div>
          </div>

          {/* Title */}
          <h2 className={styles.title}>🎉 Chúc mừng!</h2>

          {/* Message */}
          <p className={styles.message}>
            Thanh toán thành công!
          </p>
          <p className={styles.subMessage}>
            Gói <span className={styles.highlight}>{planDuration}</span> đã được kích hoạt thành công.
          </p>

          {/* Plan Info Card */}
          <div className={styles.planCard}>
            <div className={styles.planIcon}>✨</div>
            <div className={styles.planInfo}>
              <div className={styles.planName}>{planName}</div>
              <div className={styles.planDuration}>{planDuration}</div>
            </div>
          </div>

          {/* Action Button */}
          <button className={styles.button} onClick={onClose}>
            Tuyệt vời!
          </button>
        </div>
      </div>
    </div>
  );
}
