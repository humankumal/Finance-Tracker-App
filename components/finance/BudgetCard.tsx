import React from 'react';
import { View, Text } from 'react-native';
import type { BudgetSummary } from '../../types';
import { Colors, FontSize, Radius, Spacing } from '../../constants/theme';
import { Card } from '../ui/Card';
import { ProgressBar } from '../ui/ProgressBar';

interface BudgetCardProps {
  summary: BudgetSummary;
}

export function BudgetCard({ summary }: BudgetCardProps) {
  const { category, spent, budgeted, variancePct, projectedMonthEnd } = summary;
  const isOver = spent > budgeted;
  const catColor = category.color;

  return (
    <Card style={{ marginBottom: Spacing.sm }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.xs }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 16 }}>{category.icon ?? '📁'}</Text>
          <Text style={{ color: Colors.white, fontSize: FontSize.base, fontWeight: '600' }}>
            {category.name}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ color: Colors.white, fontSize: FontSize.base, fontWeight: '700' }}>
            ${spent.toFixed(0)}
            <Text style={{ color: Colors.muted, fontWeight: '400' }}> / ${budgeted.toFixed(0)}</Text>
          </Text>
          <Text
            style={{
              fontSize: FontSize.xs,
              fontWeight: '600',
              color: isOver ? Colors.danger : Colors.success,
            }}
          >
            {isOver ? '+' : ''}{variancePct.toFixed(1)}%
          </Text>
        </View>
      </View>

      <ProgressBar value={spent} max={budgeted} color={catColor} style={{ marginBottom: Spacing.xs }} />

      <Text style={{ color: Colors.muted, fontSize: FontSize.xs }}>
        Projected: ${projectedMonthEnd.toFixed(0)} by month-end
      </Text>
    </Card>
  );
}
