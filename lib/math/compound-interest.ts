import type { CompoundResult } from '../../types';

/**
 * A = P(1 + r/n)^(nt) + PMT × [((1 + r/n)^(nt) − 1) / (r/n)]
 *
 * @param principal     Initial principal (P)
 * @param annualRate    Annual interest rate as decimal (e.g. 0.05 for 5%)
 * @param years         Number of years
 * @param monthlyContrib Monthly contribution (PMT), default 0
 * @param compoundsPerYear Times compounded per year, default 12 (monthly)
 */
export function calculateCompoundInterest(
  principal: number,
  annualRate: number,
  years: number,
  monthlyContrib = 0,
  compoundsPerYear = 12,
): CompoundResult {
  const n = compoundsPerYear;
  const r = annualRate;
  const t = years;
  const PMT = monthlyContrib;

  const yearlyProjection: { year: number; value: number }[] = [];
  let futureValue = 0;

  for (let yr = 1; yr <= Math.ceil(t); yr += 1) {
    const yrs = Math.min(yr, t);
    const base = principal * Math.pow(1 + r / n, n * yrs);
    const contrib =
      r === 0
        ? PMT * n * yrs
        : PMT * ((Math.pow(1 + r / n, n * yrs) - 1) / (r / n));
    futureValue = base + contrib;
    yearlyProjection.push({ year: yr, value: futureValue });
  }

  const interestEarned = futureValue - principal - PMT * 12 * t;

  return { futureValue, interestEarned, yearlyProjection };
}

/**
 * Returns months needed to reach a target amount given a monthly contribution
 * and interest rate.
 */
export function monthsToGoal(
  target: number,
  principal: number,
  monthlyContrib: number,
  annualRate: number,
): number {
  if (monthlyContrib <= 0 && annualRate <= 0) return Infinity;

  const r = annualRate / 12;
  let balance = principal;
  let months = 0;

  while (balance < target && months < 1200) {
    balance = r > 0 ? balance * (1 + r) + monthlyContrib : balance + monthlyContrib;
    months += 1;
  }

  return balance >= target ? months : Infinity;
}

/**
 * Returns the monthly contribution required to reach target in exactly `months`.
 */
export function requiredMonthlyContrib(
  target: number,
  principal: number,
  months: number,
  annualRate: number,
): number {
  const r = annualRate / 12;
  if (r === 0) return (target - principal) / months;

  const factor = (Math.pow(1 + r, months) - 1) / r;
  return (target - principal * Math.pow(1 + r, months)) / factor;
}
