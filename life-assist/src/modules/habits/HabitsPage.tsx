import { Flame, Plus } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { useHabitsStore } from '@/store/useHabitsStore';
import { useUIStore } from '@/store/useUIStore';
import { HabitsDashboard } from './HabitsDashboard';
import { AddHabitModal } from './AddHabitModal';

export function HabitsPage() {
  const habits = useHabitsStore((s) => s.habits);
  const openModal = useUIStore((s) => s.openModal);

  return (
    <div className="pt-4">
      {habits.length === 0 ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-display font-semibold tracking-tight text-white">Habits</h1>
            <Button icon={<Plus size={16} />} onClick={() => openModal('addHabit')}>
              New habit
            </Button>
          </div>
          <EmptyState
            icon={<Flame size={32} />}
            title="No habits yet"
            hint="Add something you want to do regularly — a streak starts with day one."
          />
        </div>
      ) : (
        <HabitsDashboard />
      )}

      <AddHabitModal />
    </div>
  );
}
