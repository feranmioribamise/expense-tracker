import { useState, useEffect } from 'react';
import { budgetApi } from '../services/api';
import toast from 'react-hot-toast';

interface BudgetTrackerProps {
  totalSpent: number;
  month: number;
  year: number;
}

export const BudgetTracker = ({ totalSpent, month, year }: BudgetTrackerProps) => {
  const [budget, setBudget] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBudget();
  }, []);

  const fetchBudget = async () => {
    try {
      const res = await budgetApi.get();
      const budgetValue = Number(res.data.monthlyBudget) || 0;
      setBudget(budgetValue);
      setInputValue(budgetValue.toString());
    } catch {
      toast.error('Failed to load budget');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const newBudget = parseFloat(inputValue);
    if (isNaN(newBudget) || newBudget < 0) {
      toast.error('Invalid budget amount');
      return;
    }

    try {
      await budgetApi.update(newBudget);
      setBudget(newBudget);
      setIsEditing(false);
      toast.success('Budget updated!');
    } catch {
      toast.error('Failed to update budget');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="animate-pulse h-32" />
      </div>
    );
  }

  const percentage = budget > 0 ? (totalSpent / budget) * 100 : 0;
  const remaining = budget - totalSpent;

  const getStatusColor = () => {
    if (percentage >= 100) return 'text-red-600';
    if (percentage >= 90) return 'text-orange-600';
    if (percentage >= 80) return 'text-amber-600';
    return 'text-green-600';
  };

  const getProgressColor = () => {
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 90) return 'bg-orange-500';
    if (percentage >= 80) return 'bg-amber-500';
    return 'bg-green-500';
  };

  const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-900">Monthly Budget</h2>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-xs text-indigo-600 hover:underline"
          >
            Edit
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Set budget for {monthName}</label>
            <input
              type="number"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              Save
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setInputValue(budget.toString());
              }}
              className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : budget === 0 ? (
        <div className="text-center py-6">
          <p className="text-sm text-gray-500 mb-3">No budget set for this month</p>
          <button
            onClick={() => setIsEditing(true)}
            className="text-sm text-indigo-600 font-medium hover:underline"
          >
            Set a budget
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-baseline">
            <div>
              <p className="text-2xl font-bold text-gray-900">${totalSpent.toFixed(2)}</p>
              <p className="text-xs text-gray-500">of ${budget.toFixed(2)}</p>
            </div>
            <p className={`text-sm font-semibold ${getStatusColor()}`}>
              {percentage.toFixed(0)}%
            </p>
          </div>

          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${getProgressColor()}`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-600">
              {remaining >= 0 ? 'Remaining' : 'Over budget'}
            </span>
            <span className={remaining >= 0 ? 'text-gray-900 font-medium' : 'text-red-600 font-bold'}>
              ${Math.abs(remaining).toFixed(2)}
            </span>
          </div>

          {percentage >= 80 && percentage < 100 && (
            <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded-lg">
              Warning: You've used {percentage.toFixed(0)}% of your budget
            </p>
          )}
          {percentage >= 100 && (
            <p className="text-xs text-red-600 bg-red-50 p-2 rounded-lg font-medium">
              You've exceeded your budget by ${(totalSpent - budget).toFixed(2)}
            </p>
          )}
        </div>
      )}
    </div>
  );
};