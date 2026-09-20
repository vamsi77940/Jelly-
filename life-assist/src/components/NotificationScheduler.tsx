import { useEffect } from 'react';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useNotificationLogStore } from '@/store/useNotificationLogStore';
import { useDailyContext } from '@/lib/jarvis/contextBuilder';
import { generateSuggestions } from '@/lib/jarvis/suggestionRules';
import { isWithinQuietHours } from '@/lib/notifications/quietHours';
import { getNotificationPermissionState, showOsNotification } from '@/lib/notifications/permissions';
import { useNudgesStore } from '@/store/useNudgesStore';

const CHECK_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes
const MAX_OS_NOTIFICATIONS_PER_DAY = 3; // same cap as the in-app panel — one source of "don't spam"

export function NotificationScheduler() {
  const settings = useSettingsStore((s) => s.settings);
  const ctx = useDailyContext();
  const dismissedToday = useNudgesStore((s) => s.dismissedToday());
  const sentToday = useNotificationLogStore((s) => s.sentToday());
  const countToday = useNotificationLogStore((s) => s.countToday());
  const markSent = useNotificationLogStore((s) => s.markSent);

  useEffect(() => {
    function tick() {
      if (!settings.notificationsEnabled) return;
      if (getNotificationPermissionState() !== 'granted') return;
      if (isWithinQuietHours(new Date(), settings.quietHoursStart, settings.quietHoursEnd)) return;
      if (countToday >= MAX_OS_NOTIFICATIONS_PER_DAY) return;

      // Only the single most important, not-yet-dismissed, not-yet-sent
      // suggestion becomes a real notification — everything else stays
      // in-app only. This is deliberately conservative: a real OS
      // notification is a much bigger interruption than an in-app card.
      const [top] = generateSuggestions(ctx, settings.assistantTone, dismissedToday, 1);
      if (!top || top.priority !== 'high') return;
      if (sentToday.has(top.id)) return;

      void showOsNotification('Jelly', top.text, top.id);
      markSent(top.id);
    }

    tick(); // check once on mount too, not only after the first interval
    const id = setInterval(tick, CHECK_INTERVAL_MS);
    return () => clearInterval(id);
  }, [settings, ctx, dismissedToday, sentToday, countToday, markSent]);

  return null;
}
