import { Router, Response } from 'express';
import { pool } from '../services/database';
import { authenticate, AuthRequest } from '../middleware/auth';
import { categorizeExpense } from '../services/aiService';

const router = Router();

// All expense routes require authentication
router.use(authenticate);

// GET /api/expenses - Get all expenses for user
router.get('/', async (req: AuthRequest, res: Response) => {
  const { month, year, category, search } = req.query;
  const userId = req.user!.id;

  try {
    let query = `
      SELECT id, amount, description, category, date, created_at
      FROM expenses
      WHERE user_id = $1
    `;
    const params: (string | number)[] = [userId];
    let paramIndex = 2;

    if (month && year) {
      query += ` AND EXTRACT(MONTH FROM date) = $${paramIndex} AND EXTRACT(YEAR FROM date) = $${paramIndex + 1}`;
      params.push(Number(month), Number(year));
      paramIndex += 2;
    }

    if (category && category !== 'All') {
      query += ` AND category = $${paramIndex}`;
      params.push(category as string);
      paramIndex++;
    }

    if (search) {
      query += ` AND description ILIKE $${paramIndex}`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += ' ORDER BY date DESC, created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// POST /api/expenses - Add new expense (AI categorizes it)
router.post('/', async (req: AuthRequest, res: Response) => {
  const { amount, description, date, category: manualCategory } = req.body;
  const userId = req.user!.id;

  if (!amount || !description) {
    return res.status(400).json({ error: 'Amount and description are required' });
  }

  if (isNaN(Number(amount)) || Number(amount) <= 0) {
    return res.status(400).json({ error: 'Amount must be a positive number' });
  }

  try {
    // Use manual category if provided, otherwise use AI
    const category = manualCategory || (await categorizeExpense(description));

    const result = await pool.query(
      `INSERT INTO expenses (user_id, amount, description, category, date)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, amount, description, category, date, created_at`,
      [userId, Number(amount), description.trim(), category, date || new Date().toISOString().split('T')[0]]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

// PUT /api/expenses/:id - Update expense
router.put('/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { amount, description, category, date } = req.body;
  const userId = req.user!.id;

  try {
    // Verify ownership
    const existing = await pool.query('SELECT id FROM expenses WHERE id = $1 AND user_id = $2', [id, userId]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    const result = await pool.query(
      `UPDATE expenses SET amount = $1, description = $2, category = $3, date = $4
       WHERE id = $5 AND user_id = $6
       RETURNING id, amount, description, category, date, created_at`,
      [amount, description, category, date, id, userId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({ error: 'Failed to update expense' });
  }
});

// DELETE /api/expenses/:id - Delete expense
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.id;

  try {
    const result = await pool.query(
      'DELETE FROM expenses WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

// GET /api/expenses/stats - Get spending stats for dashboard
router.get('/stats', async (req: AuthRequest, res: Response) => {
  const { month, year } = req.query;
  const userId = req.user!.id;
  const currentMonth = month || new Date().getMonth() + 1;
  const currentYear = year || new Date().getFullYear();

  try {
    // Total spent this month
    const totalResult = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM expenses
       WHERE user_id = $1
       AND EXTRACT(MONTH FROM date) = $2
       AND EXTRACT(YEAR FROM date) = $3`,
      [userId, currentMonth, currentYear]
    );

    // By category this month
    const categoryResult = await pool.query(
      `SELECT category, SUM(amount) as total, COUNT(*) as count
       FROM expenses
       WHERE user_id = $1
       AND EXTRACT(MONTH FROM date) = $2
       AND EXTRACT(YEAR FROM date) = $3
       GROUP BY category
       ORDER BY total DESC`,
      [userId, currentMonth, currentYear]
    );

    // Last 6 months trend
    const trendResult = await pool.query(
      `SELECT
         TO_CHAR(date, 'Mon YYYY') as month,
         EXTRACT(MONTH FROM date) as month_num,
         EXTRACT(YEAR FROM date) as year_num,
         SUM(amount) as total
       FROM expenses
       WHERE user_id = $1
       AND date >= NOW() - INTERVAL '6 months'
       GROUP BY TO_CHAR(date, 'Mon YYYY'), EXTRACT(MONTH FROM date), EXTRACT(YEAR FROM date)
       ORDER BY year_num, month_num`,
      [userId]
    );

    // Total expense count this month
    const countResult = await pool.query(
      `SELECT COUNT(*) as count
       FROM expenses
       WHERE user_id = $1
       AND EXTRACT(MONTH FROM date) = $2
       AND EXTRACT(YEAR FROM date) = $3`,
      [userId, currentMonth, currentYear]
    );

    res.json({
      totalSpent: parseFloat(totalResult.rows[0].total),
      expenseCount: parseInt(countResult.rows[0].count),
      byCategory: categoryResult.rows,
      monthlyTrend: trendResult.rows,
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;
