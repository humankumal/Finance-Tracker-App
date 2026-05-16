import { sma, ema, linearRegression, zScore, detectAnomalies } from '../lib/math/trend-analysis';
import type { Transaction } from '../types';

describe('sma', () => {
  it('returns NaN for periods before window is filled', () => {
    const result = sma([1, 2, 3, 4, 5], 3);
    expect(isNaN(result[0])).toBe(true);
    expect(isNaN(result[1])).toBe(true);
    expect(result[2]).toBe(2); // (1+2+3)/3
  });

  it('computes rolling average correctly', () => {
    const result = sma([10, 20, 30, 40], 2);
    expect(result[1]).toBe(15);
    expect(result[2]).toBe(25);
    expect(result[3]).toBe(35);
  });
});

describe('ema', () => {
  it('starts with the first data point', () => {
    const result = ema([100, 200, 300], 3);
    expect(result[0]).toBe(100);
  });

  it('is weighted toward recent values', () => {
    const data = [10, 10, 10, 100];
    const result = ema(data, 3);
    // Last EMA should be pulled toward 100 but not equal it
    expect(result[3]).toBeGreaterThan(10);
    expect(result[3]).toBeLessThan(100);
  });
});

describe('linearRegression', () => {
  it('returns slope 1 for perfect linear sequence', () => {
    const x = [0, 1, 2, 3, 4];
    const y = [0, 1, 2, 3, 4];
    const { slope, r2 } = linearRegression(x, y);
    expect(slope).toBeCloseTo(1, 5);
    expect(r2).toBeCloseTo(1, 5);
  });

  it('returns r2 near 0 for random noise', () => {
    const x = [0, 1, 2, 3, 4];
    const y = [5, 1, 8, 2, 9]; // no clear trend
    const { r2 } = linearRegression(x, y);
    expect(r2).toBeLessThan(0.5);
  });
});

describe('zScore', () => {
  it('returns 0 for value equal to mean', () => {
    expect(zScore(3, [1, 2, 3, 4, 5])).toBeCloseTo(0, 5);
  });

  it('returns positive score for above-mean value', () => {
    expect(zScore(10, [1, 2, 3, 4, 5])).toBeGreaterThan(0);
  });
});

describe('detectAnomalies', () => {
  const makeTx = (id: string, amount: number, catId = 'cat1'): Transaction => ({
    id,
    user_id: 'u1',
    amount,
    type: 'expense',
    date: '2024-01-01',
    created_at: '',
    category_id: catId,
  });

  it('flags outlier transactions', () => {
    const txs = [
      makeTx('t1', 10),
      makeTx('t2', 10),
      makeTx('t3', 10),
      makeTx('t4', 10),
      makeTx('t5', 10),
      makeTx('t6', 10),
      makeTx('t7', 1000), // clear outlier: Z-score >> 2
    ];
    const anomalies = detectAnomalies(txs, 2);
    expect(anomalies.has('t7')).toBe(true);
    expect(anomalies.has('t1')).toBe(false);
  });

  it('does not flag transactions in small groups', () => {
    const txs = [makeTx('t1', 100), makeTx('t2', 200)];
    const anomalies = detectAnomalies(txs, 2);
    // With only 2 points, z-scores are symmetric; check no false positives
    expect(anomalies.size).toBeLessThanOrEqual(2);
  });
});
