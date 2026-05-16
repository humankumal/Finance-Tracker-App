import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthStore } from '../../lib/store/authStore';
import { useUIStore } from '../../lib/store/uiStore';
import { useTransactions, useDeleteTransaction } from '../../lib/hooks/useTransactions';
import { detectAnomalies } from '../../lib/math/trend-analysis';
import { Colors, FontSize, Spacing } from '../../constants/theme';
import { TransactionRow } from '../../components/finance/TransactionRow';
import { MonthSelector } from '../../components/ui/MonthSelector';
import type { Transaction } from '../../types';

function groupByDate(transactions: Transaction[]): { date: string; data: Transaction[] }[] {
  const map = new Map<string, Transaction[]>();
  for (const tx of transactions) {
    if (!map.has(tx.date)) map.set(tx.date, []);
    map.get(tx.date)!.push(tx);
  }
  return [...map.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, data]) => ({ date, data }));
}

function formatGroupDate(dateStr: string) {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function TransactionsScreen() {
  const { user } = useAuthStore();
  const { selectedMonth } = useUIStore();
  const userId = user?.id ?? '';
  const [search, setSearch] = useState('');

  const { data: transactions = [], isLoading } = useTransactions(userId, selectedMonth);
  const deleteMutation = useDeleteTransaction();

  const anomalyIds = useMemo(() => detectAnomalies(transactions), [transactions]);

  const filtered = useMemo(() => {
    if (!search.trim()) return transactions;
    const q = search.toLowerCase();
    return transactions.filter(
      (t) =>
        t.description?.toLowerCase().includes(q) ||
        t.category?.name.toLowerCase().includes(q),
    );
  }, [transactions, search]);

  const groups = useMemo(() => groupByDate(filtered), [filtered]);

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
        <ActivityIndicator color={Colors.accent} style={{ marginTop: Spacing['2xl'] }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      {/* Header */}
      <View style={{ padding: Spacing.md, paddingBottom: 0 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm }}>
          <Text style={{ color: Colors.white, fontSize: FontSize.lg, fontWeight: '800' }}>Transactions</Text>
          <MonthSelector />
        </View>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search transactions..."
          placeholderTextColor={Colors.muted}
          style={{
            backgroundColor: Colors.surface,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: Colors.border,
            color: Colors.white,
            fontSize: FontSize.base,
            paddingHorizontal: Spacing.md,
            paddingVertical: Spacing.sm,
            marginBottom: Spacing.md,
          }}
        />
      </View>

      <FlatList
        data={groups}
        keyExtractor={(item) => item.date}
        contentContainerStyle={{ paddingBottom: Spacing['2xl'] }}
        renderItem={({ item: group }) => (
          <View>
            <Text style={{ color: Colors.muted, fontSize: FontSize.sm, fontWeight: '600', paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs }}>
              {formatGroupDate(group.date)}
            </Text>
            <View style={{ backgroundColor: Colors.card, borderRadius: 12, marginHorizontal: Spacing.md, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' }}>
              {group.data.map((tx, i) => (
                <View key={tx.id}>
                  <TransactionRow
                    transaction={tx}
                    isAnomaly={anomalyIds.has(tx.id)}
                    onPress={() => router.push(`/transaction/${tx.id}`)}
                  />
                  {i < group.data.length - 1 && (
                    <View style={{ height: 1, backgroundColor: Colors.border, marginHorizontal: Spacing.md }} />
                  )}
                </View>
              ))}
            </View>
          </View>
        )}
        ListEmptyComponent={
          <Text style={{ color: Colors.muted, textAlign: 'center', marginTop: Spacing['2xl'], fontSize: FontSize.base }}>
            No transactions found.
          </Text>
        }
      />

      {/* FAB */}
      <Pressable
        onPress={() => router.push('/transaction/add')}
        style={({ pressed }) => ({
          position: 'absolute',
          bottom: Spacing.xl,
          right: Spacing.lg,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: Colors.accent,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed ? 0.8 : 1,
          elevation: 8,
        })}
      >
        <Text style={{ color: Colors.white, fontSize: 28, lineHeight: 32 }}>+</Text>
      </Pressable>
    </SafeAreaView>
  );
}
