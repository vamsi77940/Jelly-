import { useSettingsStore } from '@/store/useSettingsStore';

export function formatClock(date: Date): string {
  const is24h = useSettingsStore.getState().settings.timeFormat === '24h';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: !is24h });
}

export function formatDayGreeting(date: Date): string {
  const hour = date.getHours();
  if (hour < 5) return 'Still up late';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Good night, almost';
}

export function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function formatFullDateTime(iso: string): string {
  const is24h = useSettingsStore.getState().settings.timeFormat === '24h';
  return new Date(iso).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: !is24h
  });
}

export function formatTimeString(time: string): string {
  // time is expected to be "HH:mm"
  const is24h = useSettingsStore.getState().settings.timeFormat === '24h';
  if (is24h) return time;

  const [h, m] = time.split(':');
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${m} ${ampm}`;
}

export function isSameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function toLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isOverdue(dueDate: string | null, dueTime: string | null): boolean {
  if (!dueDate) return false;
  const due = new Date(`${dueDate}T${dueTime || '23:59'}`);
  return due.getTime() < Date.now();
}
