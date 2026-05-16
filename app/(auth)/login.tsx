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

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin() {
    setError('');
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) {
      setError(err.message);
    } else {
      router.replace('/(tabs)');
    }
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
        {/* Logo / title */}
        <View style={{ alignItems: 'center', marginBottom: Spacing['2xl'] }}>
          <Text style={{ fontSize: 48, marginBottom: Spacing.sm }}>💹</Text>
          <Text style={{ color: Colors.white, fontSize: FontSize['2xl'], fontWeight: '800' }}>
            Finance Tracker
          </Text>
          <Text style={{ color: Colors.muted, fontSize: FontSize.base, marginTop: 4 }}>
            Scientific. Minimal. Yours.
          </Text>
        </View>

        {/* Form */}
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
          placeholder="••••••••"
          containerStyle={{ marginBottom: Spacing.md }}
        />

        {error ? (
          <Text style={{ color: Colors.danger, fontSize: FontSize.sm, marginBottom: Spacing.md }}>
            {error}
          </Text>
        ) : null}

        <Button
          label="Sign In"
          onPress={handleLogin}
          loading={loading}
          fullWidth
          style={{ marginBottom: Spacing.md }}
        />

        <Pressable onPress={() => router.push('/(auth)/signup')}>
          <Text style={{ color: Colors.muted, textAlign: 'center', fontSize: FontSize.sm }}>
            Don't have an account?{' '}
            <Text style={{ color: Colors.accent, fontWeight: '600' }}>Sign Up</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
