/// <reference types="vite/client" />
import axios from 'axios';
import { AuthResponse, Expense, ExpenseStats } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Auto-attach token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auth
export const authApi = {
  signup: (name: string, email: string, password: string): Promise<{ data: AuthResponse }> =>
    api.post('/api/auth/signup', { name, email, password }),

  login: (email: string, password: string): Promise<{ data: AuthResponse }> =>
    api.post('/api/auth/login', { email, password }),
};

// Expenses
export const expensesApi = {
  getAll: (params?: {
    month?: number;
    year?: number;
    category?: string;
    search?: string;
  }): Promise<{ data: Expense[] }> =>
    api.get('/api/expenses', { params }),

  create: (expense: {
    amount: number;
    description: string;
    date: string;
    category?: string;
  }): Promise<{ data: Expense }> =>
    api.post('/api/expenses', expense),

  update: (id: number, expense: Partial<Expense>): Promise<{ data: Expense }> =>
    api.put(`/api/expenses/${id}`, expense),

  delete: (id: number): Promise<void> =>
    api.delete(`/api/expenses/${id}`),

  getStats: (month?: number, year?: number): Promise<{ data: ExpenseStats }> =>
    api.get('/api/expenses/stats', { params: { month, year } }),
};

// Budget
export const budgetApi = {
  get: (): Promise<{ data: { monthlyBudget: number } }> =>
    api.get('/api/budget'),

  update: (monthlyBudget: number): Promise<{ data: { monthlyBudget: number } }> =>
    api.put('/api/budget', { monthlyBudget }),
};

// Receipt
export const receiptApi = {
  extract: (image: string): Promise<{ data: { amount: number; description: string } }> =>
    api.post('/api/receipt/extract', { image }),
};