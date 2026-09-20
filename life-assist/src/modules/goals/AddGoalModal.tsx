import { useState } from 'react';
import { Plus, X, RefreshCw, Calendar, Clock } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Field, inputClass } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { useGoalsStore } from '@/store/useGoalsStore';
import { useUIStore } from '@/store/useUIStore';
import type { GoalType } from '@/types';

const GOAL_TYPES: { value: GoalType; label: string; desc: string }[] = [
  { value: 'weekly', label: 'Weekly', desc: 'Resets / rolls forward each Monday' },
  { value: 'monthly', label: 'Monthly', desc: 'Tracked across a calendar month' },
  { value: 'ongoing', label: 'Ongoing', desc: 'No fixed cadence or deadline' },
];

/** Get the ISO Monday of the current week */
function thisMonday(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split('T')[0];
}

/** Current YYYY-MM */
function thisMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

export function AddGoalModal() {
  const isOpen = useUIStore((s) => s.activeModal === 'addGoal');
  const closeModal = useUIStore((s) => s.closeModal);
  const showToast = useUIStore((s) => s.showToast);
  const addGoal = useGoalsStore((s) => s.addGoal);

  const [title, setTitle] = useState('');
  const [goalType, setGoalType] = useState<GoalType>('ongoing');
  const [targetDate, setTargetDate] = useState('');
  const [weekOf, setWeekOf] = useState(thisMonday());
  const [monthOf, setMonthOf] = useState(thisMonth());
  const [autoReschedule, setAutoReschedule] = useState(true);
  const [milestones, setMilestones] = useState<string[]>(['']);

  function reset() {
    setTitle('');
    setGoalType('ongoing');
    setTargetDate('');
    setWeekOf(thisMonday());
    setMonthOf(thisMonth());
    setAutoReschedule(true);
    setMilestones(['']);
  }

  function updateMilestone(index: number, value: string) {
    setMilestones((prev) => prev.map((m, i) => (i === index ? value : m)));
  }

  function removeMilestone(index: number) {
    setMilestones((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit() {
    if (!title.trim()) return;
    addGoal({
      title,
      goalType,
      targetDate: goalType === 'ongoing' ? (targetDate || null) : null,
      weekOf: goalType === 'weekly' ? weekOf : null,
      monthOf: goalType === 'monthly' ? monthOf : null,
      milestoneTexts: milestones,
      autoReschedule: goalType !== 'ongoing' ? autoReschedule : false,
    });
    showToast('Goal added! 🎯', 'success');
    reset();
    closeModal();
  }

  return (
    <Modal
      title="New goal"
      isOpen={isOpen}
      onClose={() => { reset(); closeModal(); }}
      footer={
        <>
          <Button variant="secondary" onClick={closeModal}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!title.trim()}>Add goal</Button>
        </>
      }
    >
      {/* Goal type selector */}
      <div className="mb-4">
        <span className="block text-sm font-medium text-ink-muted mb-2">Goal type</span>
        <div className="grid grid-cols-3 gap-2">
          {GOAL_TYPES.map((gt) => (
            <button
              key={gt.value}
              type="button"
              onClick={() => setGoalType(gt.value)}
              className={[
                'rounded-xl border p-2.5 text-left transition-all text-xs',
                goalType === gt.value
                  ? 'border-accent-cyan bg-accent-cyan/10 text-accent-cyan font-semibold'
                  : 'border-surface-stroke text-ink-muted hover:border-accent-cyan/50',
              ].join(' ')}
            >
              <p className="font-semibold mb-0.5">{gt.label}</p>
              <p className="opacity-70 leading-tight">{gt.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <Field label="Title" htmlFor="goal-title">
        <input
          id="goal-title"
          className={inputClass}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
          placeholder="e.g. Finish Physics chapter 4"
        />
      </Field>

      {/* Date pickers — conditional on goal type */}
      {goalType === 'weekly' && (
        <Field label="Target week (Monday)" htmlFor="goal-week">
          <div className="relative">
            <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input
              id="goal-week"
              type="date"
              className={inputClass + ' pl-8'}
              value={weekOf}
              onChange={(e) => setWeekOf(e.target.value)}
            />
          </div>
        </Field>
      )}

      {goalType === 'monthly' && (
        <Field label="Target month" htmlFor="goal-month">
          <div className="relative">
            <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input
              id="goal-month"
              type="month"
              className={inputClass + ' pl-8'}
              value={monthOf}
              onChange={(e) => setMonthOf(e.target.value)}
            />
          </div>
        </Field>
      )}

      {goalType === 'ongoing' && (
        <Field label="Target date (optional)" htmlFor="goal-date">
          <input
            id="goal-date"
            type="date"
            className={inputClass}
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
          />
        </Field>
      )}

      {/* Auto-reschedule toggle — only for weekly/monthly */}
      {goalType !== 'ongoing' && (
        <div className="flex items-center justify-between rounded-xl border border-surface-stroke bg-surface-card p-3 mb-1">
          <div>
            <p className="text-sm font-medium text-ink-primary flex items-center gap-1.5">
              <RefreshCw size={13} className="text-accent-cyan" />
              Auto-reschedule
            </p>
            <p className="text-xs text-ink-muted mt-0.5">
              Roll incomplete goal to next {goalType === 'weekly' ? 'week' : 'month'} automatically
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAutoReschedule((v) => !v)}
            className={[
              'relative w-10 h-5 rounded-full transition-colors flex-shrink-0',
              autoReschedule ? 'bg-accent-cyan' : 'bg-surface-stroke',
            ].join(' ')}
          >
            <span
              className={[
                'absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform',
                autoReschedule ? 'translate-x-5' : 'translate-x-0',
              ].join(' ')}
            />
          </button>
        </div>
      )}

      {/* Milestones */}
      <div>
        <span className="block text-sm font-medium text-ink-muted mb-1.5">Milestones (optional)</span>
        <div className="space-y-2">
          {milestones.map((m, i) => (
            <div key={i} className="flex gap-2">
              <input
                className={inputClass}
                value={m}
                onChange={(e) => updateMilestone(i, e.target.value)}
                placeholder={`Milestone ${i + 1}`}
              />
              {milestones.length > 1 && (
                <IconButton
                  label={`Remove milestone ${i + 1}`}
                  icon={<X size={15} />}
                  onClick={() => removeMilestone(i)}
                />
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setMilestones((prev) => [...prev, ''])}
          className="mt-2 inline-flex items-center gap-1.5 text-sm text-accent-cyan"
        >
          <Plus size={14} /> Add milestone
        </button>
      </div>
    </Modal>
  );
}
