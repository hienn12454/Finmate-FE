import { useEffect } from "react";
import { usePremium } from "../hooks/usePremium";
import styles from "./UpgradeModal.module.css";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgradeClick?: (planId: string) => void;
}

interface Plan {
  id: string;
  name: string;
  duration: string;
  price: string;
  originalPrice?: string;
  discount?: string;
  features: string[];
  highlight?: "purple" | "gold" | "none";
  popular?: boolean;
}

const PLANS: Plan[] = [
  {
    id: "1-month",
    name: "Premium",
    duration: "1 Tháng",
    price: "79,000 ₫",
    features: [
      "Truy cập đầy đủ tính năng",
      "Báo cáo chi tiết không giới hạn",
      "Hỗ trợ ưu tiên",
      "Xuất dữ liệu Excel/PDF",
    ],
    highlight: "none",
  },
  {
    id: "6-month",
    name: "Premium",
    duration: "6 Tháng",
    price: "389,000 ₫",
    originalPrice: "474,000 ₫",
    discount: "18%",
    features: [
      "Tất cả tính năng gói 1 tháng",
      "Tiết kiệm 18% so với gói hàng tháng",
      "Báo cáo nâng cao",
      "Hỗ trợ ưu tiên 24/7",
      "Xuất dữ liệu không giới hạn",
      "Tích hợp API",
    ],
    highlight: "purple",
    popular: true,
  },
  {
    id: "1-year",
    name: "Premium",
    duration: "1 Năm",
    price: "710,000 ₫",
    originalPrice: "948,000 ₫",
    discount: "25%",
    features: [
      "Tất cả tính năng gói 6 tháng",
      "Tiết kiệm 25% - Giá tốt nhất",
      "Báo cáo nâng cao + AI phân tích",
      "Hỗ trợ ưu tiên 24/7",
      "Xuất dữ liệu không giới hạn",
      "Tích hợp API + Webhook",
      "Tùy chỉnh giao diện",
      "Quản lý nhiều tài khoản",
    ],
    highlight: "gold",
  },
];

export default function UpgradeModal({ isOpen, onClose, onUpgradeClick }: UpgradeModalProps) {
  const { currentPlan } = usePremium();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUpgrade = (planId: string) => {
    if (onUpgradeClick) {
      onUpgradeClick(planId);
    } else {
      // Fallback: just close modal
      onClose();
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose} aria-label="Đóng">
          ×
        </button>
        
        <div className={styles.header}>
          <h2 className={styles.title}>
            {currentPlan ? "Gói Premium của bạn" : "Nâng cấp tài khoản"}
          </h2>
          <p className={styles.subtitle}>
            {currentPlan
              ? `Bạn đang sử dụng gói ${PLANS.find((p) => p.id === currentPlan)?.duration || ""}. Nâng cấp để tận hưởng nhiều tính năng hơn!`
              : "Chọn gói phù hợp với nhu cầu của bạn"}
          </p>
        </div>

        <div className={styles.plansGrid}>
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`${styles.planCard} ${
                plan.highlight === "purple" ? styles.planCardPurple : ""
              } ${plan.highlight === "gold" ? styles.planCardGold : ""}`}
            >
              {plan.popular && (
                <div className={styles.popularBadge}>PHỔ BIẾN</div>
              )}
              
              <div className={styles.planHeader}>
                <h3 className={styles.planName}>{plan.name}</h3>
                <p className={styles.planDuration}>{plan.duration}</p>
              </div>

              <div className={styles.planPricing}>
                <div className={styles.priceContainer}>
                  <span className={styles.price}>{plan.price}</span>
                  {plan.originalPrice && (
                    <span className={styles.originalPrice}>{plan.originalPrice}</span>
                  )}
                </div>
                {plan.discount && (
                  <span className={styles.discount}>Tiết kiệm {plan.discount}</span>
                )}
              </div>

              <ul className={styles.featuresList}>
                {plan.features.map((feature, index) => (
                  <li key={index} className={styles.featureItem}>
                    <span className={styles.checkmark}>✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                className={`${styles.upgradeButton} ${
                  plan.highlight === "purple" ? styles.upgradeButtonPurple : ""
                } ${plan.highlight === "gold" ? styles.upgradeButtonGold : ""}`}
                onClick={() => handleUpgrade(plan.id)}
                disabled={plan.id === currentPlan}
              >
                {plan.id === currentPlan
                  ? "Gói hiện tại của bạn"
                  : currentPlan
                  ? "Nâng cấp lên gói này"
                  : `Nâng cấp lên ${plan.name}`}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
