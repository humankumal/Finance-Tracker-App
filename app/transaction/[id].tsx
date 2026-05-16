import React from 'react';
import { View, Text, Pressable, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useAuthStore } from '../../lib/store/authStore';
import { useTransactions, useDeleteTransaction } from '../../lib/hooks/useTransactions';
import { Colors, FontSize, Spacing } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const userId = user?.id ?? '';

  const { data: transactions = [] } = useTransactions(userId);
  const deleteMutation = useDeleteTransaction();

  const transaction = transactions.find((t) => t.id === id);

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

  if (!transaction) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
        <Text style={{ color: Colors.muted, textAlign: 'center', marginTop: Spacing['2xl'] }}>
          Transaction not found.
        </Text>
      </SafeAreaView>
    );
  }

  const isIncome = transaction.type === 'income';
  const catColor = transaction.category?.color ?? Colors.muted;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView contentContainerStyle={{ padding: Spacing.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.lg }}>
          <Pressable onPress={() => router.back()} style={{ marginRight: Spacing.sm }}>
            <Text style={{ color: Colors.accent, fontSize: FontSize.base }}>← Back</Text>
          </Pressable>
          <Text style={{ color: Colors.white, fontSize: FontSize.lg, fontWeight: '700' }}>
            Transaction Details
          </Text>
        </View>

        <Card style={{ marginBottom: Spacing.md, alignItems: 'center' }}>
          <Text style={{ fontSize: 48, marginBottom: Spacing.sm }}>
            {transaction.category?.icon ?? (isIncome ? '💰' : '💸')}
          </Text>
          <Text
            style={{
              color: isIncome ? Colors.success : Colors.danger,
              fontSize: FontSize['2xl'],
              fontWeight: '800',
              marginBottom: Spacing.xs,
            }}
          >
            {isIncome ? '+' : '-'}${transaction.amount.toFixed(2)}
          </Text>
          <Text style={{ color: Colors.white, fontSize: FontSize.md, marginBottom: Spacing.sm }}>
            {transaction.description ?? 'No description'}
          </Text>
          {transaction.category && (
            <Badge label={transaction.category.name} color={catColor} />
          )}
        </Card>

        <Card style={{ marginBottom: Spacing.md }}>
          {[
            ['Date', new Date(transaction.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })],
            ['Type', transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)],
            ['Account', transaction.account?.name ?? 'Not specified'],
            ['Category', transaction.category?.name ?? 'Uncategorized'],
            ['Bucket', transaction.category?.bucket ?? '—'],
          ].map(([label, value]) => (
            <View key={label} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.xs, borderBottomWidth: 1, borderBottomColor: Colors.border }}>
              <Text style={{ color: Colors.muted, fontSize: FontSize.sm }}>{label}</Text>
              <Text style={{ color: Colors.white, fontSize: FontSize.sm, fontWeight: '500' }}>{value}</Text>
            </View>
          ))}
        </Card>

        <Button
          label="Delete Transaction"
          onPress={handleDelete}
          variant="danger"
          fullWidth
          loading={deleteMutation.isPending}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
