import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Field, inputClass } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { useCalendarStore } from '@/store/useCalendarStore';
import { useUIStore } from '@/store/useUIStore';
import type { EventCategory } from '@/types';

interface AddEventModalProps {
  defaultDate: string;
}

export function AddEventModal({ defaultDate }: AddEventModalProps) {
  const isOpen = useUIStore((s) => s.activeModal === 'addEvent');
  const modalPayload = useUIStore((s) => s.modalPayload);
  const closeModal = useUIStore((s) => s.closeModal);
  const showToast = useUIStore((s) => s.showToast);
  const addEvent = useCalendarStore((s) => s.addEvent);

  const [title, setTitle] = useState('');
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState('');
  const [category, setCategory] = useState<EventCategory>('other');

  useEffect(() => {
    if (isOpen) {
      if (modalPayload && typeof modalPayload === 'object') {
        const payload = modalPayload as { date?: string; time?: string };
        if (payload.date) setDate(payload.date);
        if (payload.time) setTime(payload.time);
      } else if (typeof modalPayload === 'string') {
        setDate(modalPayload);
      } else {
        setDate(defaultDate);
      }
    }
  }, [isOpen, defaultDate, modalPayload]);

  function reset() {
    setTitle('');
    setTime('');
    setCategory('other');
  }

  function handleSubmit() {
    if (!title.trim() || !date) return;
    addEvent({ title, date, time: time || null, category });
    showToast('Event added.', 'success');
    reset();
    closeModal();
  }

  return (
    <Modal
      title="New event"
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
          <Button onClick={handleSubmit} disabled={!title.trim() || !date}>
            Add event
          </Button>
        </>
      }
    >
      <Field label="Title" htmlFor="event-title">
        <input
          id="event-title"
          className={inputClass}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Date" htmlFor="event-date">
          <input
            id="event-date"
            type="date"
            className={inputClass}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </Field>
        <Field label="Time (optional)" htmlFor="event-time">
          <input
            id="event-time"
            type="time"
            className={inputClass}
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </Field>
      </div>
      <Field label="Category" htmlFor="event-category">
        <select
          id="event-category"
          className={inputClass}
          value={category}
          onChange={(e) => setCategory(e.target.value as EventCategory)}
        >
          <option value="other">Other / General</option>
          <option value="work">Work</option>
          <option value="personal">Personal</option>
          <option value="health">Health &amp; Wellness</option>
        </select>
      </Field>
    </Modal>
  );
}
