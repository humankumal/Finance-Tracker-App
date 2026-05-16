import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Switch,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthStore } from '../../lib/store/authStore';
import { useUIStore } from '../../lib/store/uiStore';
import { useTransactions } from '../../lib/hooks/useTransactions';
import { useCategories } from '../../lib/hooks/useCategories';
import { detectAnomalies } from '../../lib/math/trend-analysis';
import { Colors, FontSize, Spacing, BucketColors } from '../../constants/theme';
import { TransactionRow } from '../../components/finance/TransactionRow';
import { MonthSelector } from '../../components/ui/MonthSelector';
import type { Transaction, TransactionType, BudgetBucket } from '../../types';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Filters {
  type: TransactionType | 'all';
  categoryIds: Set<string>;
  bucket: BudgetBucket | 'all';
  minAmount: string;
  maxAmount: string;
}

const DEFAULT_FILTERS: Filters = {
  type: 'all',
  categoryIds: new Set(),
  bucket: 'all',
  minAmount: '',
  maxAmount: '',
};

function hasActiveFilters(f: Filters) {
  return (
    f.type !== 'all' ||
    f.categoryIds.size > 0 ||
    f.bucket !== 'all' ||
    f.minAmount !== '' ||
    f.maxAmount !== ''
  );
}

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
  const d = new Date(dateStr + 'T12:00:00');
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

const TYPE_OPTIONS: { label: string; value: Filters['type'] }[] = [
  { label: 'All', value: 'all' },
  { label: 'Income', value: 'income' },
  { label: 'Expense', value: 'expense' },
];

const BUCKET_OPTIONS: { label: string; value: Filters['bucket'] }[] = [
  { label: 'All', value: 'all' },
  { label: 'Needs', value: 'needs' },
  { label: 'Wants', value: 'wants' },
  { label: 'Savings', value: 'savings' },
  { label: 'Income', value: 'income' },
];

