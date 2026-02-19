import { Router, Response } from 'express';
import { pool } from '../services/database';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// GET /api/budget - Get user's budget
router.get('/', async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  try {
    const result = await pool.query(
      'SELECT monthly_budget FROM users WHERE id = $1',
      [userId]
    );
    res.json({ monthlyBudget: result.rows[0]?.monthly_budget || 0 });
  } catch (error) {
    console.error('Get budget error:', error);
    res.status(500).json({ error: 'Failed to fetch budget' });
  }
});

// PUT /api/budget - Update user's budget
router.put('/', async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { monthlyBudget } = req.body;

  if (monthlyBudget === undefined || monthlyBudget < 0) {
    return res.status(400).json({ error: 'Invalid budget amount' });
  }

  try {
    await pool.query(
      'UPDATE users SET monthly_budget = $1 WHERE id = $2',
      [monthlyBudget, userId]
    );
    res.json({ monthlyBudget });
  } catch (error) {
    console.error('Update budget error:', error);
    res.status(500).json({ error: 'Failed to update budget' });
  }
});

export default router;