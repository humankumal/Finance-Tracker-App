import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase';
import type { Transaction } from '../../types';

async function fetchTransactions(userId: string, month?: string): Promise<Transaction[]> {
  let query = supabase
    .from('transactions')
    .select('*, category:categories(*), account:accounts(*)')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (month) {
    const start = `${month}-01`;
    const end = `${month}-31`;
    query = query.gte('date', start).lte('date', end);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export function useTransactions(userId: string, month?: string) {
  return useQuery({
    queryKey: ['transactions', userId, month],
    queryFn: () => fetchTransactions(userId, month),
    enabled: !!userId,
  });
}

export function useAddTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (tx: Omit<Transaction, 'id' | 'created_at'>) => {
      const { data, error } = await supabase.from('transactions').insert(tx).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['transactions'] }),
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['transactions'] }),
  });
}
