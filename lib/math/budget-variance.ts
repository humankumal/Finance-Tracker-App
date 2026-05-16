import type { BudgetSummary, Category, Transaction } from '../../types';

/**
 * Calculate budget variance metrics for each category.
 *
 * @param categories    All user categories with budget_amount set
 * @param transactions  Transactions for the current month
 * @param daysElapsed   Days elapsed so far in the month
 * @param daysInMonth   Total days in the month
 */
export function calculateBudgetSummaries(
  categories: Category[],
  transactions: Transaction[],
  daysElapsed: number,
  daysInMonth: number,
): BudgetSummary[] {
  const spentByCategory = new Map<string, number>();

  for (const tx of transactions) {
    if (tx.type !== 'expense' || !tx.category_id) continue;
    spentByCategory.set(
      tx.category_id,
      (spentByCategory.get(tx.category_id) ?? 0) + tx.amount,
    );
  }

  return categories
    .filter((c) => c.bucket !== 'income')
    .map((category) => {
      const spent = spentByCategory.get(category.id) ?? 0;
      const budgeted = category.budget_amount;
      const variance = spent - budgeted;
      const variancePct = budgeted === 0 ? 0 : (variance / budgeted) * 100;
      const burnRate = daysElapsed === 0 ? 0 : spent / daysElapsed;
      const projectedMonthEnd = burnRate * daysInMonth;

      return { category, spent, budgeted, variance, variancePct, burnRate, projectedMonthEnd };
    });
}

/** Returns overall month variance: total spent vs total budgeted. */
export function totalVariance(summaries: BudgetSummary[]): {
  totalSpent: number;
  totalBudgeted: number;
  variance: number;
  variancePct: number;
} {
  const totalSpent = summaries.reduce((s, b) => s + b.spent, 0);
  const totalBudgeted = summaries.reduce((s, b) => s + b.budgeted, 0);
  const variance = totalSpent - totalBudgeted;
  const variancePct = totalBudgeted === 0 ? 0 : (variance / totalBudgeted) * 100;
  return { totalSpent, totalBudgeted, variance, variancePct };
}

/**
 * Historical Z-score: how unusual is this month's spending in a category
 * compared to past months? Returns a signed Z-score.
 */
export function historicalZScore(
  currentMonthSpend: number,
  historicalAmounts: number[],
): number {
  if (historicalAmounts.length < 2) return 0;
  const mean = historicalAmounts.reduce((s, v) => s + v, 0) / historicalAmounts.length;
  const variance =
    historicalAmounts.reduce((s, v) => s + (v - mean) ** 2, 0) / historicalAmounts.length;
  const stdDev = Math.sqrt(variance);
  return stdDev === 0 ? 0 : (currentMonthSpend - mean) / stdDev;
}
