import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Field, inputClass } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { useHabitsStore } from '@/store/useHabitsStore';
import { useUIStore } from '@/store/useUIStore';
import type { Habit } from '@/types';

const COLOR_OPTIONS: { value: Habit['color']; label: string; swatch: string }[] = [
  { value: 'cyan', label: 'Cyan', swatch: 'bg-accent-cyan' },
  { value: 'amber', label: 'Amber', swatch: 'bg-accent-amber' },
  { value: 'mint', label: 'Mint', swatch: 'bg-accent-mint' },
  { value: 'rose', label: 'Rose', swatch: 'bg-accent-rose' },
];

export function AddHabitModal() {
  const isOpen = useUIStore((s) => s.activeModal === 'addHabit');
  const closeModal = useUIStore((s) => s.closeModal);
  const showToast = useUIStore((s) => s.showToast);
  const addHabit = useHabitsStore((s) => s.addHabit);

  const [name, setName] = useState('');
  const [targetPerWeek, setTargetPerWeek] = useState(7);
  const [color, setColor] = useState<Habit['color']>('cyan');

  function reset() {
    setName('');
    setTargetPerWeek(7);
    setColor('cyan');
  }

  function handleSubmit() {
    if (!name.trim()) return;
    addHabit({ name, targetPerWeek, color });
    showToast('Habit added.', 'success');
    reset();
    closeModal();
  }

  return (
    <Modal
      title="New habit"
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
          <Button onClick={handleSubmit} disabled={!name.trim()}>
            Add habit
          </Button>
        </>
      }
    >
      <Field label="Name" htmlFor="habit-name">
        <input
          id="habit-name"
          className={inputClass}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Drink water, Read 20 minutes"
          autoFocus
        />
      </Field>
      <Field label="Times per week" htmlFor="habit-target">
        <input
          id="habit-target"
          type="number"
          min={1}
          max={7}
          className={inputClass}
          value={targetPerWeek}
          onChange={(e) => setTargetPerWeek(Math.min(7, Math.max(1, Number(e.target.value))))}
        />
      </Field>
      <fieldset>
        <legend className="block text-sm font-medium text-ink-muted mb-1.5">Color</legend>
        <div className="flex gap-2">
          {COLOR_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              aria-label={opt.label}
              aria-pressed={color === opt.value}
              onClick={() => setColor(opt.value)}
              className={`h-8 w-8 rounded-full ${opt.swatch} ${
                color === opt.value ? 'ring-2 ring-offset-2 ring-offset-base-panel ring-ink-primary' : ''
              }`}
            />
          ))}
        </div>
      </fieldset>
    </Modal>
  );
}
