import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthStore } from '../../lib/store/authStore';
import { supabase } from '../../lib/supabase';
import type { BudgetBucket } from '../../types';
import { Colors, BucketColors, CategoryColors, FontSize, Spacing, Radius } from '../../constants/theme';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

// ─── Preset categories ────────────────────────────────────────────────────────

interface Preset {
  name: string;
  icon: string;
  bucket: BudgetBucket;
  pct: number; // suggested % of monthly income
  color: string;
}

const PRESETS: Preset[] = [
  { name: 'Housing',       icon: '🏠', bucket: 'needs',   pct: 0.28, color: CategoryColors[2] },
  { name: 'Groceries',     icon: '🛒', bucket: 'needs',   pct: 0.10, color: CategoryColors[2] },
  { name: 'Utilities',     icon: '💡', bucket: 'needs',   pct: 0.05, color: CategoryColors[2] },
  { name: 'Transport',     icon: '🚗', bucket: 'needs',   pct: 0.07, color: CategoryColors[2] },
  { name: 'Healthcare',    icon: '💊', bucket: 'needs',   pct: 0.05, color: CategoryColors[2] },
  { name: 'Dining Out',    icon: '🍽️', bucket: 'wants',   pct: 0.05, color: CategoryColors[3] },
  { name: 'Entertainment', icon: '🎬', bucket: 'wants',   pct: 0.05, color: CategoryColors[3] },
  { name: 'Shopping',      icon: '👗', bucket: 'wants',   pct: 0.05, color: CategoryColors[3] },
  { name: 'Fitness',       icon: '💪', bucket: 'wants',   pct: 0.03, color: CategoryColors[3] },
  { name: 'Travel',        icon: '✈️', bucket: 'wants',   pct: 0.05, color: CategoryColors[3] },
  { name: 'Emergency Fund',icon: '🛡️', bucket: 'savings', pct: 0.10, color: CategoryColors[1] },
  { name: 'Investments',   icon: '📈', bucket: 'savings', pct: 0.10, color: CategoryColors[1] },
  { name: 'Salary',        icon: '💰', bucket: 'income',  pct: 0,    color: CategoryColors[0] },
  { name: 'Freelance',     icon: '💻', bucket: 'income',  pct: 0,    color: CategoryColors[0] },
];

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'INR', 'BRL', 'MXN', 'SGD'];

const BUCKET_SECTIONS: { bucket: BudgetBucket; label: string; emoji: string }[] = [
  { bucket: 'needs',   label: 'Needs (50%)',   emoji: '🏠' },
  { bucket: 'wants',   label: 'Wants (30%)',   emoji: '🎬' },
  { bucket: 'savings', label: 'Savings (20%)', emoji: '📈' },
  { bucket: 'income',  label: 'Income Sources',emoji: '💰' },
];

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepDots({ total, current }: { total: number; current: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6, justifyContent: 'center', marginBottom: Spacing.xl }}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={{
            width: i === current ? 24 : 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: i === current ? Colors.accent : Colors.border,
          }}
        />
      ))}
    </View>
  );
}

// ─── Main wizard ─────────────────────────────────────────────────────────────

const TOTAL_STEPS = 3;

