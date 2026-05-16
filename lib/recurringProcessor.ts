import { supabase } from './supabase';
import type { RecurringFrequency } from '../types';

/** Advance a date by one frequency period. */
function advanceDate(dateStr: string, frequency: RecurringFrequency): string {
  const d = new Date(dateStr);
  switch (frequency) {
    case 'daily':   d.setDate(d.getDate() + 1); break;
    case 'weekly':  d.setDate(d.getDate() + 7); break;
    case 'monthly': d.setMonth(d.getMonth() + 1); break;
    case 'yearly':  d.setFullYear(d.getFullYear() + 1); break;
  }
  return d.toISOString().slice(0, 10);
}

/**
 * Process all active recurring rules for a user:
 * - For each rule where next_due_date <= today, insert a transaction
 *   and advance next_due_date until it is in the future.
 * - Caps at 90 iterations per rule to prevent runaway loops.
 *
 * Returns the count of transactions created.
 */
export async function processRecurringTransactions(userId: string): Promise<number> {
  const today = new Date().toISOString().slice(0, 10);

  const { data: rules, error } = await supabase
    .from('recurring_transactions')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .lte('next_due_date', today);

  if (error || !rules || rules.length === 0) return 0;

  let created = 0;

  for (const rule of rules) {
    let nextDue: string = rule.next_due_date;
    let iterations = 0;

    while (nextDue <= today && iterations < 90) {
      await supabase.from('transactions').insert({
        user_id: userId,
        account_id: rule.account_id ?? null,
        category_id: rule.category_id ?? null,
        amount: rule.amount,
        type: rule.type,
        description: rule.description ?? null,
        date: nextDue,
      });

      nextDue = advanceDate(nextDue, rule.frequency as RecurringFrequency);
      iterations += 1;
      created += 1;
    }

    await supabase
      .from('recurring_transactions')
      .update({ next_due_date: nextDue, last_run_date: today })
      .eq('id', rule.id);
  }

  return created;
}
