import { calculate503020, sumByBucket } from '../lib/math/fifty-thirty-twenty';
import type { Category, Transaction } from '../types';

const makeCategory = (id: string, bucket: Category['bucket']): Category => ({
  id,
  user_id: 'u1',
  name: id,
  color: '#fff',
  bucket,
  budget_amount: 0,
  created_at: '',
});

const makeTx = (id: string, amount: number, catId: string, type: Transaction['type'] = 'expense'): Transaction => ({
  id,
  user_id: 'u1',
  amount,
  type,
  date: '2024-01-10',
  created_at: '',
  category_id: catId,
});

describe('sumByBucket', () => {
  it('sums correctly by bucket', () => {
    const cats = [makeCategory('rent', 'needs'), makeCategory('dining', 'wants')];
    const txs = [makeTx('t1', 1000, 'rent'), makeTx('t2', 300, 'dining'), makeTx('t3', 2000, 'income-cat', 'income')];
    // income tx has no category → defaults to income bucket
    const result = sumByBucket(txs, cats);
    expect(result.needs).toBe(1000);
    expect(result.wants).toBe(300);
    expect(result.income).toBe(2000);
  });
});

describe('calculate503020', () => {
  it('returns score 0 and label when no income', () => {
    const health = calculate503020({ needs: 0, wants: 0, savings: 0, income: 0 });
    expect(health.score).toBe(0);
    expect(health.recommendations.length).toBeGreaterThan(0);
  });

  it('returns high score for ideal allocation', () => {
    const health = calculate503020({
      needs: 5000,
      wants: 3000,
      savings: 2000,
      income: 10000,
    });
    expect(health.score).toBeGreaterThanOrEqual(85);
    expect(health.label).toBe('Excellent');
  });

  it('penalizes overspending on wants', () => {
    const perfect = calculate503020({ needs: 5000, wants: 3000, savings: 2000, income: 10000 });
    const overspent = calculate503020({ needs: 5000, wants: 6000, savings: 0, income: 10000 });
    expect(overspent.score).toBeLessThan(perfect.score);
  });

  it('includes recommendations for under-savings', () => {
    const health = calculate503020({ needs: 5000, wants: 5000, savings: 0, income: 10000 });
    const hasSavingsRec = health.recommendations.some((r) => r.toLowerCase().includes('savings'));
    expect(hasSavingsRec).toBe(true);
  });
});
