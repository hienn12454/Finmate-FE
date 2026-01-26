import axiosClient from "./axiosClient";

export interface User {
  id: string;
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  status?: "active" | "inactive" | "suspended";
  createdAt?: string;
  updatedAt?: string;
}

export interface UserListResponse {
  success: boolean;
  data?: {
    users: User[];
    total: number;
    page: number;
    limit: number;
  };
  message?: string;
}

export interface UserResponse {
  success: boolean;
  data?: User;
  message?: string;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
}

export interface UpdateUserRequest {
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  status?: "active" | "inactive" | "suspended";
}

/**
 * User Management API endpoints
 */
export const userApi = {
  /**
   * Get list of users with pagination
   */
  getUsers: (params?: { page?: number; limit?: number; search?: string; status?: string }) =>
    axiosClient.get<UserListResponse>("/users", { params }),

  /**
   * Get user by ID
   */
  getUserById: (id: string) =>
    axiosClient.get<UserResponse>(`/users/${id}`),

  /**
   * Create new user
   */
  createUser: (data: CreateUserRequest) =>
    axiosClient.post<UserResponse>("/users", data),

  /**
   * Update user
   */
  updateUser: (id: string, data: UpdateUserRequest) =>
    axiosClient.put<UserResponse>(`/users/${id}`, data),

  /**
   * Delete user
   */
  deleteUser: (id: string) =>
    axiosClient.delete<{ success: boolean; message?: string }>(`/users/${id}`),

  /**
   * Activate user
   */
  activateUser: (id: string) =>
    axiosClient.post<{ success: boolean; message?: string }>(`/users/${id}/activate`),

  /**
   * Deactivate user
   */
  deactivateUser: (id: string) =>
    axiosClient.post<{ success: boolean; message?: string }>(`/users/${id}/deactivate`),
};
