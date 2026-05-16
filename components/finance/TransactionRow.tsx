import React from 'react';
import { View, Text, Pressable } from 'react-native';
import type { Transaction } from '../../types';
import { Colors, FontSize, Radius, Spacing } from '../../constants/theme';
import { Badge } from '../ui/Badge';

interface TransactionRowProps {
  transaction: Transaction;
  isAnomaly?: boolean;
  onPress?: () => void;
}

function formatAmount(amount: number, type: string) {
  const prefix = type === 'income' ? '+' : '-';
  return `${prefix}$${amount.toFixed(2)}`;
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function TransactionRow({ transaction, isAnomaly = false, onPress }: TransactionRowProps) {
  const isIncome = transaction.type === 'income';
  const catColor = transaction.category?.color ?? Colors.muted;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.sm + 2,
        paddingHorizontal: Spacing.md,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      {/* Category color dot */}
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: Radius.full,
          backgroundColor: catColor + '33',
          borderWidth: 1,
          borderColor: catColor + '66',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: Spacing.sm,
        }}
      >
        <Text style={{ fontSize: 18 }}>{transaction.category?.icon ?? '💸'}</Text>
      </View>

      {/* Description + category */}
      <View style={{ flex: 1 }}>
        <Text
          style={{ color: Colors.white, fontSize: FontSize.base, fontWeight: '500' }}
          numberOfLines={1}
        >
          {transaction.description ?? 'Transaction'}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2, gap: 6 }}>
          {transaction.category && (
            <Badge label={transaction.category.name} color={catColor} />
          )}
          {isAnomaly && <Badge label="⚠ Unusual" color={Colors.warning} />}
          <Text style={{ color: Colors.muted, fontSize: FontSize.xs }}>
            {formatDate(transaction.date)}
          </Text>
        </View>
      </View>

      {/* Amount */}
      <Text
        style={{
          color: isIncome ? Colors.success : Colors.danger,
          fontSize: FontSize.base,
          fontWeight: '700',
        }}
      >
        {formatAmount(transaction.amount, transaction.type)}
      </Text>
    </Pressable>
  );
}
