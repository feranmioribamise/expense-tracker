export interface User {
  id: number;
  name: string;
  email: string;
}

export interface Expense {
  id: number;
  amount: number;
  description: string;
  category: string;
  date: string;
  created_at: string;
}

export interface ExpenseStats {
  totalSpent: number;
  expenseCount: number;
  byCategory: { category: string; total: number; count: number }[];
  monthlyTrend: { month: string; total: number }[];
}

export interface AuthResponse {
  token: string;
  user: User;
}

export const CATEGORIES = [
  'All',
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Bills & Utilities',
  'Healthcare',
  'Travel',
  'Education',
  'Other',
] as const;

export const CATEGORY_COLORS: Record<string, string> = {
  'Food & Dining': '#f59e0b',
  'Transportation': '#3b82f6',
  'Shopping': '#ec4899',
  'Entertainment': '#8b5cf6',
  'Bills & Utilities': '#6b7280',
  'Healthcare': '#10b981',
  'Travel': '#f97316',
  'Education': '#06b6d4',
  'Other': '#94a3b8',
};
