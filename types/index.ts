export type AccountType = 'checking' | 'savings' | 'credit' | 'cash';
export type TransactionType = 'income' | 'expense';
export type BudgetBucket = 'needs' | 'wants' | 'savings' | 'income';
export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  created_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  icon?: string;
  color: string;
  bucket: BudgetBucket;
  budget_amount: number;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  account_id?: string;
  category_id?: string;
  amount: number;
  type: TransactionType;
  description?: string;
  date: string;
  created_at: string;
  category?: Category;
  account?: Account;
}

export interface RecurringTransaction {
  id: string;
  user_id: string;
  account_id?: string;
  category_id?: string;
  amount: number;
  type: TransactionType;
  description?: string;
  frequency: RecurringFrequency;
  next_due_date: string;
  last_run_date?: string;
  is_active: boolean;
  created_at: string;
  category?: Category;
  account?: Account;
}

export interface SavingsGoal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  monthly_contrib: number;
  interest_rate: number;
  target_date?: string;
  created_at: string;
}

export interface BudgetSummary {
  category: Category;
  spent: number;
  budgeted: number;
  variance: number;
  variancePct: number;
  burnRate: number;
  projectedMonthEnd: number;
}

export interface FinancialHealth {
  score: number;
  label: string;
  bucketScores: {
    needs: number;
    wants: number;
    savings: number;
  };
  recommendations: string[];
}

export interface TrendPoint {
  date: string;
  amount: number;
  sma?: number;
  ema?: number;
}

export interface CompoundResult {
  futureValue: number;
  interestEarned: number;
  monthsToGoal?: number;
  requiredMonthlyContrib?: number;
  yearlyProjection: { year: number; value: number }[];
}
