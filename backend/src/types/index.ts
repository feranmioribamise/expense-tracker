export interface User {
  id: number;
  email: string;
  name: string;
  created_at: Date;
}

export interface Expense {
  id: number;
  user_id: number;
  amount: number;
  description: string;
  category: string;
  date: string;
  created_at: Date;
}

export interface AuthRequest extends Express.Request {
  user?: { id: number; email: string };
}

export interface ExpenseStats {
  category: string;
  total: number;
  count: number;
}

export type Category =
  | 'Food & Dining'
  | 'Transportation'
  | 'Shopping'
  | 'Entertainment'
  | 'Bills & Utilities'
  | 'Healthcare'
  | 'Travel'
  | 'Education'
  | 'Other';
