import React, { useMemo } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../lib/store/authStore';
import { useUIStore } from '../../lib/store/uiStore';
import { useTransactions } from '../../lib/hooks/useTransactions';
import { useCategories } from '../../lib/hooks/useCategories';
import { calculateBudgetSummaries, totalVariance } from '../../lib/math/budget-variance';
import { Colors, FontSize, Spacing } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { BudgetCard } from '../../components/finance/BudgetCard';

function getDaysInMonth(yearMonth: string) {
  const [year, month] = yearMonth.split('-').map(Number);
  return new Date(year, month, 0).getDate();
}

function getDaysElapsed(yearMonth: string) {
  const today = new Date();
  const [year, month] = yearMonth.split('-').map(Number);
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  if (year === currentYear && month === currentMonth) {
    return today.getDate();
  }
  return getDaysInMonth(yearMonth);
}

export default function BudgetScreen() {
  const { user } = useAuthStore();
  const { selectedMonth } = useUIStore();
  const userId = user?.id ?? '';

  const { data: transactions = [], isLoading: txLoading } = useTransactions(userId, selectedMonth);
  const { data: categories = [], isLoading: catLoading } = useCategories(userId);

  const { summaries, totals } = useMemo(() => {
    const daysElapsed = getDaysElapsed(selectedMonth);
    const daysInMonth = getDaysInMonth(selectedMonth);
    const s = calculateBudgetSummaries(categories, transactions, daysElapsed, daysInMonth);
    const t = totalVariance(s);
    return { summaries: s, totals: t };
  }, [categories, transactions, selectedMonth]);

  const monthLabel = new Date(`${selectedMonth}-01`).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  if (txLoading || catLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
        <ActivityIndicator color={Colors.accent} style={{ marginTop: Spacing['2xl'] }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView contentContainerStyle={{ padding: Spacing.md, paddingBottom: Spacing['2xl'] }}>

        <Text style={{ color: Colors.white, fontSize: FontSize.lg, fontWeight: '700', marginBottom: Spacing.sm }}>
          Budget
        </Text>
        <Text style={{ color: Colors.muted, fontSize: FontSize.sm, marginBottom: Spacing.md }}>
          {monthLabel}
        </Text>

        {/* Total summary card */}
        <Card style={{ marginBottom: Spacing.md, flexDirection: 'row', justifyContent: 'space-between' }}>
          <View>
            <Text style={{ color: Colors.muted, fontSize: FontSize.xs }}>Total Spent</Text>
            <Text style={{ color: Colors.white, fontSize: FontSize.xl, fontWeight: '800' }}>
              ${totals.totalSpent.toFixed(0)}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ color: Colors.muted, fontSize: FontSize.xs }}>Budgeted</Text>
            <Text style={{ color: Colors.white, fontSize: FontSize.xl, fontWeight: '800' }}>
              ${totals.totalBudgeted.toFixed(0)}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ color: Colors.muted, fontSize: FontSize.xs }}>Variance</Text>
            <Text
              style={{
                fontSize: FontSize.md,
                fontWeight: '700',
                color: totals.variance <= 0 ? Colors.success : Colors.danger,
              }}
            >
              {totals.variance <= 0 ? '' : '+'}{totals.variancePct.toFixed(1)}%
            </Text>
          </View>
        </Card>

        {summaries.length === 0 ? (
          <Card>
            <Text style={{ color: Colors.muted, textAlign: 'center', fontSize: FontSize.sm }}>
              No categories with budgets yet. Add categories to track your budget.
            </Text>
          </Card>
        ) : (
          summaries
            .sort((a, b) => b.variancePct - a.variancePct)
            .map((s) => <BudgetCard key={s.category.id} summary={s} />)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
