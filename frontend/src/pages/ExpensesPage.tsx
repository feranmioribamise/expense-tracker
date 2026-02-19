import { useState, useEffect, useCallback } from 'react';
import { expensesApi, receiptApi } from '../services/api';
import { Expense, CATEGORIES, CATEGORY_COLORS } from '../types';
import toast from 'react-hot-toast';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

export const ExpensesPage = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const now = new Date();
  const [month] = useState(now.getMonth() + 1);
  const [year] = useState(now.getFullYear());

  // Form state
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(now.toISOString().split('T')[0]);
  const [manualCategory, setManualCategory] = useState('');

  // Edit modal state
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editCategory, setEditCategory] = useState('');

  // Receipt upload state
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  const fetchExpenses = useCallback(async () => {
    try {
      const res = await expensesApi.getAll({
        month,
        year,
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        search: search || undefined,
      });
      setExpenses(res.data);
    } catch {
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  }, [month, year, selectedCategory, search]);

  useEffect(() => {
    const timer = setTimeout(fetchExpenses, 300);
    return () => clearTimeout(timer);
  }, [fetchExpenses]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description) return;

    setSubmitting(true);
    try {
      const res = await expensesApi.create({
        amount: parseFloat(amount),
        description,
        date,
        category: manualCategory || undefined,
      });
      setExpenses(prev => [res.data, ...prev]);
      toast.success(`Added! AI categorized as: ${res.data.category}`);
      setAmount('');
      setDescription('');
      setManualCategory('');
      setDate(now.toISOString().split('T')[0]);
      setShowForm(false);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to add expense');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this expense?')) return;
    try {
      await expensesApi.delete(id);
      setExpenses(prev => prev.filter(e => e.id !== id));
      toast.success('Deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleEditOpen = (expense: Expense) => {
    setEditingExpense(expense);
    setEditAmount(expense.amount.toString());
    setEditDescription(expense.description);
    setEditDate(expense.date);
    setEditCategory(expense.category);
  };

  const handleEditSave = async () => {
    if (!editingExpense) return;

    try {
      const res = await expensesApi.update(editingExpense.id, {
        amount: parseFloat(editAmount),
        description: editDescription,
        date: editDate,
        category: editCategory,
      });
      setExpenses(prev => prev.map(e => e.id === editingExpense.id ? res.data : e));
      toast.success('Updated!');
      setEditingExpense(null);
    } catch {
      toast.error('Failed to update');
    }
  };

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image too large (max 10MB)');
      return;
    }

    setUploadingReceipt(true);
    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        
        try {
          const res = await receiptApi.extract(base64);
          setAmount(res.data.amount.toString());
          setDescription(res.data.description);
          setShowForm(true);
          toast.success('Receipt scanned! Review and save.');
        } catch {
          toast.error('Failed to extract receipt data');
        } finally {
          setUploadingReceipt(false);
        }
      };
      reader.readAsDataURL(file);
    } catch {
      toast.error('Failed to process image');
      setUploadingReceipt(false);
    }
  };

  const exportToCSV = () => {
    if (expenses.length === 0) {
      toast.error('No expenses to export');
      return;
    }

    const headers = ['Date', 'Description', 'Category', 'Amount'];
    const rows = expenses.map(e => [
      e.date,
      `"${e.description.replace(/"/g, '""')}"`, // Escape quotes
      e.category,
      e.amount.toString()
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expenses_${MONTHS[month-1]}_${year}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Exported to CSV!');
  };

  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
          <p className="text-gray-500">{MONTHS[month - 1]} {year}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <span className="text-lg leading-none">+</span>
            Add Expense
          </button>
        </div>
      </div>

      {/* Add Expense Form */}
      {showForm && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-indigo-100">
          <h2 className="text-base font-semibold text-gray-900 mb-4">New Expense</h2>

          {/* Receipt Upload */}
          <div className="mb-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-indigo-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Scan Receipt with AI</p>
                <p className="text-xs text-gray-500">Upload a photo and AI will extract the amount</p>
              </div>
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleReceiptUpload}
                  disabled={uploadingReceipt}
                  className="hidden"
                />
                <div className="px-4 py-2 bg-white border border-indigo-200 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-50 transition-colors">
                  {uploadingReceipt ? 'Scanning...' : 'Upload'}
                </div>
              </label>
            </div>
          </div>

          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <input
                  type="text"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  required
                  placeholder="e.g. Starbucks coffee"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($) *</label>
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  required
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category <span className="text-gray-400 font-normal">(or let AI decide)</span>
                </label>
                <select
                  value={manualCategory}
                  onChange={e => setManualCategory(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                >
                  <option value="">✨ Auto-categorize with AI</option>
                  {CATEGORIES.filter(c => c !== 'All').map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {submitting ? '✨ AI is categorizing...' : 'Add Expense'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search expenses..."
          className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
        />
        <select
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
        >
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Summary */}
      {expenses.length > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-xl">
          <span>{expenses.length} expense{expenses.length !== 1 ? 's' : ''}</span>
          <span className="font-semibold text-gray-900">Total: ${total.toFixed(2)}</span>
        </div>
      )}

      {/* Expenses List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        </div>
      ) : expenses.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">💸</div>
          <p className="font-medium">No expenses found</p>
          <p className="text-sm mt-1">Add your first expense above</p>
        </div>
      ) : (
        <div className="space-y-2">
          {expenses.map(expense => (
            <div
              key={expense.id}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-4 hover:border-indigo-100 transition-colors"
            >
              {/* Category color dot */}
              <div
                className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: CATEGORY_COLORS[expense.category] || '#94a3b8' }}
              >
                {expense.category[0]}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{expense.description}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-gray-400">{new Date(expense.date).toLocaleDateString()}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: CATEGORY_COLORS[expense.category] || '#94a3b8' }}>
                    {expense.category}
                  </span>
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <p className="font-bold text-gray-900">${Number(expense.amount).toFixed(2)}</p>
              </div>

              <button
                onClick={() => handleEditOpen(expense)}
                className="p-2 text-gray-300 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors flex-shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>

              <button
                onClick={() => handleDelete(expense.id)}
                className="p-2 text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editingExpense && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setEditingExpense(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Edit Expense</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={editDescription}
                  onChange={e => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($)</label>
                <input
                  type="number"
                  value={editAmount}
                  onChange={e => setEditAmount(e.target.value)}
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={editDate}
                  onChange={e => setEditDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={editCategory}
                  onChange={e => setEditCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                >
                  {CATEGORIES.filter(c => c !== 'All').map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleEditSave}
                  className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setEditingExpense(null)}
                  className="px-6 py-2.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};