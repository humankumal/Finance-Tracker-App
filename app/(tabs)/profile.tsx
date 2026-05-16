import React from 'react';
import { View, Text, Pressable, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthStore } from '../../lib/store/authStore';
import { useCategories } from '../../lib/hooks/useCategories';
import { useAccounts } from '../../lib/hooks/useAccounts';
import { useSavingsGoals } from '../../lib/hooks/useSavingsGoals';
import { supabase } from '../../lib/supabase';
import { Colors, FontSize, Spacing, Radius } from '../../constants/theme';
import { Card } from '../../components/ui/Card';

interface ManageRowProps {
  emoji: string;
  label: string;
  subtitle?: string;
  onPress: () => void;
  badge?: string | number;
}

function ManageRow({ emoji, label, subtitle, onPress, badge }: ManageRowProps) {
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
      <Text style={{ fontSize: 22, marginRight: Spacing.sm }}>{emoji}</Text>
      <View style={{ flex: 1 }}>
        <Text style={{ color: Colors.white, fontSize: FontSize.base, fontWeight: '600' }}>{label}</Text>
        {subtitle && <Text style={{ color: Colors.muted, fontSize: FontSize.xs }}>{subtitle}</Text>}
      </View>
      {badge !== undefined && (
        <View style={{ backgroundColor: Colors.accent + '33', borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 2, marginRight: Spacing.sm }}>
          <Text style={{ color: Colors.accent, fontSize: FontSize.xs, fontWeight: '700' }}>{badge}</Text>
        </View>
      )}
      <Text style={{ color: Colors.muted, fontSize: FontSize.md }}>›</Text>
    </Pressable>
  );
}

export default function ProfileScreen() {
  const { user } = useAuthStore();
  const userId = user?.id ?? '';

  const { data: categories = [] } = useCategories(userId);
  const { data: accounts = [] } = useAccounts(userId);
  const { data: goals = [] } = useSavingsGoals(userId);

  async function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          router.replace('/(auth)/login');
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView contentContainerStyle={{ padding: Spacing.md, paddingBottom: Spacing['2xl'] }}>

        {/* Account header */}
        <View style={{ alignItems: 'center', marginBottom: Spacing.xl }}>
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: Colors.accent + '33',
              borderWidth: 2,
              borderColor: Colors.accent,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: Spacing.sm,
            }}
          >
            <Text style={{ fontSize: 32 }}>💹</Text>
          </View>
          <Text style={{ color: Colors.white, fontSize: FontSize.md, fontWeight: '700' }}>
            {user?.email ?? 'Your Account'}
          </Text>
          <Text style={{ color: Colors.muted, fontSize: FontSize.sm, marginTop: 2 }}>
            Finance Tracker
          </Text>
        </View>

        {/* Manage section */}
        <Text style={{ color: Colors.muted, fontSize: FontSize.xs, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: Spacing.xs }}>
          Manage
        </Text>
        <Card padding={0} style={{ marginBottom: Spacing.md }}>
          <ManageRow
            emoji="📁"
            label="Categories"
            subtitle="Spending buckets, budgets, icons"
            badge={categories.length}
            onPress={() => router.push('/manage/categories')}
          />
          <View style={{ height: 1, backgroundColor: Colors.border, marginHorizontal: Spacing.md }} />
          <ManageRow
            emoji="🏦"
            label="Accounts"
            subtitle="Checking, savings, credit, cash"
            badge={accounts.length}
            onPress={() => router.push('/manage/accounts')}
          />
          <View style={{ height: 1, backgroundColor: Colors.border, marginHorizontal: Spacing.md }} />
          <ManageRow
            emoji="🚀"
            label="Savings Goals"
            subtitle="Compound interest projections"
            badge={goals.length}
            onPress={() => router.push('/(tabs)/goals')}
          />
        </Card>

        {/* Stats section */}
        <Text style={{ color: Colors.muted, fontSize: FontSize.xs, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: Spacing.xs }}>
          Overview
        </Text>
        <Card style={{ marginBottom: Spacing.md, flexDirection: 'row', justifyContent: 'space-around' }}>
          {[
            { label: 'Categories', value: categories.length },
            { label: 'Accounts', value: accounts.length },
            { label: 'Goals', value: goals.length },
          ].map(({ label, value }) => (
            <View key={label} style={{ alignItems: 'center' }}>
              <Text style={{ color: Colors.white, fontSize: FontSize.xl, fontWeight: '800' }}>{value}</Text>
              <Text style={{ color: Colors.muted, fontSize: FontSize.xs }}>{label}</Text>
            </View>
          ))}
        </Card>

        {/* Account section */}
        <Text style={{ color: Colors.muted, fontSize: FontSize.xs, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: Spacing.xs }}>
          Account
        </Text>
        <Card padding={0} style={{ marginBottom: Spacing.md }}>
          <Pressable
            onPress={handleSignOut}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              padding: Spacing.md,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text style={{ fontSize: 22, marginRight: Spacing.sm }}>🚪</Text>
            <Text style={{ color: Colors.danger, fontSize: FontSize.base, fontWeight: '600', flex: 1 }}>
              Sign Out
            </Text>
          </Pressable>
        </Card>

      </ScrollView>
    </SafeAreaView>
  );
}
