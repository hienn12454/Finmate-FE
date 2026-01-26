import axiosClient from "./axiosClient";

export interface RevenueData {
  date: string;
  revenue: number;
  expenses?: number;
  profit?: number;
}

export interface RevenueChartResponse {
  success: boolean;
  data?: {
    data: RevenueData[];
    totalRevenue: number;
    totalExpenses?: number;
    totalProfit?: number;
    period: string;
  };
  message?: string;
}

export interface RevenueStatsResponse {
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
  };
  message?: string;
}

export interface RevenueFilterParams {
  startDate?: string;
  endDate?: string;
  year?: number;
  month?: number;
  day?: number;
  groupBy?: "day" | "week" | "month" | "year";
}

/**
 * Revenue Management API endpoints
 */
export const revenueApi = {
  /**
   * Get revenue chart data with filters
   */
  getRevenueChart: (params?: RevenueFilterParams) =>
    axiosClient.get<RevenueChartResponse>("/revenue/chart", { params }),

  /**
   * Get revenue statistics
   */
  getRevenueStats: (params?: RevenueFilterParams) =>
    axiosClient.get<RevenueStatsResponse>("/revenue/stats", { params }),

  /**
   * Get revenue by year (full year overview)
   */
  getRevenueByYear: (year: number) =>
    axiosClient.get<RevenueChartResponse>("/revenue/year", { params: { year } }),

  /**
   * Get revenue by month
   */
  getRevenueByMonth: (year: number, month: number) =>
    axiosClient.get<RevenueChartResponse>("/revenue/month", { params: { year, month } }),

  /**
   * Get revenue by date range
   */
  getRevenueByDateRange: (startDate: string, endDate: string) =>
    axiosClient.get<RevenueChartResponse>("/revenue/range", { params: { startDate, endDate } }),
};
