import { useEffect, useRef } from 'react';
import { useScheduleStore } from '@/store/useScheduleStore';
import { useUIStore } from '@/store/useUIStore';

/**
 * Checks every 60 s for schedule blocks starting within the next 10 minutes.
 * Fires an in-app toast and, if permission granted, a native browser notification.
 */
export function useScheduleNotifier() {
  const firedRef = useRef<Set<string>>(new Set());
  const getBlocksForDate = useScheduleStore((s) => s.getBlocksForDate);
  const showToast = useUIStore((s) => s.showToast);

  useEffect(() => {
    function check() {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      const blocks = getBlocksForDate(todayStr);

      for (const block of blocks) {
        if (block.done) continue;
        const [bh, bm] = block.startTime.split(':').map(Number);
        const blockMinutes = bh * 60 + bm;
        const diff = blockMinutes - currentMinutes;

        // Fire at 10 min and 2 min before
        const fireKey10 = `${block.id}-10`;
        const fireKey2  = `${block.id}-2`;

        if (diff > 0 && diff <= 10 && !firedRef.current.has(fireKey10)) {
          firedRef.current.add(fireKey10);
          const msg = `⏰ "${block.title}" starts in ${diff} min`;
          showToast(msg, 'default');
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Jelly — Upcoming Block', { body: msg, icon: '/jelly-logo.png' });
          }
        }

        if (diff > 0 && diff <= 2 && !firedRef.current.has(fireKey2)) {
          firedRef.current.add(fireKey2);
          const msg = `🚀 "${block.title}" starts now!`;
          showToast(msg, 'success');
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Jelly — Starting Now', { body: msg, icon: '/jelly-logo.png' });
          }
        }
      }
    }

    check(); // run immediately
    const id = setInterval(check, 60_000);
    return () => clearInterval(id);
  }, [getBlocksForDate, showToast]);
}