export default function OnboardingScreen() {
  const { user } = useAuthStore();
  const userId = user?.id ?? '';

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Step 1 — income & currency
  const [income, setIncome] = useState('');
  const [currency, setCurrency] = useState('USD');

  // Step 2 — category selection
  const [selected, setSelected] = useState<Set<string>>(
    new Set(['Housing', 'Groceries', 'Salary', 'Emergency Fund']),
  );

  function togglePreset(name: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  }

  function next() {
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  }

  function back() {
    setStep((s) => Math.max(s - 1, 0));
  }

  async function finish() {
    setSaving(true);
    try {
      const monthlyIncome = parseFloat(income) || 0;

      // Build category rows for all selected presets
      const categoriesToInsert = PRESETS
        .filter((p) => selected.has(p.name))
        .map((p) => ({
          user_id: userId,
          name: p.name,
          icon: p.icon,
          color: p.color,
          bucket: p.bucket,
          budget_amount: p.bucket !== 'income' && monthlyIncome > 0
            ? Math.round(monthlyIncome * p.pct)
            : 0,
        }));

      if (categoriesToInsert.length > 0) {
        await supabase.from('categories').insert(categoriesToInsert);
      }

      // Mark user as onboarded in Supabase user metadata
      await supabase.auth.updateUser({
        data: { onboarded: true, currency, monthly_income: monthlyIncome },
      });

      router.replace('/(tabs)');
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  // ── Step 0: Welcome ────────────────────────────────────────────────────────
  if (step === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
        <View style={{ flex: 1, padding: Spacing.lg, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 80, marginBottom: Spacing.lg }}>💹</Text>
          <Text style={{ color: Colors.white, fontSize: FontSize['3xl'], fontWeight: '800', textAlign: 'center', marginBottom: Spacing.sm }}>
            Welcome to{'\n'}Finance Tracker
          </Text>
          <Text style={{ color: Colors.muted, fontSize: FontSize.base, textAlign: 'center', lineHeight: 22, marginBottom: Spacing['2xl'] }}>
            A scientific, minimalist approach to managing your money using math that actually works.
          </Text>

          <View style={{ width: '100%', gap: Spacing.md, marginBottom: Spacing['2xl'] }}>
            {[
              ['📐', 'SMA/EMA trend analysis on your spending'],
              ['🎯', '50/30/20 rule scoring with live feedback'],
              ['📈', 'Compound interest projections for goals'],
              ['⚠️', 'Z-score anomaly detection on outlier transactions'],
            ].map(([emoji, text]) => (
              <View key={text as string} style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                <Text style={{ fontSize: 20 }}>{emoji}</Text>
                <Text style={{ color: Colors.muted, fontSize: FontSize.sm, flex: 1 }}>{text as string}</Text>
              </View>
            ))}
          </View>

          <Button label="Get Started →" onPress={next} fullWidth />
        </View>
      </SafeAreaView>
    );
  }

  // ── Step 1: Income & currency ──────────────────────────────────────────────
  if (step === 1) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={{ padding: Spacing.lg, flexGrow: 1 }} keyboardShouldPersistTaps="handled">
            <StepDots total={TOTAL_STEPS} current={step - 1} />

            <Text style={{ color: Colors.white, fontSize: FontSize['2xl'], fontWeight: '800', marginBottom: Spacing.xs }}>
              Your monthly income
            </Text>
            <Text style={{ color: Colors.muted, fontSize: FontSize.sm, marginBottom: Spacing.xl }}>
              Used to calculate 50/30/20 targets and auto-budget your categories.
            </Text>

            <Input
              label="Monthly Take-Home Income ($)"
              value={income}
              onChangeText={setIncome}
              keyboardType="numeric"
              placeholder="e.g. 5000"
              containerStyle={{ marginBottom: Spacing.lg }}
            />

            {/* Currency picker */}
            <Text style={{ color: Colors.muted, fontSize: FontSize.sm, fontWeight: '500', marginBottom: Spacing.sm }}>
              Currency
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: Spacing.xl }}>
              {CURRENCIES.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setCurrency(c)}
                  style={{
                    paddingHorizontal: Spacing.sm + 4,
                    paddingVertical: Spacing.xs + 2,
                    borderRadius: Radius.md,
                    borderWidth: 1,
                    borderColor: currency === c ? Colors.accent : Colors.border,
                    backgroundColor: currency === c ? Colors.accent + '22' : Colors.card,
                  }}
                >
                  <Text style={{ color: currency === c ? Colors.accent : Colors.muted, fontSize: FontSize.sm, fontWeight: '600' }}>
                    {c}
                  </Text>
                </Pressable>
              ))}
            </View>

            {income && parseFloat(income) > 0 && (
              <View style={{ backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.xl, borderWidth: 1, borderColor: Colors.border }}>
                <Text style={{ color: Colors.muted, fontSize: FontSize.xs, fontWeight: '700', marginBottom: Spacing.sm, textTransform: 'uppercase', letterSpacing: 1 }}>
                  50/30/20 Targets
                </Text>
                {[
                  { label: 'Needs   (50%)', amount: parseFloat(income) * 0.5, color: Colors.danger },
                  { label: 'Wants   (30%)', amount: parseFloat(income) * 0.3, color: Colors.warning },
                  { label: 'Savings (20%)', amount: parseFloat(income) * 0.2, color: Colors.success },
                ].map(({ label, amount, color }) => (
                  <View key={label} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={{ color: Colors.muted, fontSize: FontSize.sm }}>{label}</Text>
                    <Text style={{ color, fontSize: FontSize.sm, fontWeight: '700' }}>
                      {currency} {amount.toFixed(0)}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
              <Button label="← Back" onPress={back} variant="secondary" style={{ flex: 1 }} />
              <Button label="Next →" onPress={next} style={{ flex: 1 }} />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ── Step 2: Starter categories ─────────────────────────────────────────────
  if (step === 2) {
    const monthlyIncome = parseFloat(income) || 0;

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
        <View style={{ padding: Spacing.lg, paddingBottom: 0 }}>
          <StepDots total={TOTAL_STEPS} current={step - 1} />
          <Text style={{ color: Colors.white, fontSize: FontSize['2xl'], fontWeight: '800', marginBottom: Spacing.xs }}>
            Pick your categories
          </Text>
          <Text style={{ color: Colors.muted, fontSize: FontSize.sm, marginBottom: Spacing.sm }}>
            Start with these presets — you can edit or add more later. Budgets are auto-set from your income.
          </Text>
        </View>

        <ScrollView contentContainerStyle={{ padding: Spacing.lg, paddingTop: Spacing.sm, paddingBottom: 120 }}>
          {BUCKET_SECTIONS.map((section) => {
            const sectionPresets = PRESETS.filter((p) => p.bucket === section.bucket);
            return (
              <View key={section.bucket} style={{ marginBottom: Spacing.lg }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Spacing.sm }}>
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: BucketColors[section.bucket] }} />
                  <Text style={{ color: Colors.muted, fontSize: FontSize.xs, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>
                    {section.label}
                  </Text>
                </View>
                <View style={{ gap: 6 }}>
                  {sectionPresets.map((preset) => {
                    const isSelected = selected.has(preset.name);
                    const suggestedBudget = monthlyIncome > 0 && preset.pct > 0
                      ? `${currency} ${Math.round(monthlyIncome * preset.pct)}/mo`
                      : null;
                    return (
                      <Pressable
                        key={preset.name}
                        onPress={() => togglePreset(preset.name)}
                        style={({ pressed }) => ({
                          flexDirection: 'row',
                          alignItems: 'center',
                          padding: Spacing.sm + 2,
                          borderRadius: Radius.md,
                          borderWidth: 1,
                          borderColor: isSelected ? preset.color : Colors.border,
                          backgroundColor: isSelected ? preset.color + '18' : Colors.card,
                          opacity: pressed ? 0.8 : 1,
                          gap: Spacing.sm,
                        })}
                      >
                        {/* Checkbox */}
                        <View
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: 6,
                            borderWidth: 1.5,
                            borderColor: isSelected ? preset.color : Colors.border,
                            backgroundColor: isSelected ? preset.color : 'transparent',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {isSelected && <Text style={{ color: Colors.white, fontSize: 13, fontWeight: '800' }}>✓</Text>}
                        </View>
                        {/* Icon */}
                        <Text style={{ fontSize: 20 }}>{preset.icon}</Text>
                        {/* Name + budget */}
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: Colors.white, fontSize: FontSize.sm, fontWeight: '600' }}>{preset.name}</Text>
                          {suggestedBudget && (
                            <Text style={{ color: Colors.muted, fontSize: FontSize.xs }}>{suggestedBudget}</Text>
                          )}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* Fixed bottom bar */}
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: Spacing.lg,
            backgroundColor: Colors.background,
            borderTopWidth: 1,
            borderTopColor: Colors.border,
            flexDirection: 'row',
            gap: Spacing.sm,
          }}
        >
          <Button label="← Back" onPress={back} variant="secondary" style={{ flex: 1 }} />
          <Button
            label={saving ? '' : `Finish (${selected.size} categories)`}
            onPress={finish}
            loading={saving}
            style={{ flex: 2 }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return null;
}
