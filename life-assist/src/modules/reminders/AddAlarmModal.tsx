import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Field, inputClass } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { useRemindersStore } from '@/store/useRemindersStore';
import { useUIStore } from '@/store/useUIStore';
import type { AlarmRepeat } from '@/types';

export function AddAlarmModal() {
  const isOpen = useUIStore((s) => s.activeModal === 'addAlarm');
  const closeModal = useUIStore((s) => s.closeModal);
  const showToast = useUIStore((s) => s.showToast);
  const addAlarm = useRemindersStore((s) => s.addAlarm);

  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  const [repeat, setRepeat] = useState<AlarmRepeat>('once');

  function reset() {
    setTitle('');
    setTime('');
    setRepeat('once');
  }

  function handleSubmit() {
    if (!title.trim() || !time) return;
    addAlarm({ title, time, repeat });
    showToast('Reminder set.', 'success');
    reset();
    closeModal();
  }

  return (
    <Modal
      title="New reminder"
      isOpen={isOpen}
      onClose={() => {
        reset();
        closeModal();
      }}
      footer={
        <>
          <Button variant="secondary" onClick={closeModal}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!title.trim() || !time}>
            Set reminder
          </Button>
        </>
      }
    >
      <Field label="Title" htmlFor="alarm-title">
        <input
          id="alarm-title"
          className={inputClass}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
        />
      </Field>
      <Field label="Time" htmlFor="alarm-time">
        <input
          id="alarm-time"
          type="time"
          className={inputClass}
          value={time}
          onChange={(e) => setTime(e.target.value)}
        />
      </Field>
      <Field label="Repeat" htmlFor="alarm-repeat">
        <select
          id="alarm-repeat"
          className={inputClass}
          value={repeat}
          onChange={(e) => setRepeat(e.target.value as AlarmRepeat)}
        >
          <option value="once">Once</option>
          <option value="daily">Daily</option>
          <option value="weekdays">Weekdays</option>
          <option value="weekends">Weekends</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
      </Field>
    </Modal>
  );
}
