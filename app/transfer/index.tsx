import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../lib/store/authStore';
import { useAccounts } from '../../lib/hooks/useAccounts';
import { supabase } from '../../lib/supabase';
import { haptic } from '../../lib/haptics';
import { Colors, FontSize, Spacing, Radius } from '../../constants/theme';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import type { AccountType } from '../../types';

const ACCOUNT_COLORS: Record<AccountType, string> = {
  checking: '#6C5CE7',
  savings: '#00B894',
  credit: '#FF6B6B',
  cash: '#FDCB6E',
};

const ACCOUNT_EMOJIS: Record<AccountType, string> = {
  checking: '🏦',
  savings: '🐷',
  credit: '💳',
  cash: '💵',
};

export default function TransferScreen() {
  const { user } = useAuthStore();
  const userId = user?.id ?? '';
  const qc = useQueryClient();

  const { data: accounts = [] } = useAccounts(userId);

  const [fromId, setFromId] = useState<string | undefined>();
  const [toId, setToId] = useState<string | undefined>();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleTransfer() {
    setError('');
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) { setError('Enter a valid amount.'); return; }
    if (!fromId) { setError('Select a source account.'); return; }
    if (!toId) { setError('Select a destination account.'); return; }
    if (fromId === toId) { setError('Source and destination must be different accounts.'); return; }

    setLoading(true);
    const desc = description.trim() ? `[Transfer] ${description.trim()}` : '[Transfer]';

    try {
      const { error: e1 } = await supabase.from('transactions').insert({
        user_id: userId,
        type: 'expense',
        amount: parsed,
        description: desc,
        date,
        account_id: fromId,
      });
      if (e1) throw e1;

      const { error: e2 } = await supabase.from('transactions').insert({
        user_id: userId,
        type: 'income',
        amount: parsed,
        description: desc,
        date,
        account_id: toId,
      });
      if (e2) throw e2;

      await qc.invalidateQueries({ queryKey: ['transactions'] });
      haptic.success();
      router.back();
    } catch (e: any) {
      haptic.error();
      Alert.alert('Transfer failed', e.message);
    } finally {
      setLoading(false);
    }
  }

  const fromAccount = accounts.find((a) => a.id === fromId);
  const toAccount = accounts.find((a) => a.id === toId);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: Spacing.md, paddingBottom: Spacing['2xl'] }}>

          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.lg }}>
            <Pressable onPress={() => router.back()} style={{ marginRight: Spacing.sm }}>
              <Text style={{ color: Colors.accent, fontSize: FontSize.base }}>← Back</Text>
            </Pressable>
            <Text style={{ color: Colors.white, fontSize: FontSize.lg, fontWeight: '700' }}>
              Transfer Funds
            </Text>
          </View>

          {accounts.length < 2 ? (
            <View style={{ backgroundColor: Colors.card, borderRadius: 14, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border }}>
              <Text style={{ color: Colors.muted, textAlign: 'center', fontSize: FontSize.sm }}>
                You need at least 2 accounts to make a transfer.{'\n'}Add another account first.
              </Text>
            </View>
          ) : (
            <>
              {/* From account */}
              <Text style={{ color: Colors.muted, fontSize: FontSize.sm, fontWeight: '600', marginBottom: Spacing.xs }}>
                From Account
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md }}>
                {accounts.map((acc) => {
                  const color = ACCOUNT_COLORS[acc.type];
                  const selected = fromId === acc.id;
                  return (
                    <Pressable
                      key={acc.id}
                      onPress={() => { haptic.light(); setFromId(acc.id); if (toId === acc.id) setToId(undefined); }}
                      style={({ pressed }) => ({
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        paddingVertical: 8,
                        paddingHorizontal: Spacing.sm,
                        borderRadius: Radius.md,
                        borderWidth: 1,
                        borderColor: selected ? color : Colors.border,
                        backgroundColor: selected ? color + '22' : Colors.card,
                        opacity: pressed ? 0.8 : 1,
                      })}
                    >
                      <Text style={{ fontSize: 16 }}>{ACCOUNT_EMOJIS[acc.type]}</Text>
                      <View>
                        <Text style={{ color: Colors.white, fontSize: FontSize.sm, fontWeight: selected ? '700' : '400' }}>
                          {acc.name}
                        </Text>
                        <Text style={{ color: Colors.muted, fontSize: FontSize.xs }}>
                          ${acc.balance.toFixed(2)}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              {/* To account */}
              <Text style={{ color: Colors.muted, fontSize: FontSize.sm, fontWeight: '600', marginBottom: Spacing.xs }}>
                To Account
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md }}>
                {accounts
                  .filter((a) => a.id !== fromId)
                  .map((acc) => {
                    const color = ACCOUNT_COLORS[acc.type];
                    const selected = toId === acc.id;
                    return (
                      <Pressable
                        key={acc.id}
                        onPress={() => { haptic.light(); setToId(acc.id); }}
                        style={({ pressed }) => ({
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 6,
                          paddingVertical: 8,
                          paddingHorizontal: Spacing.sm,
                          borderRadius: Radius.md,
                          borderWidth: 1,
                          borderColor: selected ? color : Colors.border,
                          backgroundColor: selected ? color + '22' : Colors.card,
                          opacity: pressed ? 0.8 : 1,
                        })}
                      >
                        <Text style={{ fontSize: 16 }}>{ACCOUNT_EMOJIS[acc.type]}</Text>
                        <View>
                          <Text style={{ color: Colors.white, fontSize: FontSize.sm, fontWeight: selected ? '700' : '400' }}>
                            {acc.name}
                          </Text>
                          <Text style={{ color: Colors.muted, fontSize: FontSize.xs }}>
                            ${acc.balance.toFixed(2)}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}
              </View>

              {/* Transfer preview */}
              {fromAccount && toAccount && (
                <View style={{ backgroundColor: Colors.surface, borderRadius: 12, padding: Spacing.md, marginBottom: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                  <Text style={{ color: Colors.white, fontSize: FontSize.sm, fontWeight: '600' }}>{fromAccount.name}</Text>
                  <Text style={{ color: Colors.accent, fontSize: FontSize.lg, flex: 1, textAlign: 'center' }}>→</Text>
                  <Text style={{ color: Colors.white, fontSize: FontSize.sm, fontWeight: '600' }}>{toAccount.name}</Text>
                </View>
              )}

              <Input
                label="Amount ($)"
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                placeholder="0.00"
                containerStyle={{ marginBottom: Spacing.sm }}
              />
              <Input
                label="Description (optional)"
                value={description}
                onChangeText={setDescription}
                placeholder="e.g. Monthly savings deposit"
                containerStyle={{ marginBottom: Spacing.sm }}
              />
              <Input
                label="Date (YYYY-MM-DD)"
                value={date}
                onChangeText={setDate}
                placeholder={new Date().toISOString().slice(0, 10)}
                containerStyle={{ marginBottom: Spacing.md }}
              />

              {error ? (
                <Text style={{ color: Colors.danger, fontSize: FontSize.sm, marginBottom: Spacing.md }}>{error}</Text>
              ) : null}

              <Button
                label="Transfer"
                onPress={handleTransfer}
                loading={loading}
                fullWidth
              />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
