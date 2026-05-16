import type { TrendPoint } from '../../types';
import type { Transaction } from '../../types';

/** Simple Moving Average over a rolling window. */
export function sma(data: number[], window: number): number[] {
  return data.map((_, i) => {
    if (i < window - 1) return NaN;
    const slice = data.slice(i - window + 1, i + 1);
    return slice.reduce((s, v) => s + v, 0) / window;
  });
}

/** Exponential Moving Average. α = 2/(N+1). */
export function ema(data: number[], period: number): number[] {
  const alpha = 2 / (period + 1);
  const result: number[] = [];
  data.forEach((val, i) => {
    if (i === 0) {
      result.push(val);
    } else {
      result.push(alpha * val + (1 - alpha) * result[i - 1]);
    }
  });
  return result;
}

/** Linear regression. Returns slope, intercept, and R² coefficient. */
export function linearRegression(
  x: number[],
  y: number[],
): { slope: number; intercept: number; r2: number } {
  const n = x.length;
  if (n < 2) return { slope: 0, intercept: y[0] ?? 0, r2: 0 };

  const meanX = x.reduce((s, v) => s + v, 0) / n;
  const meanY = y.reduce((s, v) => s + v, 0) / n;

  let ssXY = 0;
  let ssXX = 0;
  let ssTot = 0;

  for (let i = 0; i < n; i++) {
    ssXY += (x[i] - meanX) * (y[i] - meanY);
    ssXX += (x[i] - meanX) ** 2;
    ssTot += (y[i] - meanY) ** 2;
  }

  const slope = ssXX === 0 ? 0 : ssXY / ssXX;
  const intercept = meanY - slope * meanX;

  const ssRes = y.reduce((s, yi, i) => s + (yi - (slope * x[i] + intercept)) ** 2, 0);
  const r2 = ssTot === 0 ? 1 : 1 - ssRes / ssTot;

  return { slope, intercept, r2 };
}

/** Z-score: how many standard deviations a value is from the dataset mean. */
export function zScore(value: number, data: number[]): number {
  if (data.length < 2) return 0;
  const mean = data.reduce((s, v) => s + v, 0) / data.length;
  const variance = data.reduce((s, v) => s + (v - mean) ** 2, 0) / data.length;
  const stdDev = Math.sqrt(variance);
  return stdDev === 0 ? 0 : (value - mean) / stdDev;
}

/**
 * Detect anomalous transactions by Z-score within their category.
 * Returns a Set of transaction IDs that exceed the threshold.
 */
export function detectAnomalies(
  transactions: Transaction[],
  threshold = 2,
): Set<string> {
  const byCategory = new Map<string, Transaction[]>();

  for (const tx of transactions) {
    const key = tx.category_id ?? '__none__';
    if (!byCategory.has(key)) byCategory.set(key, []);
    byCategory.get(key)!.push(tx);
  }

  const anomalies = new Set<string>();

  for (const [, group] of byCategory) {
    const amounts = group.map((t) => t.amount);
    for (const tx of group) {
      if (Math.abs(zScore(tx.amount, amounts)) >= threshold) {
        anomalies.add(tx.id);
      }
    }
  }

  return anomalies;
}

/**
 * Aggregate transactions by month (YYYY-MM) and return trend points
 * enriched with SMA and EMA.
 */
export function buildTrendPoints(
  transactions: Transaction[],
  smaPeriod = 3,
  emaPeriod = 3,
): TrendPoint[] {
  const monthly = new Map<string, number>();

  for (const tx of transactions) {
    if (tx.type !== 'expense') continue;
    const month = tx.date.slice(0, 7);
    monthly.set(month, (monthly.get(month) ?? 0) + tx.amount);
  }

  const sorted = [...monthly.entries()].sort(([a], [b]) => a.localeCompare(b));
  const amounts = sorted.map(([, v]) => v);
  const smaVals = sma(amounts, smaPeriod);
  const emaVals = ema(amounts, emaPeriod);

  return sorted.map(([date, amount], i) => ({
    date,
    amount,
    sma: isNaN(smaVals[i]) ? undefined : smaVals[i],
    ema: emaVals[i],
  }));
}
