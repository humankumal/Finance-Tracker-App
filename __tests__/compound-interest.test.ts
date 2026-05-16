import { calculateCompoundInterest, monthsToGoal, requiredMonthlyContrib } from '../lib/math/compound-interest';

describe('calculateCompoundInterest', () => {
  it('returns principal when rate and contribution are 0', () => {
    const { futureValue } = calculateCompoundInterest(1000, 0, 1, 0);
    expect(futureValue).toBeCloseTo(1000, 0);
  });

  it('calculates correctly without contributions', () => {
    // $1000 at 5% annual, 1 year, monthly compounding
    // A = 1000 * (1 + 0.05/12)^12 ≈ 1051.16
    const { futureValue } = calculateCompoundInterest(1000, 0.05, 1, 0, 12);
    expect(futureValue).toBeCloseTo(1051.16, 0);
  });

  it('includes compound effect of contributions', () => {
    // Should grow more than principal + contributions alone
    const { futureValue, interestEarned } = calculateCompoundInterest(0, 0.05, 5, 200, 12);
    expect(futureValue).toBeGreaterThan(200 * 12 * 5); // > $12,000 contributions alone
    expect(interestEarned).toBeGreaterThan(0);
  });

  it('returns yearly projection array', () => {
    const { yearlyProjection } = calculateCompoundInterest(1000, 0.05, 3, 0);
    expect(yearlyProjection).toHaveLength(3);
    expect(yearlyProjection[0].year).toBe(1);
    expect(yearlyProjection[2].year).toBe(3);
  });
});

describe('monthsToGoal', () => {
  it('returns infinity when no contribution and no rate', () => {
    expect(monthsToGoal(10000, 1000, 0, 0)).toBe(Infinity);
  });

  it('returns months to reach target', () => {
    // $0 start, $1000/mo, 0% rate, target $3000 → 3 months
    const months = monthsToGoal(3000, 0, 1000, 0);
    expect(months).toBe(3);
  });

  it('reaches goal faster with interest', () => {
    const withoutInterest = monthsToGoal(10000, 0, 300, 0);
    const withInterest = monthsToGoal(10000, 0, 300, 0.05);
    expect(withInterest).toBeLessThan(withoutInterest);
  });
});

describe('requiredMonthlyContrib', () => {
  it('returns correct contribution at 0% rate', () => {
    // Need $12000 in 12 months from $0 → $1000/mo
    const contrib = requiredMonthlyContrib(12000, 0, 12, 0);
    expect(contrib).toBeCloseTo(1000, 0);
  });

  it('requires less with higher interest rate', () => {
    const lowRate = requiredMonthlyContrib(50000, 0, 60, 0.01);
    const highRate = requiredMonthlyContrib(50000, 0, 60, 0.08);
    expect(highRate).toBeLessThan(lowRate);
  });
});
