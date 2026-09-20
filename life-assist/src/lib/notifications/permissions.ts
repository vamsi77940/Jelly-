export type NotificationPermissionState = 'unsupported' | 'default' | 'granted' | 'denied';

export function getNotificationPermissionState(): NotificationPermissionState {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission as NotificationPermissionState;
}

/** Must be called from a click handler — browsers reject permission requests without a user gesture. */
export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (!('Notification' in window)) return 'unsupported';
  const result = await Notification.requestPermission();
  return result as NotificationPermissionState;
}

/** Shows a real OS notification via the service worker, so it can appear even when the tab isn't focused. */
export async function showOsNotification(title: string, body: string, tag: string): Promise<void> {
  if (!('serviceWorker' in navigator)) return;
  const registration = await navigator.serviceWorker.ready;
  await registration.showNotification(title, {
    body,
    tag, // same tag replaces rather than stacking duplicate notifications
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
  });
}
