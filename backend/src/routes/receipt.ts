import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import OpenAI from 'openai';

const router = Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

router.use(authenticate);

// POST /api/receipt/extract - Extract expense data from receipt image
router.post('/extract', async (req: AuthRequest, res: Response) => {
  const { image } = req.body; // base64 image

  if (!image) {
    return res.status(400).json({ error: 'Image is required' });
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Extract the following from this receipt:
1. Total amount (just the number, e.g., "45.67")
2. Merchant/vendor name
3. Brief description of items purchased

Return ONLY a JSON object with these keys: amount, merchant, description.
Example: {"amount": "45.67", "merchant": "Starbucks", "description": "Coffee and pastry"}`,
            },
            {
              type: 'image_url',
              image_url: { url: image },
            },
          ],
        },
      ],
      max_tokens: 300,
    });

    const content = response.choices[0]?.message?.content || '{}';
    const data = JSON.parse(content.replace(/```json|```/g, '').trim());

    res.json({
      amount: parseFloat(data.amount) || 0,
      description: `${data.merchant || 'Purchase'} - ${data.description || ''}`.trim(),
    });
  } catch (error) {
    console.error('Receipt extraction error:', error);
    res.status(500).json({ error: 'Failed to extract receipt data' });
  }
});

export default router;