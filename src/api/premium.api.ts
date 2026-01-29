import axiosClient from "./axiosClient";

export type PremiumPlan = "1-month" | "6-month" | "1-year";

export interface PremiumSubscriptionDto {
  id: string;
  userId: string;
  plan: PremiumPlan;
  purchasedAt: string;
  expiresAt: string;
  isActive: boolean;
  paymentMethod?: string;
  transactionId?: string;
}

export interface CreateSubscriptionRequest {
  plan: PremiumPlan;
  paymentMethod: string;
  transactionId?: string;
}

export interface SubscriptionResponse {
  subscription: PremiumSubscriptionDto;
  message?: string;
}

/**
 * Premium Subscription API endpoints
 */
export const premiumApi = {
  /**
   * Get current user's premium subscription
   */
  getMySubscription: () =>
    axiosClient.get<SubscriptionResponse>("/premium/subscription"),

  /**
   * Create or extend premium subscription
   * Logic: Nếu đã có subscription và chưa hết hạn, sẽ cộng dồn thời gian
   */
  createSubscription: (data: CreateSubscriptionRequest) =>
    axiosClient.post<SubscriptionResponse>("/premium/subscription", data),

  /**
   * Cancel premium subscription (không hoàn tiền, chỉ đánh dấu không gia hạn)
   */
  cancelSubscription: () =>
    axiosClient.delete<{ message: string }>("/premium/subscription"),

  /**
   * Get subscription history
   */
  getSubscriptionHistory: () =>
    axiosClient.get<{ subscriptions: PremiumSubscriptionDto[] }>(
      "/premium/subscription/history"
    ),
};
