import { useEffect } from 'react';
import { useRemindersStore } from '@/store/useRemindersStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { getNotificationPermissionState, showOsNotification } from '@/lib/notifications/permissions';
import { isWithinQuietHours } from '@/lib/notifications/quietHours';

export function AlarmScheduler() {
  const alarms = useRemindersStore((s) => s.alarms);
  const morningAlarm = useRemindersStore((s) => s.morningAlarm);
  const settings = useSettingsStore((s) => s.settings);

  useEffect(() => {
    // We check every minute to see if it's time to fire an alarm
    // To prevent firing multiple times for the same minute, we track fired times locally
    const fired = new Set<string>();

    function tick() {
      if (!settings.notificationsEnabled) return;
      if (getNotificationPermissionState() !== 'granted') return;
      if (isWithinQuietHours(new Date(), settings.quietHoursStart, settings.quietHoursEnd)) return;

      const now = new Date();
      const currentH = now.getHours().toString().padStart(2, '0');
      const currentM = now.getMinutes().toString().padStart(2, '0');
      const timeStr = `${currentH}:${currentM}`;

      // Morning Alarm
      if (morningAlarm.enabled && morningAlarm.time === timeStr) {
        const key = `morning-${now.toDateString()}`;
        if (!fired.has(key)) {
          void showOsNotification('Morning Alarm', 'Time to wake up and start your day!', key);
          fired.add(key);
        }
      }

      // Custom Alarms
      for (const alarm of alarms) {
        if (!alarm.enabled) continue;
        if (alarm.time !== timeStr) continue;

        let shouldFire = false;
        const dayOfWeek = now.getDay(); // 0 (Sun) to 6 (Sat)
        const dateOfMonth = now.getDate();

        if (alarm.repeat === 'daily') {
          shouldFire = true;
        } else if (alarm.repeat === 'weekdays' && dayOfWeek >= 1 && dayOfWeek <= 5) {
          shouldFire = true;
        } else if (alarm.repeat === 'weekends' && (dayOfWeek === 0 || dayOfWeek === 6)) {
          shouldFire = true;
        } else if (alarm.repeat === 'once') {
          // Fire if it hasn't fired yet
          shouldFire = true;
        } else if (alarm.repeat === 'weekly') {
          const createdDay = new Date(alarm.createdAt || Date.now()).getDay();
          shouldFire = dayOfWeek === createdDay;
        } else if (alarm.repeat === 'monthly') {
          const createdDate = new Date(alarm.createdAt || Date.now()).getDate();
          shouldFire = dateOfMonth === createdDate;
        }

        if (shouldFire) {
          const key = `alarm-${alarm.id}-${now.toDateString()}`;
          if (!fired.has(key)) {
            void showOsNotification('LifeAssist Alarm', alarm.title, key);
            fired.add(key);

            // If it's a one-time alarm, disable it after firing
            if (alarm.repeat === 'once') {
              useRemindersStore.getState().toggleAlarm(alarm.id);
            }
          }
        }
      }
    }

    tick();
    const interval = setInterval(tick, 30 * 1000); // run every 30s so we don't miss a minute
    return () => clearInterval(interval);
  }, [alarms, morningAlarm, settings]);

  return null;
}
