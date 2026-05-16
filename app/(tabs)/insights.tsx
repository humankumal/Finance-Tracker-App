import React, { useMemo } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../lib/store/authStore';
import { useTransactions } from '../../lib/hooks/useTransactions';
import { useCategories } from '../../lib/hooks/useCategories';
import { buildTrendPoints, detectAnomalies, linearRegression } from '../../lib/math/trend-analysis';
import { sumByBucket, calculate503020 } from '../../lib/math/fifty-thirty-twenty';
import { Colors, BucketColors, FontSize, Spacing } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { HealthScoreRing } from '../../components/finance/HealthScoreRing';
import { TransactionRow } from '../../components/finance/TransactionRow';

export default function InsightsScreen() {
  const { user } = useAuthStore();
  const userId = user?.id ?? '';

  const { data: allTransactions = [], isLoading } = useTransactions(userId);
  const { data: categories = [] } = useCategories(userId);

  const { trendPoints, regression, anomalyIds, health, buckets } = useMemo(() => {
    const trend = buildTrendPoints(allTransactions, 3, 3);
    const amounts = trend.map((p) => p.amount);
    const reg = linearRegression(
      amounts.map((_, i) => i),
      amounts,
    );

    const anomalies = detectAnomalies(allTransactions);

    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthTxs = allTransactions.filter((t) => t.date.startsWith(currentMonth));
    const breakdown = sumByBucket(monthTxs, categories);
    const h = calculate503020(breakdown);

    return { trendPoints: trend, regression: reg, anomalyIds: anomalies, health: h, buckets: breakdown };
  }, [allTransactions, categories]);

  const anomalousTransactions = allTransactions.filter((t) => anomalyIds.has(t.id)).slice(0, 5);

  const trendLabel =
    regression.slope > 5
      ? `↑ Spending trending UP +$${regression.slope.toFixed(0)}/mo`
      : regression.slope < -5
      ? `↓ Spending trending DOWN $${Math.abs(regression.slope).toFixed(0)}/mo`
      : '→ Spending is stable';

  const trendColor =
    regression.slope > 5 ? Colors.danger : regression.slope < -5 ? Colors.success : Colors.muted;

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
        <ActivityIndicator color={Colors.accent} style={{ marginTop: Spacing['2xl'] }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView contentContainerStyle={{ padding: Spacing.md, paddingBottom: Spacing['2xl'] }}>

        <Text style={{ color: Colors.white, fontSize: FontSize.lg, fontWeight: '700', marginBottom: Spacing.md }}>
          Insights
        </Text>

        {/* Financial Health */}
        <Card style={{ marginBottom: Spacing.md, alignItems: 'center' }}>
          <Text style={{ color: Colors.white, fontSize: FontSize.md, fontWeight: '700', marginBottom: Spacing.md }}>
            This Month's Health Score
          </Text>
          <HealthScoreRing score={health.score} label={health.label} size={140} />

          {/* Bucket bars */}
          <View style={{ width: '100%', marginTop: Spacing.lg, gap: Spacing.sm }}>
            {(['needs', 'wants', 'savings'] as const).map((bucket) => (
              <View key={bucket}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ color: Colors.white, fontSize: FontSize.sm, textTransform: 'capitalize' }}>
                    {bucket}
                  </Text>
                  <Text style={{ color: BucketColors[bucket], fontSize: FontSize.sm, fontWeight: '700' }}>
                    {health.bucketScores[bucket]}/100
                  </Text>
                </View>
                <View style={{ height: 6, backgroundColor: Colors.border, borderRadius: 4 }}>
                  <View
                    style={{
                      height: '100%',
                      width: `${health.bucketScores[bucket]}%`,
                      backgroundColor: BucketColors[bucket],
                      borderRadius: 4,
                    }}
                  />
                </View>
              </View>
            ))}
          </View>
        </Card>

        {/* Spending Trend */}
        <Card style={{ marginBottom: Spacing.md }}>
          <Text style={{ color: Colors.white, fontSize: FontSize.md, fontWeight: '700', marginBottom: Spacing.xs }}>
            Spending Trend
          </Text>
          <Text style={{ color: trendColor, fontSize: FontSize.sm, fontWeight: '600', marginBottom: Spacing.md }}>
            {trendLabel}
          </Text>
          <Text style={{ color: Colors.muted, fontSize: FontSize.xs, marginBottom: Spacing.sm }}>
            R² = {regression.r2.toFixed(2)} — {regression.r2 > 0.7 ? 'Strong' : regression.r2 > 0.4 ? 'Moderate' : 'Weak'} trend signal
          </Text>

          {/* Sparkline: simple bar chart for last 6 months */}
          {trendPoints.length === 0 ? (
            <Text style={{ color: Colors.muted, fontSize: FontSize.sm }}>
              Need at least 1 month of data.
            </Text>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 60, gap: 6 }}>
              {trendPoints.slice(-6).map((point, i) => {
                const maxAmt = Math.max(...trendPoints.map((p) => p.amount), 1);
                const barH = Math.max((point.amount / maxAmt) * 60, 4);
                const emaH = point.ema ? Math.max((point.ema / maxAmt) * 60, 4) : null;
                return (
                  <View key={point.date} style={{ flex: 1, alignItems: 'center' }}>
                    <View style={{ width: '100%', height: barH, backgroundColor: Colors.accent + '99', borderRadius: 4 }} />
                    {emaH && (
                      <View
                        style={{
                          position: 'absolute',
                          bottom: barH,
                          width: '100%',
                          height: 2,
                          backgroundColor: Colors.warning,
                        }}
                      />
                    )}
                    <Text style={{ color: Colors.muted, fontSize: 9, marginTop: 4 }}>
                      {point.date.slice(5)}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
          <View style={{ flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View style={{ width: 12, height: 12, backgroundColor: Colors.accent + '99', borderRadius: 2 }} />
              <Text style={{ color: Colors.muted, fontSize: FontSize.xs }}>Spending</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View style={{ width: 12, height: 3, backgroundColor: Colors.warning }} />
              <Text style={{ color: Colors.muted, fontSize: FontSize.xs }}>EMA</Text>
            </View>
          </View>
        </Card>

        {/* 50/30/20 breakdown */}
        <Card style={{ marginBottom: Spacing.md }}>
          <Text style={{ color: Colors.white, fontSize: FontSize.md, fontWeight: '700', marginBottom: Spacing.sm }}>
            50/30/20 Breakdown
          </Text>
          {(buckets.income === 0) ? (
            <Text style={{ color: Colors.muted, fontSize: FontSize.sm }}>Record income to see breakdown.</Text>
          ) : (
            (['needs', 'wants', 'savings'] as const).map((bucket) => {
              const ideal = { needs: 50, wants: 30, savings: 20 }[bucket];
              const actual = buckets.income > 0 ? Math.round((buckets[bucket] / buckets.income) * 100) : 0;
              return (
                <View key={bucket} style={{ marginBottom: Spacing.sm }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ color: Colors.white, fontSize: FontSize.sm, textTransform: 'capitalize' }}>
                      {bucket}
                    </Text>
                    <Text style={{ color: BucketColors[bucket], fontSize: FontSize.sm, fontWeight: '700' }}>
                      {actual}% <Text style={{ color: Colors.muted, fontWeight: '400' }}>(target: {ideal}%)</Text>
                    </Text>
                  </View>
                  <View style={{ height: 6, backgroundColor: Colors.border, borderRadius: 4, marginTop: 4 }}>
                    <View style={{ height: '100%', width: `${Math.min(actual, 100)}%`, backgroundColor: BucketColors[bucket], borderRadius: 4 }} />
                  </View>
                </View>
              );
            })
          )}
          <View style={{ marginTop: Spacing.sm }}>
            {health.recommendations.map((rec, i) => (
              <Text key={i} style={{ color: Colors.muted, fontSize: FontSize.xs, marginBottom: 2 }}>• {rec}</Text>
            ))}
          </View>
        </Card>

        {/* Anomaly Report */}
        {anomalousTransactions.length > 0 && (
          <Card>
            <Text style={{ color: Colors.warning, fontSize: FontSize.md, fontWeight: '700', marginBottom: Spacing.sm }}>
              ⚠ Unusual Transactions
            </Text>
            <Text style={{ color: Colors.muted, fontSize: FontSize.xs, marginBottom: Spacing.sm }}>
              These transactions are statistical outliers (Z-score ≥ 2σ) in their category.
            </Text>
            {anomalousTransactions.map((tx) => (
              <TransactionRow key={tx.id} transaction={tx} isAnomaly />
            ))}
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