export default function TransactionsScreen() {
  const { user } = useAuthStore();
  const { selectedMonth } = useUIStore();
  const userId = user?.id ?? '';

  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);

  const { data: transactions = [], isLoading } = useTransactions(userId, selectedMonth);
  const { data: categories = [] } = useCategories(userId);

  const anomalyIds = useMemo(() => detectAnomalies(transactions), [transactions]);

  const toggleFilters = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowFilters((v) => !v);
  }, []);

  const toggleCategory = useCallback((id: string) => {
    setFilters((f) => {
      const next = new Set(f.categoryIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { ...f, categoryIds: next };
    });
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setSearch('');
  }, []);

  const filtered = useMemo(() => {
    let result = transactions;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.description?.toLowerCase().includes(q) ||
          t.category?.name.toLowerCase().includes(q),
      );
    }

    if (filters.type !== 'all') {
      result = result.filter((t) => t.type === filters.type);
    }

    if (filters.categoryIds.size > 0) {
      result = result.filter((t) => t.category_id && filters.categoryIds.has(t.category_id));
    }

    if (filters.bucket !== 'all') {
      result = result.filter((t) => t.category?.bucket === filters.bucket);
    }

    const min = parseFloat(filters.minAmount);
    if (!isNaN(min)) {
      result = result.filter((t) => t.amount >= min);
    }

    const max = parseFloat(filters.maxAmount);
    if (!isNaN(max)) {
      result = result.filter((t) => t.amount <= max);
    }

    return result;
  }, [transactions, search, filters]);

  const groups = useMemo(() => groupByDate(filtered), [filtered]);
  const activeFilters = hasActiveFilters(filters);
  const activeCount = (filters.type !== 'all' ? 1 : 0) + (filters.categoryIds.size > 0 ? 1 : 0) + (filters.bucket !== 'all' ? 1 : 0) + (filters.minAmount !== '' || filters.maxAmount !== '' ? 1 : 0);

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

        {/* Search + Filter row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.xs }}>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search transactions..."
            placeholderTextColor={Colors.muted}
            style={{
              flex: 1,
              backgroundColor: Colors.surface,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: Colors.border,
              color: Colors.white,
              fontSize: FontSize.base,
              paddingHorizontal: Spacing.md,
              paddingVertical: Spacing.sm,
            }}
          />
          {/* Filter toggle button */}
          <Pressable
            onPress={toggleFilters}
            style={({ pressed }) => ({
              width: 44,
              height: 44,
              borderRadius: 12,
              backgroundColor: showFilters ? Colors.accent : Colors.surface,
              borderWidth: 1,
              borderColor: showFilters ? Colors.accent : Colors.border,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.7 : 1,
              position: 'relative',
            })}
          >
            <Text style={{ fontSize: 18 }}>⚙</Text>
            {activeCount > 0 && (
              <View
                style={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  width: 16,
                  height: 16,
                  borderRadius: 8,
                  backgroundColor: Colors.danger,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: Colors.white, fontSize: 9, fontWeight: '800' }}>{activeCount}</Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* Results count row */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm }}>
          <Text style={{ color: Colors.muted, fontSize: FontSize.xs }}>
            {filtered.length} transaction{filtered.length !== 1 ? 's' : ''}
            {filtered.length !== transactions.length ? ` of ${transactions.length}` : ''}
          </Text>
          {(activeFilters || search.trim()) && (
            <Pressable onPress={clearFilters}>
              <Text style={{ color: Colors.accent, fontSize: FontSize.xs, fontWeight: '600' }}>Clear all</Text>
            </Pressable>
          )}
        </View>

        {/* Filter panel */}
        {showFilters && (
          <View
            style={{
              backgroundColor: Colors.surface,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: Colors.border,
              padding: Spacing.md,
              marginBottom: Spacing.sm,
              gap: Spacing.md,
            }}
          >
            {/* Type filter */}
            <View>
              <Text style={{ color: Colors.muted, fontSize: FontSize.xs, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: Spacing.xs }}>
                Type
              </Text>
              <View style={{ flexDirection: 'row', gap: Spacing.xs }}>
                {TYPE_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.value}
                    onPress={() => setFilters((f) => ({ ...f, type: opt.value }))}
                    style={({ pressed }) => ({
                      flex: 1,
                      paddingVertical: 8,
                      borderRadius: 8,
                      backgroundColor: filters.type === opt.value ? Colors.accent : Colors.card,
                      borderWidth: 1,
                      borderColor: filters.type === opt.value ? Colors.accent : Colors.border,
                      alignItems: 'center',
                      opacity: pressed ? 0.8 : 1,
                    })}
                  >
                    <Text style={{ color: filters.type === opt.value ? Colors.white : Colors.muted, fontSize: FontSize.sm, fontWeight: '600' }}>
                      {opt.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Bucket filter */}
            <View>
              <Text style={{ color: Colors.muted, fontSize: FontSize.xs, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: Spacing.xs }}>
                Budget Bucket
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs }}>
                {BUCKET_OPTIONS.map((opt) => {
                  const isActive = filters.bucket === opt.value;
                  const bucketColor = opt.value !== 'all' ? BucketColors[opt.value] : Colors.accent;
                  return (
                    <Pressable
                      key={opt.value}
                      onPress={() => setFilters((f) => ({ ...f, bucket: opt.value }))}
                      style={({ pressed }) => ({
                        paddingVertical: 6,
                        paddingHorizontal: Spacing.sm,
                        borderRadius: 8,
                        backgroundColor: isActive ? bucketColor + '33' : Colors.card,
                        borderWidth: 1,
                        borderColor: isActive ? bucketColor : Colors.border,
                        opacity: pressed ? 0.8 : 1,
                      })}
                    >
                      <Text style={{ color: isActive ? bucketColor : Colors.muted, fontSize: FontSize.sm, fontWeight: '600' }}>
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Category filter */}
            {categories.length > 0 && (
              <View>
                <Text style={{ color: Colors.muted, fontSize: FontSize.xs, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: Spacing.xs }}>
                  Categories {filters.categoryIds.size > 0 && `(${filters.categoryIds.size} selected)`}
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ flexDirection: 'row', gap: Spacing.xs }}>
                    {categories.map((cat) => {
                      const isSelected = filters.categoryIds.has(cat.id);
                      return (
                        <Pressable
                          key={cat.id}
                          onPress={() => toggleCategory(cat.id)}
                          style={({ pressed }) => ({
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 6,
                            paddingVertical: 6,
                            paddingHorizontal: Spacing.sm,
                            borderRadius: 8,
                            backgroundColor: isSelected ? cat.color + '33' : Colors.card,
                            borderWidth: 1,
                            borderColor: isSelected ? cat.color : Colors.border,
                            opacity: pressed ? 0.8 : 1,
                          })}
                        >
                          {cat.icon && <Text style={{ fontSize: 13 }}>{cat.icon}</Text>}
                          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: cat.color }} />
                          <Text style={{ color: isSelected ? Colors.white : Colors.muted, fontSize: FontSize.sm, fontWeight: isSelected ? '600' : '400' }}>
                            {cat.name}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>
            )}

            {/* Amount range filter */}
            <View>
              <Text style={{ color: Colors.muted, fontSize: FontSize.xs, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: Spacing.xs }}>
                Amount Range
              </Text>
              <View style={{ flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' }}>
                <TextInput
                  value={filters.minAmount}
                  onChangeText={(v) => setFilters((f) => ({ ...f, minAmount: v }))}
                  placeholder="Min $"
                  placeholderTextColor={Colors.muted}
                  keyboardType="numeric"
                  style={{
                    flex: 1,
                    backgroundColor: Colors.card,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: Colors.border,
                    color: Colors.white,
                    fontSize: FontSize.sm,
                    paddingHorizontal: Spacing.sm,
                    paddingVertical: 8,
                  }}
                />
                <Text style={{ color: Colors.muted, fontSize: FontSize.sm }}>–</Text>
                <TextInput
                  value={filters.maxAmount}
                  onChangeText={(v) => setFilters((f) => ({ ...f, maxAmount: v }))}
                  placeholder="Max $"
                  placeholderTextColor={Colors.muted}
                  keyboardType="numeric"
                  style={{
                    flex: 1,
                    backgroundColor: Colors.card,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: Colors.border,
                    color: Colors.white,
                    fontSize: FontSize.sm,
                    paddingHorizontal: Spacing.sm,
                    paddingVertical: 8,
                  }}
                />
              </View>
            </View>

            {/* Clear filters button */}
            {activeFilters && (
              <Pressable
                onPress={() => setFilters(DEFAULT_FILTERS)}
                style={({ pressed }) => ({
                  paddingVertical: 10,
                  borderRadius: 8,
                  backgroundColor: Colors.danger + '22',
                  borderWidth: 1,
                  borderColor: Colors.danger + '55',
                  alignItems: 'center',
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Text style={{ color: Colors.danger, fontSize: FontSize.sm, fontWeight: '600' }}>Clear Filters</Text>
              </Pressable>
            )}
          </View>
        )}
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
            {activeFilters || search.trim() ? 'No transactions match your filters.' : 'No transactions found.'}
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
