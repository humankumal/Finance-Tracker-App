import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../lib/store/authStore';
import { useSavingsGoals, useAddGoal, useUpdateGoal } from '../../lib/hooks/useSavingsGoals';
import {
  calculateCompoundInterest,
  monthsToGoal,
  requiredMonthlyContrib,
} from '../../lib/math/compound-interest';
import type { SavingsGoal } from '../../types';
import { Colors, FontSize, Spacing } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ProgressBar } from '../../components/ui/ProgressBar';

function GoalCard({ goal }: { goal: SavingsGoal }) {
  const result = calculateCompoundInterest(
    goal.current_amount,
    goal.interest_rate,
    10,
    goal.monthly_contrib,
  );
  const months = monthsToGoal(
    goal.target_amount,
    goal.current_amount,
    goal.monthly_contrib,
    goal.interest_rate,
  );
  const required = requiredMonthlyContrib(
    goal.target_amount,
    goal.current_amount,
    24,
    goal.interest_rate,
  );

  const pct = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0;

  return (
    <Card style={{ marginBottom: Spacing.md }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm }}>
        <Text style={{ color: Colors.white, fontSize: FontSize.md, fontWeight: '700', flex: 1 }}>
          {goal.name}
        </Text>
        <Text style={{ color: Colors.success, fontSize: FontSize.md, fontWeight: '700' }}>
          {pct.toFixed(0)}%
        </Text>
      </View>

      <ProgressBar value={goal.current_amount} max={goal.target_amount} color={Colors.success} height={8} style={{ marginBottom: Spacing.sm }} />

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm }}>
        <View>
          <Text style={{ color: Colors.muted, fontSize: FontSize.xs }}>Saved</Text>
          <Text style={{ color: Colors.white, fontSize: FontSize.base, fontWeight: '600' }}>
            ${goal.current_amount.toFixed(0)}
          </Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ color: Colors.muted, fontSize: FontSize.xs }}>Target</Text>
          <Text style={{ color: Colors.white, fontSize: FontSize.base, fontWeight: '600' }}>
            ${goal.target_amount.toFixed(0)}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ color: Colors.muted, fontSize: FontSize.xs }}>Rate</Text>
          <Text style={{ color: Colors.accent, fontSize: FontSize.base, fontWeight: '600' }}>
            {(goal.interest_rate * 100).toFixed(1)}%
          </Text>
        </View>
      </View>

      {/* Compound interest projection */}
      <View style={{ backgroundColor: Colors.surface, borderRadius: 8, padding: Spacing.sm, gap: 4 }}>
        <Text style={{ color: Colors.muted, fontSize: FontSize.xs, fontWeight: '600', marginBottom: 4 }}>
          📐 Compound Interest Projection
        </Text>
        <Text style={{ color: Colors.white, fontSize: FontSize.xs }}>
          FV in 10 yrs: <Text style={{ color: Colors.success, fontWeight: '700' }}>${result.futureValue.toFixed(0)}</Text>
          {' '}(+${result.interestEarned.toFixed(0)} interest)
        </Text>
        <Text style={{ color: Colors.white, fontSize: FontSize.xs }}>
          Time to goal: <Text style={{ color: Colors.accent, fontWeight: '700' }}>
            {months === Infinity ? 'Never at current rate' : `${months} months`}
          </Text>
        </Text>
        <Text style={{ color: Colors.white, fontSize: FontSize.xs }}>
          Required in 24 mo: <Text style={{ color: Colors.warning, fontWeight: '700' }}>${Math.max(0, required).toFixed(0)}/mo</Text>
        </Text>
      </View>
    </Card>
  );
}

export default function GoalsScreen() {
  const { user } = useAuthStore();
  const userId = user?.id ?? '';

  const { data: goals = [], isLoading } = useSavingsGoals(userId);
  const addGoal = useAddGoal();

  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [current, setCurrent] = useState('0');
  const [monthly, setMonthly] = useState('');
  const [rate, setRate] = useState('5');

  async function handleAdd() {
    if (!name || !target) return;
    await addGoal.mutateAsync({
      user_id: userId,
      name,
      target_amount: parseFloat(target),
      current_amount: parseFloat(current) || 0,
      monthly_contrib: parseFloat(monthly) || 0,
      interest_rate: (parseFloat(rate) || 5) / 100,
    });
    setModalVisible(false);
    setName(''); setTarget(''); setCurrent('0'); setMonthly(''); setRate('5');
  }

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

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md }}>
          <Text style={{ color: Colors.white, fontSize: FontSize.lg, fontWeight: '700' }}>Savings Goals</Text>
          <Pressable
            onPress={() => setModalVisible(true)}
            style={{ backgroundColor: Colors.accent, borderRadius: 20, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs }}
          >
            <Text style={{ color: Colors.white, fontSize: FontSize.sm, fontWeight: '700' }}>+ New Goal</Text>
          </Pressable>
        </View>

        {goals.length === 0 ? (
          <Card>
            <Text style={{ color: Colors.muted, textAlign: 'center', fontSize: FontSize.sm }}>
              No savings goals yet.{'\n'}Create one to see compound interest projections!
            </Text>
          </Card>
        ) : (
          goals.map((goal) => <GoalCard key={goal.id} goal={goal} />)
        )}
      </ScrollView>

      {/* Add Goal Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={{ flex: 1, justifyContent: 'flex-end' }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={{ backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border }}>
            <Text style={{ color: Colors.white, fontSize: FontSize.lg, fontWeight: '700', marginBottom: Spacing.md }}>
              New Savings Goal
            </Text>

            <Input label="Goal Name" value={name} onChangeText={setName} placeholder="e.g. Emergency Fund" containerStyle={{ marginBottom: Spacing.sm }} />
            <Input label="Target Amount ($)" value={target} onChangeText={setTarget} keyboardType="numeric" placeholder="10000" containerStyle={{ marginBottom: Spacing.sm }} />
            <Input label="Current Amount ($)" value={current} onChangeText={setCurrent} keyboardType="numeric" placeholder="0" containerStyle={{ marginBottom: Spacing.sm }} />
            <Input label="Monthly Contribution ($)" value={monthly} onChangeText={setMonthly} keyboardType="numeric" placeholder="500" containerStyle={{ marginBottom: Spacing.sm }} />
            <Input label="Annual Interest Rate (%)" value={rate} onChangeText={setRate} keyboardType="numeric" placeholder="5" containerStyle={{ marginBottom: Spacing.md }} />

            <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
              <Button label="Cancel" onPress={() => setModalVisible(false)} variant="secondary" style={{ flex: 1 }} />
              <Button label="Add Goal" onPress={handleAdd} loading={addGoal.isPending} style={{ flex: 1 }} />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
