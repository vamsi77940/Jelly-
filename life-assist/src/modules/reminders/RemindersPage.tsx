import { Plus, BellRing, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useRemindersStore } from '@/store/useRemindersStore';
import { useUIStore } from '@/store/useUIStore';
import { MorningAlarmCard } from './MorningAlarmCard';
import { AddAlarmModal } from './AddAlarmModal';

const REPEAT_LABEL: Record<string, string> = {
  once: 'Once',
  daily: 'Daily',
  weekdays: 'Weekdays',
  weekends: 'Weekends',
  weekly: 'Weekly',
  monthly: 'Monthly',
};

export function RemindersPage() {
  const alarms = useRemindersStore((s) => s.alarms);
  const toggleAlarm = useRemindersStore((s) => s.toggleAlarm);
  const deleteAlarm = useRemindersStore((s) => s.deleteAlarm);
  const openModal = useUIStore((s) => s.openModal);
  const showToast = useUIStore((s) => s.showToast);

  return (
    <div className="space-y-6 pt-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-display font-semibold tracking-tight">Reminders</h1>
        <Button icon={<Plus size={16} />} onClick={() => openModal('addAlarm')}>
          New reminder
        </Button>
      </div>

      <div className="mb-8">
        <MorningAlarmCard />
      </div>

      <h2 className="text-sm font-medium text-ink-muted mb-3">Task &amp; custom reminders</h2>
      {alarms.length === 0 ? (
        <EmptyState
          icon={<BellRing size={32} />}
          title="No reminders set"
          hint="Add a reminder here, or check 'also set a reminder' when creating a task."
        />
      ) : (
        <div className="space-y-2.5">
          {alarms.map((alarm) => (
            <div
              key={alarm.id}
              className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-base-panel/40 backdrop-blur-md shadow-glass px-4 py-3.5"
            >
              <div>
                <p className="font-medium">{alarm.title}</p>
                <p className="text-xs text-ink-muted font-mono">
                  {alarm.time} · {REPEAT_LABEL[alarm.repeat]}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <label className="inline-flex items-center cursor-pointer mr-1">
                  <span className="sr-only">Toggle reminder "{alarm.title}"</span>
                  <input
                    type="checkbox"
                    checked={alarm.enabled}
                    onChange={() => toggleAlarm(alarm.id)}
                    className="sr-only peer"
                  />
                  <div className="relative w-9 h-5 bg-base-border rounded-full peer peer-checked:bg-accent-cyan transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
                </label>
                <IconButton
                  label={`Delete reminder "${alarm.title}"`}
                  icon={<Trash2 size={16} />}
                  onClick={() => {
                    deleteAlarm(alarm.id);
                    showToast('Reminder deleted.');
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <AddAlarmModal />
    </div>
  );
}
