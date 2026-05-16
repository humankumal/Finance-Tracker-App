import { calculateBudgetSummaries, totalVariance, historicalZScore } from '../lib/math/budget-variance';
import type { Category, Transaction } from '../types';

const makeCategory = (id: string, budget: number): Category => ({
  id,
  user_id: 'u1',
  name: `Cat-${id}`,
  color: '#fff',
  bucket: 'needs',
  budget_amount: budget,
  created_at: '',
});

const makeTx = (catId: string, amount: number): Transaction => ({
  id: Math.random().toString(),
  user_id: 'u1',
  amount,
  type: 'expense',
  date: '2024-01-10',
  created_at: '',
  category_id: catId,
});

describe('calculateBudgetSummaries', () => {
  it('calculates variance correctly', () => {
    const cats = [makeCategory('c1', 500)];
    const txs = [makeTx('c1', 600)]; // $100 over budget
    const [summary] = calculateBudgetSummaries(cats, txs, 15, 31);

    expect(summary.spent).toBe(600);
    expect(summary.budgeted).toBe(500);
    expect(summary.variance).toBe(100);
    expect(summary.variancePct).toBeCloseTo(20, 1);
  });

  it('projects month-end burn rate', () => {
    const cats = [makeCategory('c1', 1000)];
    const txs = [makeTx('c1', 300)]; // $300 in 10 days
    const [summary] = calculateBudgetSummaries(cats, txs, 10, 30);

    // $300/10 days * 30 days = $900
    expect(summary.projectedMonthEnd).toBeCloseTo(900, 0);
  });

  it('returns 0 spent for categories with no transactions', () => {
    const cats = [makeCategory('c1', 500), makeCategory('c2', 300)];
    const txs = [makeTx('c1', 100)];
    const summaries = calculateBudgetSummaries(cats, txs, 10, 30);
    const c2 = summaries.find((s) => s.category.id === 'c2')!;
    expect(c2.spent).toBe(0);
  });
});

describe('totalVariance', () => {
  it('sums across categories', () => {
    const cats = [makeCategory('c1', 500), makeCategory('c2', 300)];
    const txs = [makeTx('c1', 600), makeTx('c2', 200)];
    const summaries = calculateBudgetSummaries(cats, txs, 20, 30);
    const totals = totalVariance(summaries);

    expect(totals.totalSpent).toBe(800);
    expect(totals.totalBudgeted).toBe(800);
    expect(totals.variance).toBe(0);
  });
});

describe('historicalZScore', () => {
  it('returns 0 for insufficient history', () => {
    expect(historicalZScore(100, [100])).toBe(0);
  });

  it('detects unusually high month', () => {
    const history = [100, 110, 95, 105, 100];
    const score = historicalZScore(500, history); // 500 is way above average
    expect(score).toBeGreaterThan(2);
  });
});
