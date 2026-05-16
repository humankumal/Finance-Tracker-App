import React, { useEffect, useRef, useState } from 'react';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { AppState, AppStateStatus, View, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../lib/store/authStore';
import { registerForPushNotifications, scheduleMonthlySummary } from '../lib/notifications';
import { processRecurringTransactions } from '../lib/recurringProcessor';
import { isBiometricAvailable, getBiometricEnabled, authenticateWithBiometrics } from '../lib/biometric';
import { Colors } from '../constants/theme';
import '../global.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 2, retry: 1 },
  },
});

export default function RootLayout() {
  const { setSession, session } = useAuthStore();
  const [locked, setLocked] = useState(false);
  const appState = useRef<AppStateStatus>(AppState.currentState);

  // Handle biometric lock on app resume
  useEffect(() => {
    const sub = AppState.addEventListener('change', async (nextState) => {
      const wasBackground = appState.current.match(/inactive|background/);
      appState.current = nextState;

      if (nextState === 'active' && wasBackground && session) {
        const enabled = await getBiometricEnabled();
        const available = await isBiometricAvailable();
        if (enabled && available) {
          setLocked(true);
          const ok = await authenticateWithBiometrics();
          if (ok) setLocked(false);
        }
      }
    });
    return () => sub.remove();
  }, [session]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s) {
        registerForPushNotifications();
        scheduleMonthlySummary();
        processRecurringTransactions(s.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [setSession]);

  if (locked) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={Colors.accent} size="large" />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }} />
    </QueryClientProvider>
  );
}
