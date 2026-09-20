import { Timer } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { useFocusStore } from '@/store/useFocusStore';
import { PomodoroTimer } from './PomodoroTimer';

export function FocusPage() {
  const sessionsToday = useFocusStore((s) => s.sessionsToday());

  return (
    <div className="space-y-6 max-w-lg mx-auto pt-4">
      <h1 className="text-3xl font-display font-semibold text-center tracking-tight">Focus Mode</h1>

      <Card className="flex items-center justify-center gap-3 text-sm text-ink-muted">
        <Timer size={16} className="text-accent-cyan" />
        {sessionsToday === 0
          ? 'No focus sessions logged yet today.'
          : `${sessionsToday} focus session${sessionsToday === 1 ? '' : 's'} completed today.`}
      </Card>

      <PomodoroTimer />
    </div>
  );
}
