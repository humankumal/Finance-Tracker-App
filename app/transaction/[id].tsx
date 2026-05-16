import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../lib/store/authStore';
import { useTransactions, useDeleteTransaction } from '../../lib/hooks/useTransactions';
import { useCategories } from '../../lib/hooks/useCategories';
import { useAccounts } from '../../lib/hooks/useAccounts';
import { supabase } from '../../lib/supabase';
import type { TransactionType } from '../../types';
import { Colors, FontSize, Spacing, Radius } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const userId = user?.id ?? '';
  const qc = useQueryClient();

  const { data: transactions = [], isLoading } = useTransactions(userId);
  const { data: categories = [] } = useCategories(userId);
  const { data: accounts = [] } = useAccounts(userId);
  const deleteMutation = useDeleteTransaction();

  const transaction = transactions.find((t) => t.id === id);

  // Edit state
  const [editing, setEditing] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [accountId, setAccountId] = useState<string | undefined>();
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    if (transaction) {
      setAmount(String(transaction.amount));
      setDescription(transaction.description ?? '');
      setDate(transaction.date);
      setType(transaction.type);
      setCategoryId(transaction.category_id ?? undefined);
      setAccountId(transaction.account_id ?? undefined);
    }
  }, [transaction]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const parsed = parseFloat(amount);
      if (!parsed || parsed <= 0) throw new Error('Enter a valid amount.');
      const { error } = await supabase
        .from('transactions')
        .update({
          amount: parsed,
          description,
          date,
          type,
          category_id: categoryId ?? null,
          account_id: accountId ?? null,
        })
        .eq('id', id!);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] });
      setEditing(false);
      setSaveError('');
    },
    onError: (e: Error) => setSaveError(e.message),
  });

  function handleDelete() {
    Alert.alert('Delete Transaction', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteMutation.mutateAsync(id!);
          router.back();
        },
      },
    ]);
  }

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={Colors.accent} />
      </SafeAreaView>
    );
  }

  if (!transaction) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
        <Text style={{ color: Colors.muted, textAlign: 'center', marginTop: Spacing['2xl'] }}>
          Transaction not found.
        </Text>
      </SafeAreaView>
    );
  }

  const isIncome = editing ? type === 'income' : transaction.type === 'income';
  const catColor = transaction.category?.color ?? Colors.muted;

  const relevantCategories = categories.filter((c) =>
    type === 'income' ? c.bucket === 'income' : c.bucket !== 'income',
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: Spacing.md }}>

          {/* Nav */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg }}>
            <Pressable onPress={() => { setEditing(false); router.back(); }}>
              <Text style={{ color: Colors.accent, fontSize: FontSize.base }}>← Back</Text>
            </Pressable>
            <Pressable onPress={() => setEditing((e) => !e)}>
              <Text style={{ color: Colors.accent, fontSize: FontSize.base, fontWeight: '600' }}>
                {editing ? 'Cancel' : 'Edit'}
              </Text>
            </Pressable>
          </View>

          {/* ── VIEW MODE ─────────────────────────────────────── */}
          {!editing && (
            <>
              <Card style={{ marginBottom: Spacing.md, alignItems: 'center' }}>
                <Text style={{ fontSize: 48, marginBottom: Spacing.sm }}>
                  {transaction.category?.icon ?? (isIncome ? '💰' : '💸')}
                </Text>
                <Text style={{ color: isIncome ? Colors.success : Colors.danger, fontSize: FontSize['2xl'], fontWeight: '800', marginBottom: Spacing.xs }}>
                  {isIncome ? '+' : '-'}${transaction.amount.toFixed(2)}
                </Text>
                <Text style={{ color: Colors.white, fontSize: FontSize.md, marginBottom: Spacing.sm }}>
                  {transaction.description ?? 'No description'}
                </Text>
                {transaction.category && <Badge label={transaction.category.name} color={catColor} />}
              </Card>

              <Card style={{ marginBottom: Spacing.md }}>
                {([
                  ['Date', new Date(transaction.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })],
                  ['Type', transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)],
                  ['Account', transaction.account?.name ?? 'Not specified'],
                  ['Category', transaction.category?.name ?? 'Uncategorized'],
                  ['Bucket', transaction.category?.bucket ?? '—'],
                ] as [string, string][]).map(([label, value]) => (
                  <View key={label} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.xs, borderBottomWidth: 1, borderBottomColor: Colors.border }}>
                    <Text style={{ color: Colors.muted, fontSize: FontSize.sm }}>{label}</Text>
                    <Text style={{ color: Colors.white, fontSize: FontSize.sm, fontWeight: '500' }}>{value}</Text>
                  </View>
                ))}
              </Card>

              <Button label="Delete Transaction" onPress={handleDelete} variant="danger" fullWidth loading={deleteMutation.isPending} />
            </>
          )}

          {/* ── EDIT MODE ─────────────────────────────────────── */}
          {editing && (
            <>
              {/* Type toggle */}
              <View style={{ flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: 12, padding: 4, marginBottom: Spacing.md }}>
                {(['expense', 'income'] as TransactionType[]).map((t) => (
                  <Pressable
                    key={t}
                    onPress={() => setType(t)}
                    style={{
                      flex: 1,
                      paddingVertical: Spacing.sm,
                      borderRadius: 10,
                      alignItems: 'center',
                      backgroundColor: type === t ? (t === 'income' ? Colors.success : Colors.danger) : 'transparent',
                    }}
                  >
                    <Text style={{ color: Colors.white, fontWeight: '700', textTransform: 'capitalize' }}>{t}</Text>
                  </Pressable>
                ))}
              </View>

              <Input
                label="Amount ($)"
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                containerStyle={{ marginBottom: Spacing.sm }}
              />
              <Input
                label="Description"
                value={description}
                onChangeText={setDescription}
                containerStyle={{ marginBottom: Spacing.sm }}
              />
              <Input
                label="Date (YYYY-MM-DD)"
                value={date}
                onChangeText={setDate}
                containerStyle={{ marginBottom: Spacing.md }}
              />

              {/* Category chips */}
              <Text style={{ color: Colors.muted, fontSize: FontSize.sm, fontWeight: '500', marginBottom: Spacing.xs }}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.md }}>
                <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                  <Pressable
                    onPress={() => setCategoryId(undefined)}
                    style={{
                      paddingHorizontal: Spacing.sm,
                      paddingVertical: Spacing.xs,
                      borderRadius: 20,
                      borderWidth: 1,
                      borderColor: !categoryId ? Colors.accent : Colors.border,
                      backgroundColor: !categoryId ? Colors.accent + '33' : Colors.surface,
                    }}
                  >
                    <Text style={{ color: Colors.white, fontSize: FontSize.sm }}>None</Text>
                  </Pressable>
                  {relevantCategories.map((cat) => (
                    <Pressable
                      key={cat.id}
                      onPress={() => setCategoryId(cat.id === categoryId ? undefined : cat.id)}
                      style={{
                        paddingHorizontal: Spacing.sm,
                        paddingVertical: Spacing.xs,
                        borderRadius: 20,
                        borderWidth: 1,
                        borderColor: cat.id === categoryId ? cat.color : Colors.border,
                        backgroundColor: cat.id === categoryId ? cat.color + '33' : Colors.surface,
                      }}
                    >
                      <Text style={{ color: Colors.white, fontSize: FontSize.sm }}>
                        {cat.icon ?? '📁'} {cat.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>

              {/* Account chips */}
              {accounts.length > 0 && (
                <>
                  <Text style={{ color: Colors.muted, fontSize: FontSize.sm, fontWeight: '500', marginBottom: Spacing.xs }}>Account</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.md }}>
                    <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                      <Pressable
                        onPress={() => setAccountId(undefined)}
                        style={{
                          paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, borderRadius: 20, borderWidth: 1,
                          borderColor: !accountId ? Colors.accent : Colors.border,
                          backgroundColor: !accountId ? Colors.accent + '33' : Colors.surface,
                        }}
                      >
                        <Text style={{ color: Colors.white, fontSize: FontSize.sm }}>None</Text>
                      </Pressable>
                      {accounts.map((acc) => (
                        <Pressable
                          key={acc.id}
                          onPress={() => setAccountId(acc.id === accountId ? undefined : acc.id)}
                          style={{
                            paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, borderRadius: 20, borderWidth: 1,
                            borderColor: acc.id === accountId ? Colors.accent : Colors.border,
                            backgroundColor: acc.id === accountId ? Colors.accent + '33' : Colors.surface,
                          }}
                        >
                          <Text style={{ color: Colors.white, fontSize: FontSize.sm }}>{acc.name}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </ScrollView>
                </>
              )}

              {saveError ? (
                <Text style={{ color: Colors.danger, fontSize: FontSize.sm, marginBottom: Spacing.sm }}>{saveError}</Text>
              ) : null}

              <Button
                label="Save Changes"
                onPress={() => updateMutation.mutate()}
                loading={updateMutation.isPending}
                fullWidth
                style={{ marginBottom: Spacing.sm }}
              />
              <Button
                label="Delete Transaction"
                onPress={handleDelete}
                variant="danger"
                fullWidth
                loading={deleteMutation.isPending}
              />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
