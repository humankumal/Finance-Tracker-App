import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BIOMETRIC_ENABLED_KEY = '@biometric_enabled';

export async function isBiometricAvailable(): Promise<boolean> {
  const compatible = await LocalAuthentication.hasHardwareAsync();
  if (!compatible) return false;
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  return enrolled;
}

export async function getBiometricEnabled(): Promise<boolean> {
  const val = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
  return val === 'true';
}

export async function setBiometricEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, enabled ? 'true' : 'false');
}

/**
 * Prompt Face ID / fingerprint. Returns true if authenticated.
 */
export async function authenticateWithBiometrics(): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Authenticate to open Finance Tracker',
    fallbackLabel: 'Use passcode',
    cancelLabel: 'Cancel',
    disableDeviceFallback: false,
  });
  return result.success;
}
