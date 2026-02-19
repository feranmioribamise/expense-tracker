import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Bills & Utilities',
  'Healthcare',
  'Travel',
  'Education',
  'Other',
];

export const categorizeExpense = async (description: string): Promise<string> => {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expense categorizer. Given an expense description, return ONLY the most appropriate category from this list: ${CATEGORIES.join(', ')}. Return nothing else - just the category name exactly as written.`,
        },
        {
          role: 'user',
          content: `Categorize this expense: "${description}"`,
        },
      ],
      max_tokens: 20,
      temperature: 0,
    });

    const category = response.choices[0]?.message?.content?.trim() || 'Other';

    // Validate it's a known category
    return CATEGORIES.includes(category) ? category : 'Other';
  } catch (error) {
    console.error('AI categorization failed:', error);
    return 'Other'; // Fallback to Other if AI fails
  }
};
