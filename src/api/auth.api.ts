import axiosClient from "./axiosClient";

/**
 * Authentication API - Clerk-only flow
 */
export const authApi = {
  /**
   * Lấy thông tin user hiện tại từ Clerk JWT.
   * Backend tự động tạo user nếu chưa tồn tại (first login).
   */
  me: () => axiosClient.get("/auth/me"),

  /**
   * Test endpoint kiểm tra authentication
   */
  test: () => axiosClient.get("/auth/test"),
};
