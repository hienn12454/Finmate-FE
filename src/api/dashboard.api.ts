import axiosClient from "./axiosClient";

// DTOs khớp với backend

export interface CategoryStatDto {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  amount: number;
  percentage: number;
  color: string;
}

export interface OverviewReportDto {
  totalIncome: number;
  totalExpense: number;
  difference: number;
  categoryStats: CategoryStatDto[];
}

export interface MoneySourceDto {
  id: string;
  userId: string;
  accountTypeId: string;
  accountTypeName: string;
  name: string;
  icon: string;
  color: string;
  balance: number;
  currency: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MoneySourceGroupedDto {
  accountTypeId: string;
  accountTypeName: string;
  displayOrder: number;
  totalBalance: number;
  moneySources: MoneySourceDto[];
}

export interface MoneySourceGroupedResponseDto {
  totalBalance: number;
  groups: MoneySourceGroupedDto[];
}

export interface TransactionDto {
  id: string;
  userId: string;
  transactionTypeId: string;
  transactionTypeName: string;
  transactionTypeColor: string;
  isIncome: boolean;
  moneySourceId: string;
  moneySourceName: string;
  moneySourceIcon: string;
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  contactId?: string | null;
  contactName?: string | null;
  amount: number;
  transactionDate: string;
  description?: string | null;
  isBorrowingForThis: boolean;
  isFee: boolean;
  excludeFromReport: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionListResponseDto {
  totalCount: number;
  page: number;
  pageSize: number;
  transactions: TransactionDto[];
}

export interface TransactionTypeDto {
  id: string;
  name: string;
  color: string;
  isIncome: boolean;
}

export interface CategoryDto {
  id: string;
  name: string;
  icon: string;
  color: string;
  transactionTypeId: string;
}

export interface CreateTransactionRequest {
  transactionTypeId: string;
  categoryId: string;
  moneySourceId: string;
  amount: number;
  transactionDate: string;
  description?: string;
  contactId?: string | null;
  isBorrowingForThis?: boolean;
  isFee?: boolean;
  excludeFromReport?: boolean;
}

export const dashboardApi = {
  // Tổng quan thu/chi + thống kê theo danh mục
  getOverview: () => axiosClient.get<OverviewReportDto>("/reports/overview"),

  // Tổng số dư & group theo loại tài khoản
  getMoneySourcesGrouped: () =>
    axiosClient.get<MoneySourceGroupedResponseDto>("/money-sources/grouped"),

  // Danh sách nguồn tiền (để user chọn khi tạo giao dịch)
  getMoneySources: () => axiosClient.get<MoneySourceDto[]>("/money-sources"),

  // Loại giao dịch (Chi tiêu, Thu tiền, v.v.)
  getTransactionTypes: () =>
    axiosClient.get<TransactionTypeDto[]>("/transaction-types"),

  // Danh mục (có thể filter theo transactionTypeId)
  getCategories: (transactionTypeId?: string) =>
    axiosClient.get<CategoryDto[]>("/categories", {
      params: transactionTypeId ? { transactionTypeId } : undefined,
    }),

  // Giao dịch gần đây
  getRecentTransactions: (page = 1, pageSize = 5) =>
    axiosClient.get<TransactionListResponseDto>("/transactions", {
      params: { page, pageSize },
    }),

  // Tạo giao dịch mới
  createTransaction: (payload: CreateTransactionRequest) =>
    axiosClient.post<TransactionDto>("/transactions", payload),
};

