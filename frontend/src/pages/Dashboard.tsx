import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { expensesApi } from '../services/api';
import { ExpenseStats, CATEGORY_COLORS } from '../types';
import { BudgetTracker } from '../components/BudgetTracker';
import toast from 'react-hot-toast';

export const Dashboard = () => {
  const [stats, setStats] = useState<ExpenseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const now = new Date();
  const [month] = useState(now.getMonth() + 1);
  const [year] = useState(now.getFullYear());

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await expensesApi.getStats(month, year);
        setStats(res.data);
      } catch {
        toast.error('Failed to load stats');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [month, year]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const monthName = now.toLocaleString('default', { month: 'long' });
  const pieData = stats?.byCategory.map(c => ({
    name: c.category,
    value: parseFloat(String(c.total)),
  })) || [];

  const barData = stats?.monthlyTrend.map(t => ({
    month: t.month,
    total: parseFloat(String(t.total)),
  })) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">{monthName} {year} Overview</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium">Total Spent</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            ${Number(stats?.totalSpent || 0).toFixed(2)}
          </p>
          <p className="text-xs text-gray-400 mt-1">This month</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium">Transactions</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{stats?.expenseCount || 0}</p>
          <p className="text-xs text-gray-400 mt-1">This month</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium">Avg Per Transaction</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            ${stats?.expenseCount
              ? (Number(stats.totalSpent) / stats.expenseCount).toFixed(2)
              : '0.00'}
          </p>
          <p className="text-xs text-gray-400 mt-1">This month</p>
        </div>
      </div>

      {/* Budget Tracker */}
      <BudgetTracker totalSpent={stats?.totalSpent || 0} month={month} year={year} />

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Spending by Category</h2>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={CATEGORY_COLORS[entry.name] || '#94a3b8'}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, 'Spent']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">
              No expenses this month
            </div>
          )}
        </div>

        {/* Bar Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Monthly Trend</h2>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={barData}>
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
                <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, 'Total']} />
                <Bar dataKey="total" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">
              No trend data yet
            </div>
          )}
        </div>
      </div>

      {/* Category Breakdown */}
      {stats && stats.byCategory.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Category Breakdown</h2>
          <div className="space-y-3">
            {stats.byCategory.map(cat => {
              const pct = ((Number(cat.total) / Number(stats.totalSpent)) * 100).toFixed(1);
              return (
                <div key={cat.category}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700 font-medium">{cat.category}</span>
                    <span className="text-gray-500">${Number(cat.total).toFixed(2)} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: CATEGORY_COLORS[cat.category] || '#94a3b8'
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};