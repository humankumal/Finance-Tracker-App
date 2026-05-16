import React, { useMemo, useEffect, useCallback, useState } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../lib/store/authStore';
import { useUIStore } from '../../lib/store/uiStore';
import { useTransactions } from '../../lib/hooks/useTransactions';
import { useCategories } from '../../lib/hooks/useCategories';
import { calculateBudgetSummaries, totalVariance } from '../../lib/math/budget-variance';
import { haptic } from '../../lib/haptics';
import { Colors, FontSize, Spacing } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { BudgetCard } from '../../components/finance/BudgetCard';
import { MonthSelector } from '../../components/ui/MonthSelector';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { checkBudgetAlerts } from '../../lib/notifications';

function getDaysInMonth(yearMonth: string) {
  const [year, month] = yearMonth.split('-').map(Number);
  return new Date(year, month, 0).getDate();
}

function getDaysElapsed(yearMonth: string) {
  const today = new Date();
  const [year, month] = yearMonth.split('-').map(Number);
  if (year === today.getFullYear() && month === today.getMonth() + 1) {
    return today.getDate();
  }
  return getDaysInMonth(yearMonth);
}

export default function BudgetScreen() {
  const { user } = useAuthStore();
  const { selectedMonth } = useUIStore();
  const userId = user?.id ?? '';

  const [refreshing, setRefreshing] = useState(false);

  const { data: transactions = [], isLoading: txLoading, refetch: refetchTx } = useTransactions(userId, selectedMonth);
  const { data: categories = [], isLoading: catLoading, refetch: refetchCat } = useCategories(userId);

  const isLoading = txLoading || catLoading;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    haptic.light();
    await Promise.all([refetchTx(), refetchCat()]);
    setRefreshing(false);
  }, [refetchTx, refetchCat]);

  const { summaries, totals } = useMemo(() => {
    const daysElapsed = getDaysElapsed(selectedMonth);
    const daysInMonth = getDaysInMonth(selectedMonth);
    const s = calculateBudgetSummaries(categories, transactions, daysElapsed, daysInMonth);
    const t = totalVariance(s);
    return { summaries: s, totals: t };
  }, [categories, transactions, selectedMonth]);

  useEffect(() => {
    const isCurrentMonth = selectedMonth === new Date().toISOString().slice(0, 7);
    if (isCurrentMonth && summaries.length > 0) {
      checkBudgetAlerts(summaries);
    }
  }, [summaries, selectedMonth]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView
        contentContainerStyle={{ padding: Spacing.md, paddingBottom: Spacing['2xl'] }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.accent}
            colors={[Colors.accent]}
          />
        }
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md }}>
          <Text style={{ color: Colors.white, fontSize: FontSize.lg, fontWeight: '800' }}>Budget</Text>
          <MonthSelector />
        </View>

        {isLoading ? (
          <View style={{ gap: Spacing.sm }}>
            <SkeletonCard rows={2} />
            {[1, 2, 3].map((i) => <SkeletonCard key={i} rows={3} />)}
          </View>
        ) : (
          <>
            {/* Total summary card */}
            <Card style={{ marginBottom: Spacing.md, flexDirection: 'row', justifyContent: 'space-between' }}>
              <View>
                <Text style={{ color: Colors.muted, fontSize: FontSize.xs }}>Total Spent</Text>
                <Text style={{ color: Colors.white, fontSize: FontSize.xl, fontWeight: '800' }}>
                  ${totals.totalSpent.toFixed(0)}
                </Text>
              </View>
              <View style={{ alignItems: 'center' }}>
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
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
