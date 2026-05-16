import type { FinancialHealth, Transaction, Category } from '../../types';

const IDEAL = { needs: 0.5, wants: 0.3, savings: 0.2 } as const;

export interface BucketBreakdown {
  needs: number;
  wants: number;
  savings: number;
  income: number;
}

/**
 * Sum transaction amounts by 50/30/20 bucket for a given month's transactions.
 */
export function sumByBucket(
  transactions: Transaction[],
  categories: Category[],
): BucketBreakdown {
  const catMap = new Map(categories.map((c) => [c.id, c]));
  const result: BucketBreakdown = { needs: 0, wants: 0, savings: 0, income: 0 };

  for (const tx of transactions) {
    const cat = tx.category_id ? catMap.get(tx.category_id) : undefined;
    const bucket = cat?.bucket ?? (tx.type === 'income' ? 'income' : 'wants');
    result[bucket] += tx.amount;
  }

  return result;
}

/**
 * Score 0–100 based on how closely spending matches the 50/30/20 rule.
 * 100 = perfect, 0 = severely off in all buckets.
 *
 * Uses a weighted penalty for deviation from ideal ratios.
 */
export function calculate503020(
  breakdown: BucketBreakdown,
): FinancialHealth {
  const income = breakdown.income;

  if (income === 0) {
    return {
      score: 0,
      label: 'No income recorded',
      bucketScores: { needs: 0, wants: 0, savings: 0 },
      recommendations: ['Add your monthly income to get a financial health score.'],
    };
  }

  const actualRatios = {
    needs: breakdown.needs / income,
    wants: breakdown.wants / income,
    savings: breakdown.savings / income,
  };

  // Deviations from ideal, capped at 1 (100%)
  const deviations = {
    needs: Math.min(Math.abs(actualRatios.needs - IDEAL.needs), 1),
    wants: Math.min(Math.abs(actualRatios.wants - IDEAL.wants), 1),
    savings: Math.min(Math.abs(actualRatios.savings - IDEAL.savings), 1),
  };

  // Individual bucket scores (100 = ideal, 0 = worst)
  const bucketScores = {
    needs: Math.round((1 - deviations.needs) * 100),
    wants: Math.round((1 - deviations.wants) * 100),
    savings: Math.round((1 - deviations.savings) * 100),
  };

  // Weighted composite: savings matters most (40%), needs (35%), wants (25%)
  const score = Math.round(
    bucketScores.needs * 0.35 +
    bucketScores.wants * 0.25 +
    bucketScores.savings * 0.4,
  );

  const recommendations: string[] = [];

  if (actualRatios.needs > IDEAL.needs) {
    recommendations.push(
      `Needs are ${Math.round(actualRatios.needs * 100)}% of income — target ≤50%. Review fixed costs.`,
    );
  }
  if (actualRatios.wants > IDEAL.wants) {
    recommendations.push(
      `Wants are ${Math.round(actualRatios.wants * 100)}% of income — target ≤30%. Trim discretionary spending.`,
    );
  }
  if (actualRatios.savings < IDEAL.savings) {
    recommendations.push(
      `Savings are ${Math.round(actualRatios.savings * 100)}% of income — target ≥20%. Increase contributions.`,
    );
  }
  if (recommendations.length === 0) {
    recommendations.push('Great work! Your spending aligns with the 50/30/20 rule.');
  }

  const label =
    score >= 85 ? 'Excellent' :
    score >= 70 ? 'Good' :
    score >= 50 ? 'Fair' :
    'Needs Attention';

  return { score, label, bucketScores, recommendations };
}
