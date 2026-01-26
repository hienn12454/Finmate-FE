import axiosClient from "./axiosClient";

export interface Staff {
  id: string;
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  department?: string;
  position?: string;
  status?: "active" | "inactive" | "on_leave";
  salary?: number;
  hireDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface StaffListResponse {
  success: boolean;
  data?: {
    staff: Staff[];
    total: number;
    page: number;
    limit: number;
  };
  message?: string;
}

export interface StaffResponse {
  success: boolean;
  data?: Staff;
  message?: string;
}

export interface CreateStaffRequest {
  username: string;
  password: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  department?: string;
  position?: string;
  salary?: number;
  hireDate?: string;
}

export interface UpdateStaffRequest {
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  department?: string;
  position?: string;
  status?: "active" | "inactive" | "on_leave";
  salary?: number;
  hireDate?: string;
}

/**
 * Staff Management API endpoints
 */
export const staffApi = {
  /**
   * Get list of staff with pagination
   */
  getStaff: (params?: { page?: number; limit?: number; search?: string; department?: string; status?: string }) =>
    axiosClient.get<StaffListResponse>("/staff", { params }),

  /**
   * Get staff by ID
   */
  getStaffById: (id: string) =>
    axiosClient.get<StaffResponse>(`/staff/${id}`),

  /**
   * Create new staff
   */
  createStaff: (data: CreateStaffRequest) =>
    axiosClient.post<StaffResponse>("/staff", data),

  /**
   * Update staff
   */
  updateStaff: (id: string, data: UpdateStaffRequest) =>
    axiosClient.put<StaffResponse>(`/staff/${id}`, data),

  /**
   * Delete staff
   */
  deleteStaff: (id: string) =>
    axiosClient.delete<{ success: boolean; message?: string }>(`/staff/${id}`),

  /**
   * Get staff statistics
   */
  getStaffStats: () =>
    axiosClient.get<{ success: boolean; data?: { total: number; active: number; inactive: number; onLeave: number } }>("/staff/stats"),
};
