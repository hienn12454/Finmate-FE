import axiosClient from "./axiosClient";

/* ===== Voucher ===== */
export interface Voucher {
  id: string;
  code: string;
  discountPercent: number;
  discountAmount?: number;
  maxUses: number;
  currentUses: number;
  validFrom: string;
  validTo: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface VoucherListResponse {
  success: boolean;
  data?: {
    vouchers: Voucher[];
    total: number;
    page: number;
    limit: number;
  };
  message?: string;
}

export interface VoucherResponse {
  success: boolean;
  data?: Voucher;
  message?: string;
}

export interface CreateVoucherRequest {
  code: string;
  discountPercent?: number;
  discountAmount?: number;
  maxUses: number;
  validFrom: string;
  validTo: string;
}

export interface UpdateVoucherRequest {
  code?: string;
  discountPercent?: number;
  discountAmount?: number;
  maxUses?: number;
  validFrom?: string;
  validTo?: string;
  isActive?: boolean;
}

/* ===== Plan / Pricing ===== */
export interface PlanPricing {
  id: string;
  planId: string;        // "1-month" | "6-month" | "1-year"
  name: string;
  duration: string;
  price: number;
  originalPrice?: number;
  isActive: boolean;
  updatedAt?: string;
}

export interface PlanPricingListResponse {
  success: boolean;
  data?: PlanPricing[];
  message?: string;
}

export interface UpdatePlanPricingRequest {
  price?: number;
  name?: string;
  isActive?: boolean;
}

/* ===== Post Management ===== */
export interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string[];
  type: "blog" | "guide";
  tags?: string[];
  readingMinutes?: number;
  date?: string;
  isPublished: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PostListResponse {
  success: boolean;
  data?: {
    posts: Post[];
    total: number;
    page: number;
    limit: number;
  };
  message?: string;
}

export interface PostResponse {
  success: boolean;
  data?: Post;
  message?: string;
}

export interface CreatePostRequest {
  slug: string;
  title: string;
  excerpt: string;
  content: string[];
  type: "blog" | "guide";
  tags?: string[];
  readingMinutes?: number;
}

export interface UpdatePostRequest {
  slug?: string;
  title?: string;
  excerpt?: string;
  content?: string[];
  tags?: string[];
  readingMinutes?: number;
  isPublished?: boolean;
}

/* ===== Role Management ===== */
export interface PromoteUserRequest {
  role: "admin" | "user";
}

export interface AdminStatsResponse {
  success: boolean;
  data?: {
    totalUsers: number;
    activeUsers: number;
    premiumUsers: number;
    totalRevenue: number;
    monthlyRevenue: number;
    newUsersToday: number;
    newUsersThisMonth: number;
    activeVouchers: number;
  };
  message?: string;
}

/**
 * Admin-only API endpoints
 */
export const adminApi = {
  /* ── Dashboard Stats ── */
  getStats: () =>
    axiosClient.get<AdminStatsResponse>("/admin/stats"),

  /* ── User Management ── */
  promoteUser: (userId: string, data: PromoteUserRequest) =>
    axiosClient.put<{ success: boolean; message?: string }>(
      `/admin/users/${userId}/role`,
      data
    ),

  /* ── Vouchers ── */
  getVouchers: (params?: { page?: number; limit?: number; search?: string }) =>
    axiosClient.get<VoucherListResponse>("/admin/vouchers", { params }),

  getVoucherById: (id: string) =>
    axiosClient.get<VoucherResponse>(`/admin/vouchers/${id}`),

  createVoucher: (data: CreateVoucherRequest) =>
    axiosClient.post<VoucherResponse>("/admin/vouchers", data),

  updateVoucher: (id: string, data: UpdateVoucherRequest) =>
    axiosClient.put<VoucherResponse>(`/admin/vouchers/${id}`, data),

  deleteVoucher: (id: string) =>
    axiosClient.delete<{ success: boolean; message?: string }>(
      `/admin/vouchers/${id}`
    ),

  /* ── Plan Pricing ── */
  getPlanPricings: () =>
    axiosClient.get<PlanPricingListResponse>("/admin/plans"),

  updatePlanPricing: (planId: string, data: UpdatePlanPricingRequest) =>
    axiosClient.put<{ success: boolean; message?: string }>(
      `/admin/plans/${planId}`,
      data
    ),

  /* ── Posts ── */
  getPosts: (params?: { page?: number; limit?: number; type?: string; search?: string }) =>
    axiosClient.get<PostListResponse>("/admin/posts", { params }),

  getPostById: (id: string) =>
    axiosClient.get<PostResponse>(`/admin/posts/${id}`),

  createPost: (data: CreatePostRequest) =>
    axiosClient.post<PostResponse>("/admin/posts", data),

  updatePost: (id: string, data: UpdatePostRequest) =>
    axiosClient.put<PostResponse>(`/admin/posts/${id}`, data),

  deletePost: (id: string) =>
    axiosClient.delete<{ success: boolean; message?: string }>(
      `/admin/posts/${id}`
    ),
};
