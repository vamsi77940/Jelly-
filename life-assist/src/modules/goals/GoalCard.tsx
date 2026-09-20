import { Trash2, Calendar, RefreshCw, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { IconButton } from '@/components/ui/IconButton';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { formatShortDate } from '@/lib/time';
import { useGoalsStore } from '@/store/useGoalsStore';
import { useUIStore } from '@/store/useUIStore';
import { useProgressStore } from '@/store/useProgressStore';
import type { Goal } from '@/types';

/* ── helpers ── */
function getDaysRemaining(target: string | null): number | null {
  if (!target) return null;
  const now = new Date();
  const end = new Date(target + 'T23:59:59');
  return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function getWeekEnd(weekOf: string | null): string | null {
  if (!weekOf) return null;
  const d = new Date(weekOf + 'T00:00:00');
  d.setDate(d.getDate() + 6);
  return d.toISOString().split('T')[0];
}

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  weekly:  { label: 'WEEKLY',  color: 'bg-violet-500/20 text-violet-300 border-violet-500/30' },
  monthly: { label: 'MONTHLY', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  ongoing: { label: 'ONGOING', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
};

export function GoalCard({ goal }: { goal: Goal }) {
  const toggleMilestone = useGoalsStore((s) => s.toggleMilestone);
  const deleteGoal = useGoalsStore((s) => s.deleteGoal);
  const goalProgress = useGoalsStore((s) => s.goalProgress);
  const showToast = useUIStore((s) => s.showToast);
  const addXp = useProgressStore((s) => s.addXp);

  const progress = goalProgress(goal);
  const typeConf = TYPE_CONFIG[goal.goalType] ?? TYPE_CONFIG.ongoing;

  // Compute urgency
  let deadline: string | null = null;
  if (goal.goalType === 'weekly') deadline = getWeekEnd(goal.weekOf);
  else if (goal.goalType === 'monthly') deadline = goal.monthOf ? `${goal.monthOf}-28` : null;
  else deadline = goal.targetDate;

  const daysLeft = getDaysRemaining(deadline);
  const isOverdue  = daysLeft !== null && daysLeft < 0;
  const isUrgent   = daysLeft !== null && daysLeft >= 0 && daysLeft <= 2;
  const isComplete = progress === 100;

  // Card border glow
  const borderClass = isComplete
    ? 'ring-1 ring-emerald-500/40'
    : isOverdue
    ? 'ring-1 ring-red-500/50'
    : isUrgent
    ? 'ring-1 ring-amber-400/40'
    : '';

  return (
    <Card className={borderClass}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {/* Type badge */}
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${typeConf.color}`}>
              {typeConf.label}
            </span>
            {/* Urgency badge */}
            {isComplete && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border bg-emerald-500/20 text-emerald-300 border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 size={9} /> DONE
              </span>
            )}
            {isOverdue && !isComplete && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border bg-red-500/20 text-red-300 border-red-500/30 flex items-center gap-1">
                <AlertCircle size={9} /> OVERDUE
              </span>
            )}
            {isUrgent && !isOverdue && !isComplete && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border bg-amber-500/20 text-amber-300 border-amber-500/30 flex items-center gap-1">
                <Clock size={9} /> {daysLeft}d LEFT
              </span>
            )}
            {/* Auto-reschedule chip */}
            {goal.autoReschedule && !isComplete && (
              <span className="text-[10px] px-1.5 py-0.5 rounded border bg-surface-card border-surface-stroke text-ink-muted flex items-center gap-0.5">
                <RefreshCw size={8} /> auto
              </span>
            )}
          </div>
          <h3 className="font-semibold text-sm leading-snug">{goal.title}</h3>
        </div>
        <IconButton
          label={`Delete goal "${goal.title}"`}
          icon={<Trash2 size={14} />}
          onClick={() => { deleteGoal(goal.id); showToast('Goal deleted.'); }}
        />
      </div>

      {/* Date info */}
      {goal.goalType === 'weekly' && goal.weekOf && (
        <p className="text-xs text-ink-muted mb-2 flex items-center gap-1">
          <Calendar size={11} />
          Week of {formatShortDate(goal.weekOf)}
          {daysLeft !== null && daysLeft >= 0 && (
            <span className="ml-auto">{daysLeft}d remaining</span>
          )}
        </p>
      )}
      {goal.goalType === 'monthly' && goal.monthOf && (
        <p className="text-xs text-ink-muted mb-2 flex items-center gap-1">
          <Calendar size={11} />
          {goal.monthOf}
        </p>
      )}
      {goal.goalType === 'ongoing' && goal.targetDate && (
        <p className="text-xs text-ink-muted mb-2 flex items-center gap-1">
          <Calendar size={11} />
          Target: {formatShortDate(goal.targetDate)}
          {daysLeft !== null && daysLeft >= 0 && (
            <span className="ml-auto">{daysLeft}d remaining</span>
          )}
        </p>
      )}

      {/* Progress */}
      <ProgressBar value={progress} label={`Progress toward ${goal.title}`} />
      <p className="text-xs text-ink-muted mt-1.5 mb-3">{progress}% complete</p>

      {/* Milestones */}
      {goal.milestones.length > 0 && (
        <ul className="space-y-1.5">
          {goal.milestones.map((m) => (
            <li key={m.id}>
              <label className="flex items-center gap-2.5 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={m.completed}
                  onChange={() => {
                    toggleMilestone(goal.id, m.id);
                    if (!m.completed) addXp(10);
                  }}
                  className="h-4 w-4 accent-accent-cyan"
                />
                <span className={m.completed ? 'line-through text-ink-faint' : 'text-ink-primary'}>
                  {m.text}
                </span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
