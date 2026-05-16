import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../lib/store/authStore';
import { useUIStore } from '../../lib/store/uiStore';
import { useTransactions } from '../../lib/hooks/useTransactions';
import { useCategories } from '../../lib/hooks/useCategories';
import { sumByBucket, calculate503020 } from '../../lib/math/fifty-thirty-twenty';
import { Colors, FontSize, Spacing } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { HealthScoreRing } from '../../components/finance/HealthScoreRing';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { TransactionRow } from '../../components/finance/TransactionRow';

export default function DashboardScreen() {
  const { user } = useAuthStore();
  const { selectedMonth } = useUIStore();
  const userId = user?.id ?? '';

  const { data: transactions = [], isLoading: txLoading } = useTransactions(userId, selectedMonth);
  const { data: categories = [] } = useCategories(userId);

  const { income, expenses, health } = useMemo(() => {
    const inc = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const exp = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const breakdown = sumByBucket(transactions, categories);
    const h = calculate503020(breakdown);
    return { income: inc, expenses: exp, health: h };
  }, [transactions, categories]);

  const net = income - expenses;
  const recent = transactions.slice(0, 5);

  const monthLabel = new Date(`${selectedMonth}-01`).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  if (txLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
        <ActivityIndicator color={Colors.accent} style={{ marginTop: Spacing['2xl'] }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView contentContainerStyle={{ padding: Spacing.md, paddingBottom: Spacing['2xl'] }}>

        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg }}>
          <View>
            <Text style={{ color: Colors.muted, fontSize: FontSize.sm }}>Overview</Text>
            <Text style={{ color: Colors.white, fontSize: FontSize.lg, fontWeight: '700' }}>{monthLabel}</Text>
          </View>
          <Text style={{ fontSize: 28 }}>💹</Text>
        </View>

        {/* Net Balance Card */}
        <Card style={{ marginBottom: Spacing.md }}>
          <Text style={{ color: Colors.muted, fontSize: FontSize.sm, marginBottom: 4 }}>Net Balance</Text>
          <Text
            style={{
              color: net >= 0 ? Colors.success : Colors.danger,
              fontSize: FontSize['3xl'],
              fontWeight: '800',
            }}
          >
            {net >= 0 ? '+' : ''}${net.toFixed(2)}
          </Text>
          <View style={{ flexDirection: 'row', marginTop: Spacing.sm, gap: Spacing.lg }}>
            <View>
              <Text style={{ color: Colors.muted, fontSize: FontSize.xs }}>Income</Text>
              <Text style={{ color: Colors.success, fontSize: FontSize.md, fontWeight: '700' }}>
                +${income.toFixed(2)}
              </Text>
            </View>
            <View>
              <Text style={{ color: Colors.muted, fontSize: FontSize.xs }}>Expenses</Text>
              <Text style={{ color: Colors.danger, fontSize: FontSize.md, fontWeight: '700' }}>
                -${expenses.toFixed(2)}
              </Text>
            </View>
          </View>
        </Card>

        {/* Financial Health */}
        <Card style={{ marginBottom: Spacing.md, alignItems: 'center' }}>
          <Text style={{ color: Colors.white, fontSize: FontSize.md, fontWeight: '700', marginBottom: Spacing.md }}>
            Financial Health — 50/30/20
          </Text>
          <HealthScoreRing score={health.score} label={health.label} />
          <View style={{ marginTop: Spacing.md, width: '100%', gap: Spacing.sm }}>
            {health.recommendations.map((rec, i) => (
              <Text key={i} style={{ color: Colors.muted, fontSize: FontSize.sm }}>
                • {rec}
              </Text>
            ))}
          </View>
        </Card>

        {/* Savings rate bar */}
        <Card style={{ marginBottom: Spacing.md }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.xs }}>
            <Text style={{ color: Colors.white, fontSize: FontSize.sm, fontWeight: '600' }}>Savings Rate</Text>
            <Text style={{ color: Colors.muted, fontSize: FontSize.sm }}>
              Target: ≥20%
            </Text>
          </View>
          <ProgressBar
            value={health.bucketScores.savings}
            max={100}
            color={Colors.success}
            height={8}
          />
          <Text style={{ color: Colors.muted, fontSize: FontSize.xs, marginTop: Spacing.xs }}>
            Score: {health.bucketScores.savings}/100
          </Text>
        </Card>

        {/* Recent Transactions */}
        <View style={{ marginBottom: Spacing.md }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm }}>
            <Text style={{ color: Colors.white, fontSize: FontSize.md, fontWeight: '700' }}>Recent</Text>
            <Pressable onPress={() => router.push('/(tabs)/transactions')}>
              <Text style={{ color: Colors.accent, fontSize: FontSize.sm, fontWeight: '600' }}>See all</Text>
            </Pressable>
          </View>
          <Card padding={0}>
            {recent.length === 0 ? (
              <Text style={{ color: Colors.muted, textAlign: 'center', padding: Spacing.lg, fontSize: FontSize.sm }}>
                No transactions yet. Add your first one!
              </Text>
            ) : (
              recent.map((tx, i) => (
                <View key={tx.id}>
                  <TransactionRow transaction={tx} />
                  {i < recent.length - 1 && (
                    <View style={{ height: 1, backgroundColor: Colors.border, marginHorizontal: Spacing.md }} />
                  )}
                </View>
              ))
            )}
          </Card>
        </View>

        {/* FAB */}
        <Pressable
          onPress={() => router.push('/transaction/add')}
          style={({ pressed }) => ({
            position: 'absolute',
            bottom: Spacing['2xl'],
            right: Spacing.lg,
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: Colors.accent,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.8 : 1,
            shadowColor: Colors.accent,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.4,
            shadowRadius: 8,
            elevation: 8,
          })}
        >
          <Text style={{ color: Colors.white, fontSize: 28, lineHeight: 32 }}>+</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
