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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../lib/store/authStore';
import { useAccounts, useAddAccount } from '../../lib/hooks/useAccounts';
import { supabase } from '../../lib/supabase';
import type { Account, AccountType } from '../../types';
import { Colors, FontSize, Spacing, Radius } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

const ACCOUNT_TYPES: { value: AccountType; label: string; emoji: string; color: string }[] = [
  { value: 'checking', label: 'Checking', emoji: '🏦', color: '#6C5CE7' },
  { value: 'savings',  label: 'Savings',  emoji: '🐷', color: '#00B894' },
  { value: 'credit',   label: 'Credit',   emoji: '💳', color: '#FF6B6B' },
  { value: 'cash',     label: 'Cash',     emoji: '💵', color: '#FDCB6E' },
];

function AccountCard({
  account,
  onDelete,
}: {
  account: Account;
  onDelete: (id: string) => void;
}) {
  const typeInfo = ACCOUNT_TYPES.find((t) => t.value === account.type) ?? ACCOUNT_TYPES[0];
  const isCredit = account.type === 'credit';

  return (
    <Card style={{ marginBottom: Spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: Radius.md,
            backgroundColor: typeInfo.color + '33',
            borderWidth: 1,
            borderColor: typeInfo.color + '66',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: Spacing.sm,
          }}
        >
          <Text style={{ fontSize: 22 }}>{typeInfo.emoji}</Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={{ color: Colors.white, fontSize: FontSize.base, fontWeight: '700' }}>
            {account.name}
          </Text>
          <Text style={{ color: Colors.muted, fontSize: FontSize.sm }}>
            {typeInfo.label} · {account.currency}
          </Text>
        </View>

        <View style={{ alignItems: 'flex-end', marginRight: Spacing.sm }}>
          <Text
            style={{
              color: isCredit ? Colors.danger : Colors.success,
              fontSize: FontSize.md,
              fontWeight: '800',
            }}
          >
            {isCredit ? '-' : '+'}${Math.abs(account.balance).toFixed(2)}
          </Text>
          <Text style={{ color: Colors.muted, fontSize: FontSize.xs }}>balance</Text>
        </View>

        <Pressable
          onPress={() => onDelete(account.id)}
          hitSlop={8}
          style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
        >
          <Text style={{ color: Colors.danger, fontSize: FontSize.md }}>✕</Text>
        </Pressable>
      </View>
    </Card>
  );
}

