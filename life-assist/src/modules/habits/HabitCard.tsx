import { Trash2, Flame } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { IconButton } from '@/components/ui/IconButton';
import { useHabitsStore } from '@/store/useHabitsStore';
import { useUIStore } from '@/store/useUIStore';
import { useProgressStore } from '@/store/useProgressStore';
import type { Habit } from '@/types';

const COLOR_CLASSES: Record<Habit['color'], string> = {
  cyan: 'bg-accent-cyan',
  amber: 'bg-accent-amber',
  mint: 'bg-accent-mint',
  rose: 'bg-accent-rose',
};

import { toLocalDateString } from '@/lib/time';

function todayKey(): string {
  return toLocalDateString();
}

export function HabitCard({ habit }: { habit: Habit }) {
  const toggleToday = useHabitsStore((s) => s.toggleToday);
  const deleteHabit = useHabitsStore((s) => s.deleteHabit);
  const weeklyProgress = useHabitsStore((s) => s.weeklyProgress);
  const currentStreak = useHabitsStore((s) => s.currentStreak);
  const showToast = useUIStore((s) => s.showToast);
  const addXp = useProgressStore((s) => s.addXp);

  const doneToday = habit.checkIns.includes(todayKey());
  const progress = weeklyProgress(habit);
  const streak = currentStreak(habit);

  return (
    <Card className="flex items-center gap-4">
      <button
        onClick={() => {
          toggleToday(habit.id);
          if (!doneToday) {
            addXp(5);
            showToast(`${habit.name} checked off for today.`, 'success');
          }
        }}
        aria-pressed={doneToday}
        aria-label={`Mark "${habit.name}" ${doneToday ? 'not done' : 'done'} for today`}
        className={`h-11 w-11 shrink-0 rounded-full flex items-center justify-center border-2 transition-colors ${
          doneToday ? `${COLOR_CLASSES[habit.color]} border-transparent` : 'border-base-border text-ink-faint'
        }`}
      >
        {doneToday && <span className="h-3 w-3 rounded-full bg-base-bg" aria-hidden="true" />}
      </button>

      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{habit.name}</p>
        <div className="flex items-center gap-3 mt-1">
          <div className="flex gap-1" aria-hidden="true">
            {Array.from({ length: habit.targetPerWeek }).map((_, i) => (
              <span
                key={i}
                className={`h-1.5 w-4 rounded-full ${
                  i < progress ? COLOR_CLASSES[habit.color] : 'bg-base-border'
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-ink-muted">
            {progress}/{habit.targetPerWeek} this week
          </span>
          {streak > 0 && (
            <span className="flex items-center gap-1 text-xs text-accent-amber">
              <Flame size={12} /> {streak}
            </span>
          )}
        </div>
      </div>

      <IconButton
        label={`Delete habit "${habit.name}"`}
        icon={<Trash2 size={16} />}
        onClick={() => {
          deleteHabit(habit.id);
          showToast('Habit deleted.');
        }}
      />
    </Card>
  );
}
