import { useState, useEffect, useCallback } from "react";
import { premiumApi } from "../api/premium.api";
import type { PremiumPlan } from "../api/premium.api";
import { useAuth } from "./useAuth";

export type PremiumPlanType = PremiumPlan | null;

export interface PremiumStatus {
  plan: PremiumPlanType;
  purchasedAt: string | null;
  expiresAt: string | null;
}

const STORAGE_KEY = "finmate_premium_status";

// Helper function để xác định badge plan
// Logic:
// - Nếu subscription chưa hết hạn -> giữ badge cao nhất giữa currentPlan và newPlan
// - Nếu subscription đã hết hạn -> badge mới sẽ là newPlan
function getBadgePlan(
  currentPlan: PremiumPlanType,
  newPlan: PremiumPlan,
  expiresAt: string | null
): PremiumPlan {
  // Nếu không có subscription hiện tại hoặc đã hết hạn -> badge mới
  if (!currentPlan || !expiresAt) {
    return newPlan;
  }

  const now = new Date();
  const expiresDate = new Date(expiresAt);

  // Nếu subscription đã hết hạn -> badge mới sẽ là gói mới mua
  if (expiresDate <= now) {
    return newPlan;
  }

  // Nếu subscription chưa hết hạn -> giữ badge cao nhất
  const planPriority: Record<PremiumPlan, number> = {
    "1-month": 1,
    "6-month": 2,
    "1-year": 3,
  };

  // Lấy badge cao nhất giữa currentPlan và newPlan
  return planPriority[newPlan] > planPriority[currentPlan] ? newPlan : currentPlan;
}

export function usePremium() {
  const { isAuthenticated } = useAuth();
  const [premiumStatus, setPremiumStatus] = useState<PremiumStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load subscription từ API hoặc localStorage
  const loadSubscription = useCallback(async () => {
    if (!isAuthenticated) {
      // Nếu chưa đăng nhập, load từ localStorage
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as PremiumStatus;
          if (parsed.expiresAt) {
            const expiresAt = new Date(parsed.expiresAt);
            if (expiresAt > new Date()) {
              setPremiumStatus(parsed);
            } else {
              localStorage.removeItem(STORAGE_KEY);
              setPremiumStatus(null);
            }
          } else {
            setPremiumStatus(parsed);
          }
        } catch (err) {
          console.error("Error loading premium status from localStorage:", err);
          localStorage.removeItem(STORAGE_KEY);
        }
      }
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await premiumApi.getMySubscription();
      const subscription = response.data.subscription;
      
      if (subscription && subscription.isActive) {
        const expiresAt = new Date(subscription.expiresAt);
        if (expiresAt > new Date()) {
          // Badge plan sẽ được backend xác định và trả về trong subscription.plan
          // Frontend chỉ cần sử dụng plan từ backend
          const status: PremiumStatus = {
            plan: subscription.plan as PremiumPlanType,
            purchasedAt: subscription.purchasedAt,
            expiresAt: subscription.expiresAt,
          };
          
          setPremiumStatus(status);
          // Đồng bộ với localStorage để offline support
          localStorage.setItem(STORAGE_KEY, JSON.stringify(status));
        } else {
          setPremiumStatus(null);
          localStorage.removeItem(STORAGE_KEY);
        }
      } else {
        setPremiumStatus(null);
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (err: any) {
      console.error("Error loading premium subscription:", err);
      // Fallback to localStorage nếu API fail
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as PremiumStatus;
          setPremiumStatus(parsed);
        } catch (e) {
          // Ignore
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadSubscription();
  }, [loadSubscription]);

  const activatePremium = async (
    planId: PremiumPlan,
    paymentMethod: string = "stripe",
    transactionId?: string
  ) => {
    if (!planId) return;

    if (!isAuthenticated) {
      // Fallback to localStorage nếu chưa đăng nhập
      const now = new Date();
      let expiresAt: Date;

      switch (planId) {
        case "1-month":
          expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
          break;
        case "6-month":
          expiresAt = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000);
          break;
        case "1-year":
          expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          return;
      }

      // Logic badge cho offline: nếu có subscription cũ chưa hết hạn -> giữ badge cao nhất
      const currentStatus = premiumStatus;
      let badgePlan = planId;
      
      if (currentStatus && currentStatus.expiresAt) {
        const currentExpiresAt = new Date(currentStatus.expiresAt);
        if (currentExpiresAt > now) {
          // Subscription chưa hết hạn -> giữ badge cao nhất
          badgePlan = getBadgePlan(currentStatus.plan, planId, currentStatus.expiresAt);
        }
        // Nếu đã hết hạn -> badge mới sẽ là plan mới mua (đã set ở trên)
      }

      const status: PremiumStatus = {
        plan: badgePlan,
        purchasedAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(status));
      setPremiumStatus(status);
      return;
    }

    try {
      // Gọi API để tạo/extend subscription
      // Backend sẽ tự động cộng dồn thời gian nếu đã có subscription chưa hết hạn
      const response = await premiumApi.createSubscription({
        plan: planId,
        paymentMethod,
        transactionId,
      });

      const subscription = response.data.subscription;
      
      // Backend đã xác định badge plan dựa trên logic:
      // - Nếu subscription chưa hết hạn -> giữ badge cao nhất
      // - Nếu subscription đã hết hạn -> badge mới sẽ là gói mới mua
      // Frontend chỉ cần sử dụng plan từ backend
      const status: PremiumStatus = {
        plan: subscription.plan as PremiumPlanType,
        purchasedAt: subscription.purchasedAt,
        expiresAt: subscription.expiresAt, // Backend đã cộng dồn thời gian
      };

      setPremiumStatus(status);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(status));
    } catch (err: any) {
      console.error("Error activating premium:", err);
      throw err;
    }
  };

  const cancelPremium = async () => {
    if (isAuthenticated) {
      try {
        await premiumApi.cancelSubscription();
      } catch (err) {
        console.error("Error canceling premium:", err);
      }
    }
    
    localStorage.removeItem(STORAGE_KEY);
    setPremiumStatus(null);
  };

  const isPremium = premiumStatus !== null && premiumStatus.plan !== null;

  return {
    premiumStatus,
    isPremium,
    currentPlan: premiumStatus?.plan || null,
    isLoading,
    activatePremium,
    cancelPremium,
    refreshSubscription: loadSubscription,
  };
}
