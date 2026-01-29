import { useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useAvatar } from "../hooks/useAvatar";
import { usePremium } from "../hooks/usePremium";
import SuccessModal from "../components/SuccessModal";
import styles from "./PaymentPage.module.css";
import dashboardStyles from "./Dashboard.module.css";

type PaymentMethod = "stripe" | "momo" | "vnpay" | "paypal";

interface Plan {
  id: string;
  name: string;
  duration: string;
  price: string;
  priceValue: number;
}

const PLANS: Record<string, Plan> = {
  "1-month": {
    id: "1-month",
    name: "Premium",
    duration: "1 Tháng",
    price: "79,000 ₫",
    priceValue: 79000,
  },
  "6-month": {
    id: "6-month",
    name: "Premium",
    duration: "6 Tháng",
    price: "389,000 ₫",
    priceValue: 389000,
  },
  "1-year": {
    id: "1-year",
    name: "Premium",
    duration: "1 Năm",
    price: "710,000 ₫",
    priceValue: 710000,
  },
};

export default function PaymentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, isLoading, user } = useAuth();
  const { avatarUrl, displayName, avatarBorderClass } = useAvatar(user);
  const { activatePremium } = usePremium();
  const planId = searchParams.get("plan") || "1-month";
  const selectedPlan = PLANS[planId] || PLANS["1-month"];

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Đợi auth check hoàn thành trước khi redirect
  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.waterGradient} />
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          color: "white",
          fontSize: "1.2rem",
        }}>
          Đang kiểm tra đăng nhập...
        </div>
      </div>
    );
  }

  // Redirect nếu chưa đăng nhập (sau khi đã kiểm tra xong)
  if (!isAuthenticated) {
    return <Navigate to={"/login?redirect=/payment?plan=" + planId} replace />;
  }

  const handlePaymentMethodSelect = (method: PaymentMethod) => {
    setSelectedPaymentMethod(method);
  };

  const handleProceedToPayment = async () => {
    if (!selectedPaymentMethod) {
      alert("Vui lòng chọn phương thức thanh toán");
      return;
    }

    setIsProcessing(true);
    
    try {
      // TODO: Implement actual payment processing với payment gateway
      // For now, just simulate payment và tạo transaction ID
      const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Simulate payment delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Kiểm tra planId hợp lệ trước khi kích hoạt premium
      const validPlanId = (planId === "1-month" || planId === "6-month" || planId === "1-year") 
        ? planId as "1-month" | "6-month" | "1-year"
        : "1-month";
      
      // Kích hoạt premium với gói đã chọn, payment method và transaction ID
      // Backend sẽ tự động cộng dồn thời gian nếu đã có subscription chưa hết hạn
      await activatePremium(validPlanId, selectedPaymentMethod, transactionId);
      
      // Hiển thị popup chúc mừng
      setShowSuccessModal(true);
    } catch (err: any) {
      console.error("Payment error:", err);
      alert(err.response?.data?.message || "Thanh toán thất bại. Vui lòng thử lại.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.waterGradient} />
      
      <header className={styles.header}>
        <button onClick={() => navigate("/")} className={styles.logo}>
          <span className={styles.logoText}>Finmate</span>
        </button>
        <div className={styles.headerRight}>
          <div className={`${styles.avatarWrapper} ${avatarBorderClass ? dashboardStyles[avatarBorderClass] : ""}`}>
            <img
              src={avatarUrl}
              alt={displayName}
              className={styles.avatarImage}
            />
          </div>
          <span className={styles.userName}>{displayName}</span>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.paymentContainer}>
          <div className={styles.paymentCard}>
            <div className={styles.headerSection}>
              <h1 className={styles.title}>Thanh toán</h1>
              <p className={styles.subtitle}>Hoàn tất thanh toán để kích hoạt gói Premium</p>
            </div>

            {/* Plan Summary */}
            <div className={styles.planSummary}>
              <h3 className={styles.sectionTitle}>Gói đã chọn</h3>
              <div className={styles.planInfo}>
                <div className={styles.planDetails}>
                  <span className={styles.planName}>{selectedPlan.name} - {selectedPlan.duration}</span>
                  <span className={styles.planPrice}>{selectedPlan.price}</span>
                </div>
              </div>
            </div>

            {/* Payment Methods */}
            <div className={styles.paymentMethods}>
              <h3 className={styles.sectionTitle}>Chọn phương thức thanh toán</h3>
              <div className={styles.methodsGrid}>
                <button
                  type="button"
                  className={`${styles.paymentMethodCard} ${
                    selectedPaymentMethod === "stripe" ? styles.selected : ""
                  }`}
                  onClick={() => handlePaymentMethodSelect("stripe")}
                >
                  <div className={styles.methodIcon}>
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.49l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-1.765l-.9 5.555C5.255 23.42 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z"
                        fill="currentColor"
                      />
                    </svg>
                  </div>
                  <span className={styles.methodName}>Stripe</span>
                  <span className={styles.methodDesc}>Thẻ tín dụng/Ghi nợ</span>
                </button>

                <button
                  type="button"
                  className={`${styles.paymentMethodCard} ${
                    selectedPaymentMethod === "momo" ? styles.selected : ""
                  }`}
                  onClick={() => handlePaymentMethodSelect("momo")}
                >
                  <div className={styles.methodIcon}>
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect width="24" height="24" rx="4" fill="#A50064" />
                      <path
                        d="M12 6C8.69 6 6 8.69 6 12s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"
                        fill="white"
                      />
                    </svg>
                  </div>
                  <span className={styles.methodName}>MoMo</span>
                  <span className={styles.methodDesc}>Ví điện tử</span>
                </button>

                <button
                  type="button"
                  className={`${styles.paymentMethodCard} ${
                    selectedPaymentMethod === "vnpay" ? styles.selected : ""
                  }`}
                  onClick={() => handlePaymentMethodSelect("vnpay")}
                >
                  <div className={styles.methodIcon}>
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect width="24" height="24" rx="4" fill="#134391" />
                      <path
                        d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0 8c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z"
                        fill="white"
                      />
                    </svg>
                  </div>
                  <span className={styles.methodName}>VNPay</span>
                  <span className={styles.methodDesc}>Ngân hàng</span>
                </button>

                <button
                  type="button"
                  className={`${styles.paymentMethodCard} ${
                    selectedPaymentMethod === "paypal" ? styles.selected : ""
                  }`}
                  onClick={() => handlePaymentMethodSelect("paypal")}
                >
                  <div className={styles.methodIcon}>
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a.695.695 0 0 0-.679.557s-.608 3.928-.61 3.94c-.05.32-.31.54-.63.54h-2.48c-.26 0-.48.19-.52.45l-.61 3.87c-.02.12-.12.2-.24.2h-2.19c-.3 0-.55.22-.59.52l-1.12 7.1c-.05.32.19.6.51.6h2.48c.26 0 .48-.19.52-.45l.61-3.87c.02-.12.12-.2.24-.2h2.19c.3 0 .55-.22.59-.52l1.12-7.1c.05-.32-.19-.6-.51-.6z"
                        fill="#003087"
                      />
                    </svg>
                  </div>
                  <span className={styles.methodName}>PayPal</span>
                  <span className={styles.methodDesc}>Ví điện tử</span>
                </button>
              </div>
            </div>

            {/* Order Summary */}
            <div className={styles.orderSummary}>
              <h3 className={styles.sectionTitle}>Tóm tắt đơn hàng</h3>
              <div className={styles.summaryRow}>
                <span>Gói Premium</span>
                <span>{selectedPlan.price}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Thời hạn</span>
                <span>{selectedPlan.duration}</span>
              </div>
              <div className={styles.summaryDivider}></div>
              <div className={`${styles.summaryRow} ${styles.totalRow}`}>
                <span>Tổng cộng</span>
                <span className={styles.totalPrice}>{selectedPlan.price}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className={styles.actionButtons}>
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className={styles.cancelButton}
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleProceedToPayment}
                disabled={!selectedPaymentMethod || isProcessing}
                className={styles.payButton}
              >
                {isProcessing ? "Đang xử lý..." : `Thanh toán ${selectedPlan.price}`}
              </button>
            </div>
          </div>
        </div>
      </main>

      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          navigate("/dashboard");
        }}
        planName={selectedPlan.name}
        planDuration={selectedPlan.duration}
      />
    </div>
  );
}
