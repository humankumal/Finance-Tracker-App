import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthStore } from '../../lib/store/authStore';
import { useCategories } from '../../lib/hooks/useCategories';
import { useAccounts } from '../../lib/hooks/useAccounts';
import { useAddTransaction } from '../../lib/hooks/useTransactions';
import { haptic } from '../../lib/haptics';
import type { TransactionType } from '../../types';
import { Colors, FontSize, Spacing } from '../../constants/theme';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export default function AddTransactionScreen() {
  const { user } = useAuthStore();
  const userId = user?.id ?? '';

  const { data: categories = [] } = useCategories(userId);
  const { data: accounts = [] } = useAccounts(userId);
  const addTransaction = useAddTransaction();

  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [selectedAccount, setSelectedAccount] = useState<string | undefined>();
  const [error, setError] = useState('');

  async function handleSave() {
    setError('');
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) {
      haptic.error();
      setError('Enter a valid amount.');
      return;
    }
    try {
      await addTransaction.mutateAsync({
        user_id: userId,
        type,
        amount: parsed,
        description,
        date,
        category_id: selectedCategory,
        account_id: selectedAccount,
      });
      haptic.success();
      router.back();
    } catch {
      haptic.error();
    }
  }

  const relevantCategories = categories.filter(
    (c) => (type === 'income' ? c.bucket === 'income' : c.bucket !== 'income'),
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={{ padding: Spacing.md, paddingBottom: Spacing['2xl'] }}>

          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.lg }}>
            <Pressable onPress={() => router.back()} style={{ marginRight: Spacing.sm }}>
              <Text style={{ color: Colors.accent, fontSize: FontSize.base }}>← Back</Text>
            </Pressable>
            <Text style={{ color: Colors.white, fontSize: FontSize.lg, fontWeight: '700' }}>
              Add Transaction
            </Text>
          </View>

          {/* Type toggle */}
          <View style={{ flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: 12, padding: 4, marginBottom: Spacing.md }}>
            {(['expense', 'income'] as TransactionType[]).map((t) => (
              <Pressable
                key={t}
                onPress={() => setType(t)}
                style={{
                  flex: 1,
                  paddingVertical: Spacing.sm,
                  borderRadius: 10,
                  alignItems: 'center',
                  backgroundColor: type === t ? (t === 'income' ? Colors.success : Colors.danger) : 'transparent',
                }}
              >
                <Text style={{ color: Colors.white, fontWeight: '700', textTransform: 'capitalize' }}>
                  {t}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Amount */}
          <Input
            label="Amount ($)"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            placeholder="0.00"
            containerStyle={{ marginBottom: Spacing.md }}
          />

          {/* Description */}
          <Input
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="e.g. Grocery run"
            containerStyle={{ marginBottom: Spacing.md }}
          />

          {/* Date */}
          <Input
            label="Date (YYYY-MM-DD)"
            value={date}
            onChangeText={setDate}
            placeholder={new Date().toISOString().slice(0, 10)}
            containerStyle={{ marginBottom: Spacing.md }}
          />

          {/* Category */}
          <Text style={{ color: Colors.muted, fontSize: FontSize.sm, fontWeight: '500', marginBottom: Spacing.xs }}>
            Category
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.md }}>
            <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
              {relevantCategories.map((cat) => (
                <Pressable
                  key={cat.id}
                  onPress={() => setSelectedCategory(cat.id === selectedCategory ? undefined : cat.id)}
                  style={{
                    paddingHorizontal: Spacing.sm,
                    paddingVertical: Spacing.xs,
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: cat.id === selectedCategory ? cat.color : Colors.border,
                    backgroundColor: cat.id === selectedCategory ? cat.color + '33' : Colors.surface,
                  }}
                >
                  <Text style={{ color: Colors.white, fontSize: FontSize.sm }}>
                    {cat.icon ?? '📁'} {cat.name}
                  </Text>
                </Pressable>
              ))}
              {relevantCategories.length === 0 && (
                <Text style={{ color: Colors.muted, fontSize: FontSize.sm }}>No categories. Add some first.</Text>
              )}
            </View>
          </ScrollView>

          {/* Account */}
          {accounts.length > 0 && (
            <>
              <Text style={{ color: Colors.muted, fontSize: FontSize.sm, fontWeight: '500', marginBottom: Spacing.xs }}>
                Account
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.md }}>
                <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                  {accounts.map((acc) => (
                    <Pressable
                      key={acc.id}
                      onPress={() => setSelectedAccount(acc.id === selectedAccount ? undefined : acc.id)}
                      style={{
                        paddingHorizontal: Spacing.sm,
                        paddingVertical: Spacing.xs,
                        borderRadius: 20,
                        borderWidth: 1,
                        borderColor: acc.id === selectedAccount ? Colors.accent : Colors.border,
                        backgroundColor: acc.id === selectedAccount ? Colors.accent + '33' : Colors.surface,
                      }}
                    >
                      <Text style={{ color: Colors.white, fontSize: FontSize.sm }}>{acc.name}</Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </>
          )}

          {error ? (
            <Text style={{ color: Colors.danger, fontSize: FontSize.sm, marginBottom: Spacing.md }}>{error}</Text>
          ) : null}

          <Button
            label="Save Transaction"
            onPress={handleSave}
            loading={addTransaction.isPending}
            fullWidth
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
