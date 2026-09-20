import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { IconButton } from '@/components/ui/IconButton';
import { Modal } from '@/components/ui/Modal';
import { Field, inputClass } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { useRemindersStore } from '@/store/useRemindersStore';
import { useUIStore } from '@/store/useUIStore';

export function MorningAlarmCard() {
  const morningAlarm = useRemindersStore((s) => s.morningAlarm);
  const setMorningAlarmTime = useRemindersStore((s) => s.setMorningAlarmTime);
  const toggleMorningAlarm = useRemindersStore((s) => s.toggleMorningAlarm);
  const showToast = useUIStore((s) => s.showToast);

  const [editing, setEditing] = useState(false);
  const [draftTime, setDraftTime] = useState(morningAlarm.time);

  return (
    <>
      <Card className="flex items-center justify-between">
        <div>
          <h3 className="text-xs uppercase tracking-wide text-ink-faint mb-1">Morning alarm</h3>
          <p className="text-2xl font-mono font-medium tabular-nums">{morningAlarm.time}</p>
          <p className="text-xs text-ink-muted">Every day</p>
        </div>
        <div className="flex items-center gap-2">
          <IconButton
            label="Edit morning alarm time"
            icon={<Pencil size={16} />}
            onClick={() => {
              setDraftTime(morningAlarm.time);
              setEditing(true);
            }}
          />
          <label className="inline-flex items-center cursor-pointer">
            <span className="sr-only">Toggle morning alarm</span>
            <input
              type="checkbox"
              checked={morningAlarm.enabled}
              onChange={(e) => {
                toggleMorningAlarm(e.target.checked);
                showToast(`Morning alarm is now ${e.target.checked ? 'on' : 'off'}.`);
              }}
              className="sr-only peer"
            />
            <div className="relative w-11 h-6 bg-base-border rounded-full peer peer-checked:bg-accent-cyan transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
          </label>
        </div>
      </Card>

      <Modal
        title="Edit morning alarm"
        isOpen={editing}
        onClose={() => setEditing(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setMorningAlarmTime(draftTime);
                setEditing(false);
                showToast('Morning alarm updated.', 'success');
              }}
            >
              Save
            </Button>
          </>
        }
      >
        <Field label="Time" htmlFor="morning-alarm-time">
          <input
            id="morning-alarm-time"
            type="time"
            className={inputClass}
            value={draftTime}
            onChange={(e) => setDraftTime(e.target.value)}
            autoFocus
          />
        </Field>
      </Modal>
    </>
  );
}
