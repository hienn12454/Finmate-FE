import axiosClient from "./axiosClient";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  phoneNumber: string;
}

export interface AuthResponse {
  success?: boolean;
  token?: string;
  user?: {
    id: string;
    email: string;
    fullName?: string;
    phoneNumber?: string;
  };
  message?: string;
}

/**
 * Authentication API endpoints
 */
export const authApi = {
  /**
   * Login with email and password
   */
  login: (data: LoginRequest) =>
    axiosClient.post<AuthResponse>("/auth/login", data),

  /**
   * Register new user
   */
  register: (data: RegisterRequest) =>
    axiosClient.post<AuthResponse>("/auth/register", data),

  /**
   * Get current user information
   */
  me: () => axiosClient.get("/auth/me"),

  /**
   * Logout
   */
  logout: () => axiosClient.post("/auth/logout"),

  /**
   * Test authentication endpoint
   */
  test: () => axiosClient.get("/auth/test"),
};
