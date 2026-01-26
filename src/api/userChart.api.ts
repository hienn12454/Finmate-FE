import axiosClient from "./axiosClient";

export interface UserChartData {
  date: string;
  newUsers: number;
  activeUsers: number;
  totalUsers: number;
}

export interface UserChartResponse {
  success: boolean;
  data?: {
    data: UserChartData[];
    totalNewUsers: number;
    totalActiveUsers: number;
    totalUsers: number;
    period: string;
  };
  message?: string;
}

export interface UserStatsResponse {
  success: boolean;
  data?: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    thisYear: number;
    growth: {
      week: number;
      month: number;
      year: number;
    };
    activeUsers: number;
    newUsers: number;
  };
  message?: string;
}

export interface UserChartFilterParams {
  startDate?: string;
  endDate?: string;
  year?: number;
  month?: number;
  day?: number;
  groupBy?: "day" | "week" | "month" | "year";
}

/**
 * User Chart API endpoints
 */
export const userChartApi = {
  /**
   * Get user chart data with filters
   */
  getUserChart: (params?: UserChartFilterParams) =>
    axiosClient.get<UserChartResponse>("/users/chart", { params }),

  /**
   * Get user statistics
   */
  getUserStats: (params?: UserChartFilterParams) =>
    axiosClient.get<UserStatsResponse>("/users/stats", { params }),

  /**
   * Get user growth by year (full year overview)
   */
  getUserGrowthByYear: (year: number) =>
    axiosClient.get<UserChartResponse>("/users/growth/year", { params: { year } }),

  /**
   * Get user growth by month
   */
  getUserGrowthByMonth: (year: number, month: number) =>
    axiosClient.get<UserChartResponse>("/users/growth/month", { params: { year, month } }),

  /**
   * Get user growth by date range
   */
  getUserGrowthByDateRange: (startDate: string, endDate: string) =>
    axiosClient.get<UserChartResponse>("/users/growth/range", { params: { startDate, endDate } }),
};
