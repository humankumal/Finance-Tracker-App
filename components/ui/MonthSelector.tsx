import React, { useCallback } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useUIStore } from '../../lib/store/uiStore';
import { Colors, FontSize, Spacing, Radius } from '../../constants/theme';

function addMonths(yearMonth: string, delta: number): string {
  const [year, month] = yearMonth.split('-').map(Number);
  const d = new Date(year, month - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function formatLabel(yearMonth: string): string {
  return new Date(`${yearMonth}-01`).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

function isCurrentMonth(yearMonth: string): boolean {
  return yearMonth === new Date().toISOString().slice(0, 7);
}

export function MonthSelector() {
  const { selectedMonth, setSelectedMonth } = useUIStore();

  const goBack = useCallback(() => setSelectedMonth(addMonths(selectedMonth, -1)), [selectedMonth, setSelectedMonth]);
  const goForward = useCallback(() => {
    if (!isCurrentMonth(selectedMonth)) setSelectedMonth(addMonths(selectedMonth, 1));
  }, [selectedMonth, setSelectedMonth]);
  const goToday = useCallback(() => setSelectedMonth(new Date().toISOString().slice(0, 7)), [setSelectedMonth]);

  const atCurrent = isCurrentMonth(selectedMonth);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
      {/* Back arrow */}
      <Pressable
        onPress={goBack}
        hitSlop={10}
        style={({ pressed }) => ({
          width: 32,
          height: 32,
          borderRadius: Radius.md,
          backgroundColor: Colors.surface,
          borderWidth: 1,
          borderColor: Colors.border,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed ? 0.6 : 1,
        })}
      >
        <Text style={{ color: Colors.white, fontSize: FontSize.base }}>‹</Text>
      </Pressable>

      {/* Month label — tap to jump to current */}
      <Pressable onPress={goToday} style={{ alignItems: 'center', minWidth: 140 }}>
        <Text style={{ color: Colors.white, fontSize: FontSize.base, fontWeight: '700' }}>
          {formatLabel(selectedMonth)}
        </Text>
        {!atCurrent && (
          <Text style={{ color: Colors.accent, fontSize: FontSize.xs, fontWeight: '600' }}>
            tap to go to today
          </Text>
        )}
      </Pressable>

      {/* Forward arrow — disabled when at current month */}
      <Pressable
        onPress={goForward}
        disabled={atCurrent}
        hitSlop={10}
        style={({ pressed }) => ({
          width: 32,
          height: 32,
          borderRadius: Radius.md,
          backgroundColor: Colors.surface,
          borderWidth: 1,
          borderColor: Colors.border,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: atCurrent ? 0.3 : pressed ? 0.6 : 1,
        })}
      >
        <Text style={{ color: Colors.white, fontSize: FontSize.base }}>›</Text>
      </Pressable>
    </View>
  );
}
