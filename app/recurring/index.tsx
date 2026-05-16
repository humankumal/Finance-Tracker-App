import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../lib/store/authStore';
import { useRecurring, useAddRecurring, useToggleRecurring, useDeleteRecurring } from '../../lib/hooks/useRecurring';
import { useCategories } from '../../lib/hooks/useCategories';
import { useAccounts } from '../../lib/hooks/useAccounts';
import type { RecurringFrequency, TransactionType, RecurringTransaction } from '../../types';
import { Colors, BucketColors, FontSize, Spacing, Radius } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';

const FREQUENCIES: { value: RecurringFrequency; label: string; emoji: string }[] = [
  { value: 'daily',   label: 'Daily',   emoji: '📅' },
  { value: 'weekly',  label: 'Weekly',  emoji: '📆' },
  { value: 'monthly', label: 'Monthly', emoji: '🗓️' },
  { value: 'yearly',  label: 'Yearly',  emoji: '📇' },
];

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dateStr);
  due.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - today.getTime()) / 86400000);
}

function RecurringCard({ rule, onToggle, onDelete }: {
  rule: RecurringTransaction;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const isIncome = rule.type === 'income';
  const catColor = rule.category?.color ?? Colors.muted;
  const days = daysUntil(rule.next_due_date);
  const daysLabel = days < 0 ? 'Overdue' : days === 0 ? 'Due today' : `In ${days}d`;
  const daysColor = days <= 0 ? Colors.danger : days <= 3 ? Colors.warning : Colors.muted;
  const freq = FREQUENCIES.find((f) => f.value === rule.frequency);

  return (
    <Card style={{ marginBottom: Spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {/* Icon */}
        <View style={{
          width: 44, height: 44, borderRadius: Radius.md,
          backgroundColor: catColor + '33', borderWidth: 1, borderColor: catColor + '66',
          alignItems: 'center', justifyContent: 'center', marginRight: Spacing.sm,
        }}>
          <Text style={{ fontSize: 20 }}>{rule.category?.icon ?? (isIncome ? '💰' : '💸')}</Text>
        </View>

        {/* Info */}
        <View style={{ flex: 1 }}>
          <Text style={{ color: Colors.white, fontSize: FontSize.base, fontWeight: '700' }} numberOfLines={1}>
            {rule.description ?? rule.category?.name ?? 'Recurring'}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <Badge label={freq?.label ?? rule.frequency} color={Colors.accent} />
            {rule.category && <Badge label={rule.category.name} color={catColor} />}
          </View>
        </View>

        {/* Amount + toggle */}
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          <Text style={{ color: isIncome ? Colors.success : Colors.danger, fontSize: FontSize.base, fontWeight: '800' }}>
            {isIncome ? '+' : '-'}${rule.amount.toFixed(0)}
          </Text>
          <Switch
            value={rule.is_active}
            onValueChange={onToggle}
            trackColor={{ false: Colors.border, true: Colors.accent + '88' }}
            thumbColor={rule.is_active ? Colors.accent : Colors.muted}
          />
        </View>
      </View>

      {/* Footer row */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.sm, paddingTop: Spacing.xs, borderTopWidth: 1, borderTopColor: Colors.border }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text style={{ color: Colors.muted, fontSize: FontSize.xs }}>Next: </Text>
          <Text style={{ color: daysColor, fontSize: FontSize.xs, fontWeight: '700' }}>
            {rule.next_due_date} ({daysLabel})
          </Text>
        </View>
        <Pressable onPress={onDelete} hitSlop={8}>
          <Text style={{ color: Colors.danger, fontSize: FontSize.xs, fontWeight: '600' }}>Delete</Text>
        </Pressable>
      </View>
    </Card>
  );
}

export default function RecurringScreen() {
  const { user } = useAuthStore();
  const userId = user?.id ?? '';

  const { data: rules = [], isLoading } = useRecurring(userId);
  const { data: categories = [] } = useCategories(userId);
  const { data: accounts = [] } = useAccounts(userId);

  const addRecurring = useAddRecurring();
  const toggleRecurring = useToggleRecurring();
  const deleteRecurring = useDeleteRecurring();

  const [modalVisible, setModalVisible] = useState(false);
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState<RecurringFrequency>('monthly');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [accountId, setAccountId] = useState<string | undefined>();
  const [formError, setFormError] = useState('');

  function resetForm() {
    setType('expense'); setAmount(''); setDescription('');
    setFrequency('monthly'); setStartDate(new Date().toISOString().slice(0, 10));
    setCategoryId(undefined); setAccountId(undefined); setFormError('');
  }

  async function handleAdd() {
    setFormError('');
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) { setFormError('Enter a valid amount.'); return; }
    await addRecurring.mutateAsync({
      user_id: userId,
      amount: parsed,
      type,
      description,
      frequency,
      next_due_date: startDate,
      category_id: categoryId,
      account_id: accountId,
    });
    setModalVisible(false);
    resetForm();
  }

  function confirmDelete(id: string, desc?: string) {
    Alert.alert('Delete Recurring Rule', `Remove "${desc ?? 'this rule'}"? This won't delete past transactions.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteRecurring.mutate(id) },
    ]);
  }

  const active = rules.filter((r) => r.is_active);
  const paused = rules.filter((r) => !r.is_active);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.md, paddingBottom: 0 }}>
        <Text style={{ color: Colors.white, fontSize: FontSize.lg, fontWeight: '800' }}>Recurring</Text>
        <Pressable
          onPress={() => setModalVisible(true)}
          style={{ backgroundColor: Colors.accent, borderRadius: 20, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs }}
        >
          <Text style={{ color: Colors.white, fontSize: FontSize.sm, fontWeight: '700' }}>+ Add</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <ActivityIndicator color={Colors.accent} style={{ marginTop: Spacing['2xl'] }} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: Spacing.md, paddingBottom: Spacing['2xl'] }}>
          {rules.length === 0 && (
            <Card>
              <Text style={{ color: Colors.muted, textAlign: 'center', fontSize: FontSize.sm }}>
                No recurring transactions yet.{'\n'}Add rent, salary, subscriptions — they'll auto-post on schedule.
              </Text>
            </Card>
          )}

          {active.length > 0 && (
            <>
              <Text style={{ color: Colors.muted, fontSize: FontSize.xs, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: Spacing.xs }}>
                Active ({active.length})
              </Text>
              {active.map((r) => (
                <RecurringCard
                  key={r.id}
                  rule={r}
                  onToggle={() => toggleRecurring.mutate({ id: r.id, is_active: false })}
                  onDelete={() => confirmDelete(r.id, r.description)}
                />
              ))}
            </>
          )}

          {paused.length > 0 && (
            <>
              <Text style={{ color: Colors.muted, fontSize: FontSize.xs, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginTop: Spacing.md, marginBottom: Spacing.xs }}>
                Paused ({paused.length})
              </Text>
              {paused.map((r) => (
                <RecurringCard
                  key={r.id}
                  rule={r}
                  onToggle={() => toggleRecurring.mutate({ id: r.id, is_active: true })}
                  onDelete={() => confirmDelete(r.id, r.description)}
                />
              ))}
            </>
          )}
        </ScrollView>
      )}

      {/* Add Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView style={{ flex: 1, justifyContent: 'flex-end' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={{ backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border, maxHeight: '92%' }}>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={{ color: Colors.white, fontSize: FontSize.lg, fontWeight: '700', marginBottom: Spacing.md }}>New Recurring Rule</Text>

              {/* Type */}
              <View style={{ flexDirection: 'row', backgroundColor: Colors.card, borderRadius: 12, padding: 4, marginBottom: Spacing.md }}>
                {(['expense', 'income'] as TransactionType[]).map((t) => (
                  <Pressable key={t} onPress={() => setType(t)} style={{ flex: 1, paddingVertical: Spacing.sm, borderRadius: 10, alignItems: 'center', backgroundColor: type === t ? (t === 'income' ? Colors.success : Colors.danger) : 'transparent' }}>
                    <Text style={{ color: Colors.white, fontWeight: '700', textTransform: 'capitalize' }}>{t}</Text>
                  </Pressable>
                ))}
              </View>

              <Input label="Amount ($)" value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="0.00" containerStyle={{ marginBottom: Spacing.sm }} />
              <Input label="Description" value={description} onChangeText={setDescription} placeholder="e.g. Monthly Rent" containerStyle={{ marginBottom: Spacing.sm }} />

              {/* Frequency */}
              <Text style={{ color: Colors.muted, fontSize: FontSize.sm, fontWeight: '500', marginBottom: Spacing.xs }}>Frequency</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: Spacing.md }}>
                {FREQUENCIES.map((f) => (
                  <Pressable key={f.value} onPress={() => setFrequency(f.value)} style={{ flex: 1, alignItems: 'center', paddingVertical: Spacing.sm, borderRadius: Radius.md, borderWidth: 1, borderColor: frequency === f.value ? Colors.accent : Colors.border, backgroundColor: frequency === f.value ? Colors.accent + '22' : Colors.card }}>
                    <Text style={{ fontSize: 18 }}>{f.emoji}</Text>
                    <Text style={{ color: Colors.white, fontSize: FontSize.xs, fontWeight: '600', marginTop: 2 }}>{f.label}</Text>
                  </Pressable>
                ))}
              </View>

              <Input label="Start Date (YYYY-MM-DD)" value={startDate} onChangeText={setStartDate} placeholder={new Date().toISOString().slice(0, 10)} containerStyle={{ marginBottom: Spacing.md }} />

              {/* Category */}
              <Text style={{ color: Colors.muted, fontSize: FontSize.sm, fontWeight: '500', marginBottom: Spacing.xs }}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.md }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {categories.filter((c) => type === 'income' ? c.bucket === 'income' : c.bucket !== 'income').map((cat) => (
                    <Pressable key={cat.id} onPress={() => setCategoryId(cat.id === categoryId ? undefined : cat.id)} style={{ paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, borderRadius: 20, borderWidth: 1, borderColor: cat.id === categoryId ? cat.color : Colors.border, backgroundColor: cat.id === categoryId ? cat.color + '33' : Colors.card }}>
                      <Text style={{ color: Colors.white, fontSize: FontSize.xs }}>{cat.icon} {cat.name}</Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>

              {/* Account */}
              {accounts.length > 0 && (
                <>
                  <Text style={{ color: Colors.muted, fontSize: FontSize.sm, fontWeight: '500', marginBottom: Spacing.xs }}>Account</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.md }}>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      {accounts.map((acc) => (
                        <Pressable key={acc.id} onPress={() => setAccountId(acc.id === accountId ? undefined : acc.id)} style={{ paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, borderRadius: 20, borderWidth: 1, borderColor: acc.id === accountId ? Colors.accent : Colors.border, backgroundColor: acc.id === accountId ? Colors.accent + '33' : Colors.card }}>
                          <Text style={{ color: Colors.white, fontSize: FontSize.xs }}>{acc.name}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </ScrollView>
                </>
              )}

              {formError ? <Text style={{ color: Colors.danger, fontSize: FontSize.sm, marginBottom: Spacing.sm }}>{formError}</Text> : null}

              <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                <Button label="Cancel" onPress={() => { setModalVisible(false); resetForm(); }} variant="secondary" style={{ flex: 1 }} />
                <Button label="Add Rule" onPress={handleAdd} loading={addRecurring.isPending} style={{ flex: 1 }} />
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
