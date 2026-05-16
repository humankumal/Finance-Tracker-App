import React, { useState } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Colors, FontSize, Spacing } from '../../constants/theme';

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSignup() {
    setError('');
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    const { error: err } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (err) {
      setError(err.message);
    } else {
      setSuccess(true);
    }
  }

  if (success) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', padding: Spacing.lg }}>
        <Text style={{ fontSize: 48, marginBottom: Spacing.md }}>✅</Text>
        <Text style={{ color: Colors.white, fontSize: FontSize.lg, fontWeight: '700', textAlign: 'center' }}>
          Check your email to confirm your account.
        </Text>
        <Button
          label="Back to Login"
          onPress={() => router.replace('/(auth)/login')}
          style={{ marginTop: Spacing.lg }}
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: Spacing.lg }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ alignItems: 'center', marginBottom: Spacing['2xl'] }}>
          <Text style={{ fontSize: 48, marginBottom: Spacing.sm }}>💹</Text>
          <Text style={{ color: Colors.white, fontSize: FontSize['2xl'], fontWeight: '800' }}>
            Create Account
          </Text>
          <Text style={{ color: Colors.muted, fontSize: FontSize.base, marginTop: 4 }}>
            Start tracking your finances.
          </Text>
        </View>

        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="you@example.com"
          containerStyle={{ marginBottom: Spacing.md }}
        />
        <Input
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="Min. 6 characters"
          containerStyle={{ marginBottom: Spacing.md }}
        />

        {error ? (
          <Text style={{ color: Colors.danger, fontSize: FontSize.sm, marginBottom: Spacing.md }}>
            {error}
          </Text>
        ) : null}

        <Button
          label="Create Account"
          onPress={handleSignup}
          loading={loading}
          fullWidth
          style={{ marginBottom: Spacing.md }}
        />

        <Pressable onPress={() => router.back()}>
          <Text style={{ color: Colors.muted, textAlign: 'center', fontSize: FontSize.sm }}>
            Already have an account?{' '}
            <Text style={{ color: Colors.accent, fontWeight: '600' }}>Sign In</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