export default function AccountsScreen() {
  const { user } = useAuthStore();
  const userId = user?.id ?? '';
  const qc = useQueryClient();

  const { data: accounts = [], isLoading } = useAccounts(userId);
  const addAccount = useAddAccount();

  const deleteAccount = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('accounts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounts'] }),
  });

  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('0');
  const [currency, setCurrency] = useState('USD');
  const [selectedType, setSelectedType] = useState<AccountType>('checking');
  const [error, setError] = useState('');

  function handleDelete(id: string) {
    Alert.alert('Delete Account', 'This will not delete associated transactions.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteAccount.mutate(id) },
    ]);
  }

  async function handleAdd() {
    setError('');
    if (!name.trim()) {
      setError('Account name is required.');
      return;
    }
    await addAccount.mutateAsync({
      user_id: userId,
      name: name.trim(),
      type: selectedType,
      balance: parseFloat(balance) || 0,
      currency: currency.trim().toUpperCase() || 'USD',
    });
    setModalVisible(false);
    setName(''); setBalance('0'); setCurrency('USD'); setSelectedType('checking');
  }

  const totalAssets = accounts
    .filter((a) => a.type !== 'credit')
    .reduce((s, a) => s + a.balance, 0);
  const totalDebt = accounts
    .filter((a) => a.type === 'credit')
    .reduce((s, a) => s + a.balance, 0);
  const netWorth = totalAssets - totalDebt;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.md, paddingBottom: 0 }}>
        <Text style={{ color: Colors.white, fontSize: FontSize.lg, fontWeight: '700' }}>Accounts</Text>
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

          {/* Net worth summary */}
          {accounts.length > 0 && (
            <Card style={{ marginBottom: Spacing.md, flexDirection: 'row', justifyContent: 'space-between' }}>
              <View>
                <Text style={{ color: Colors.muted, fontSize: FontSize.xs }}>Net Worth</Text>
                <Text style={{ color: netWorth >= 0 ? Colors.success : Colors.danger, fontSize: FontSize.xl, fontWeight: '800' }}>
                  ${netWorth.toFixed(2)}
                </Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ color: Colors.muted, fontSize: FontSize.xs }}>Assets</Text>
                <Text style={{ color: Colors.success, fontSize: FontSize.md, fontWeight: '700' }}>
                  ${totalAssets.toFixed(2)}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ color: Colors.muted, fontSize: FontSize.xs }}>Debt</Text>
                <Text style={{ color: Colors.danger, fontSize: FontSize.md, fontWeight: '700' }}>
                  ${totalDebt.toFixed(2)}
                </Text>
              </View>
            </Card>
          )}

          {accounts.length === 0 ? (
            <Card>
              <Text style={{ color: Colors.muted, textAlign: 'center', fontSize: FontSize.sm }}>
                No accounts yet. Add a checking, savings, credit, or cash account.
              </Text>
            </Card>
          ) : (
            accounts.map((acc) => (
              <AccountCard key={acc.id} account={acc} onDelete={handleDelete} />
            ))
          )}
        </ScrollView>
      )}

      {/* Add Account Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={{ flex: 1, justifyContent: 'flex-end' }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View
            style={{
              backgroundColor: Colors.surface,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: Spacing.lg,
              borderWidth: 1,
              borderColor: Colors.border,
            }}
          >
            <Text style={{ color: Colors.white, fontSize: FontSize.lg, fontWeight: '700', marginBottom: Spacing.md }}>
              New Account
            </Text>

            {/* Account type selector */}
            <Text style={{ color: Colors.muted, fontSize: FontSize.sm, fontWeight: '500', marginBottom: Spacing.xs }}>
              Type
            </Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: Spacing.md }}>
              {ACCOUNT_TYPES.map((t) => (
                <Pressable
                  key={t.value}
                  onPress={() => setSelectedType(t.value)}
                  style={{
                    flex: 1,
                    alignItems: 'center',
                    paddingVertical: Spacing.sm,
                    borderRadius: Radius.md,
                    borderWidth: 1,
                    borderColor: selectedType === t.value ? t.color : Colors.border,
                    backgroundColor: selectedType === t.value ? t.color + '22' : Colors.card,
                  }}
                >
                  <Text style={{ fontSize: 20, marginBottom: 2 }}>{t.emoji}</Text>
                  <Text style={{ color: Colors.white, fontSize: FontSize.xs, fontWeight: '600' }}>{t.label}</Text>
                </Pressable>
              ))}
            </View>

            <Input
              label="Account Name"
              value={name}
              onChangeText={setName}
              placeholder="e.g. Chase Checking"
              containerStyle={{ marginBottom: Spacing.sm }}
            />
            <Input
              label="Current Balance ($)"
              value={balance}
              onChangeText={setBalance}
              keyboardType="numeric"
              placeholder="0.00"
              containerStyle={{ marginBottom: Spacing.sm }}
            />
            <Input
              label="Currency"
              value={currency}
              onChangeText={setCurrency}
              placeholder="USD"
              autoCapitalize="characters"
              containerStyle={{ marginBottom: Spacing.md }}
            />

            {error ? (
              <Text style={{ color: Colors.danger, fontSize: FontSize.sm, marginBottom: Spacing.sm }}>{error}</Text>
            ) : null}

            <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
              <Button label="Cancel" onPress={() => setModalVisible(false)} variant="secondary" style={{ flex: 1 }} />
              <Button label="Add Account" onPress={handleAdd} loading={addAccount.isPending} style={{ flex: 1 }} />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
