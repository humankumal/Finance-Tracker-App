import { Redirect } from 'expo-router';
import { useAuthStore } from '../lib/store/authStore';
import { View, ActivityIndicator } from 'react-native';
import { Colors } from '../constants/theme';

export default function Index() {
  const { session, user, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={Colors.accent} size="large" />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  // New users who haven't completed onboarding go to the wizard
  const isOnboarded = user?.user_metadata?.onboarded === true;
  return isOnboarded ? <Redirect href="/(tabs)" /> : <Redirect href="/onboarding" />;
}
