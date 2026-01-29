import { useMemo } from "react";
import type { User } from "./useAuth";
import { usePremium } from "./usePremium";

/**
 * Hook để lấy avatar URL đồng bộ từ user
 * Sử dụng ở tất cả các trang để đảm bảo avatar đồng bộ
 */
export const useAvatar = (user?: User | null) => {
  const { currentPlan, premiumStatus } = usePremium();

  const avatarUrl = useMemo(() => {
    if (user?.avatarUrl && user.avatarUrl.trim().length > 0) {
      return user.avatarUrl;
    }
    // Default avatar - cute panda
    return "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS5qjFaBWTlDczeMPLqG8qBfsCcxndnTQbyVA&s";
  }, [user?.avatarUrl]);

  const displayName = useMemo(() => {
    return user?.fullName || user?.email?.split("@")[0] || "Người dùng";
  }, [user?.fullName, user?.email]);

  // Avatar border style: hiện tại tắt hoàn toàn (không dùng viền động)
  const avatarBorderClass = useMemo(() => {
    return "";
  }, [currentPlan]);

  // Format tên gói để hiển thị
  const planDisplayName = useMemo(() => {
    if (!currentPlan) return null;
    switch (currentPlan) {
      case "1-month":
        return "Premium 1 Tháng";
      case "6-month":
        return "Premium 6 Tháng";
      case "1-year":
        return "Premium 1 Năm";
      default:
        return null;
    }
  }, [currentPlan]);

  const planBadgeClass = useMemo(() => {
    if (!currentPlan) return "";
    switch (currentPlan) {
      case "6-month":
        return "currentPlanBadgePurple";
      case "1-year":
        return "currentPlanBadgeGold";
      case "1-month":
      default:
        return "";
    }
  }, [currentPlan]);

  return { 
    avatarUrl, 
    displayName, 
    currentPlan, 
    avatarBorderClass,
    premiumStatus,
    planDisplayName,
    planBadgeClass
  };
};
