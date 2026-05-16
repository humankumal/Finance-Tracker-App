import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase';
import type { RecurringTransaction, RecurringFrequency, TransactionType } from '../../types';

async function fetchRecurring(userId: string): Promise<RecurringTransaction[]> {
  const { data, error } = await supabase
    .from('recurring_transactions')
    .select('*, category:categories(*), account:accounts(*)')
    .eq('user_id', userId)
    .order('next_due_date');
  if (error) throw error;
  return data ?? [];
}

export function useRecurring(userId: string) {
  return useQuery({
    queryKey: ['recurring', userId],
    queryFn: () => fetchRecurring(userId),
    enabled: !!userId,
  });
}

export function useAddRecurring() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rule: {
      user_id: string;
      amount: number;
      type: TransactionType;
      description?: string;
      frequency: RecurringFrequency;
      next_due_date: string;
      category_id?: string;
      account_id?: string;
    }) => {
      const { data, error } = await supabase
        .from('recurring_transactions')
        .insert(rule)
        .select('*, category:categories(*), account:accounts(*)')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recurring'] }),
  });
}

export function useToggleRecurring() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('recurring_transactions')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recurring'] }),
  });
}

export function useDeleteRecurring() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('recurring_transactions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recurring'] });
    },
  });
}
