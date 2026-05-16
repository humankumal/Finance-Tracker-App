import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { BudgetSummary } from '../types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/** Request permission and return the Expo push token (or null). */
export async function registerForPushNotifications(): Promise<string | null> {
  if (Platform.OS === 'web') return null;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  try {
    const token = await Notifications.getExpoPushTokenAsync();
    return token.data;
  } catch {
    return null;
  }
}

/** Send a local notification immediately. */
export async function sendLocalNotification(title: string, body: string) {
  await Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: null, // fire immediately
  });
}

/**
 * Check budget summaries and fire local alerts for any category that
 * has crossed 80% or 100% of its monthly budget.
 * Skips categories with no budget set (budget_amount === 0).
 */
export async function checkBudgetAlerts(summaries: BudgetSummary[]) {
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') return;

  for (const s of summaries) {
    if (s.budgeted === 0) continue;
    const pct = s.spent / s.budgeted;

    if (pct >= 1) {
      await sendLocalNotification(
        `🚨 Over budget: ${s.category.name}`,
        `You've spent $${s.spent.toFixed(0)} of your $${s.budgeted.toFixed(0)} ${s.category.name} budget.`,
      );
    } else if (pct >= 0.8) {
      await sendLocalNotification(
        `⚠️ Budget alert: ${s.category.name}`,
        `${Math.round(pct * 100)}% used — $${(s.budgeted - s.spent).toFixed(0)} remaining this month.`,
      );
    }
  }
}

/** Schedule a monthly summary notification on the 1st of next month at 9am. */
export async function scheduleMonthlySummary() {
  if (Platform.OS === 'web') return;

  // Cancel any existing monthly summary
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of scheduled) {
    if ((n.content.data as Record<string, unknown>)?.type === 'monthly_summary') {
      await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }
  }

  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1, 9, 0, 0);

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '📊 Monthly Finance Summary Ready',
      body: 'Open Finance Tracker to review your spending, savings rate, and 50/30/20 score.',
      data: { type: 'monthly_summary' },
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: next },
  });
}
