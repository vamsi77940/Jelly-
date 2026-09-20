import { useEffect, useState } from 'react';
import { Plus, Target, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { useGoalsStore } from '@/store/useGoalsStore';
import { useUIStore } from '@/store/useUIStore';
import { GoalCard } from './GoalCard';
import { AddGoalModal } from './AddGoalModal';
import { AiSchedulePanel } from './AiSchedulePanel';
import type { Goal } from '@/types';

type Tab = 'weekly' | 'monthly' | 'ongoing';

const TABS: { id: Tab; label: string }[] = [
  { id: 'weekly',  label: '📅 Weekly' },
  { id: 'monthly', label: '🗓️ Monthly' },
  { id: 'ongoing', label: '🎯 Ongoing' },
];

function urgencyScore(g: Goal): number {
  const progress = g.milestones.length === 0 ? 100
    : Math.round((g.milestones.filter(m => m.completed).length / g.milestones.length) * 100);
  if (progress === 100) return 4; // complete → bottom
  let deadline: string | null = null;
  if (g.goalType === 'weekly') deadline = g.weekOf ? addDays(g.weekOf, 6) : null;
  else if (g.goalType === 'monthly') deadline = g.monthOf ? `${g.monthOf}-28` : null;
  else deadline = g.targetDate;
  if (!deadline) return 2;
  const days = Math.ceil((new Date(deadline + 'T23:59:59').getTime() - Date.now()) / 86400000);
  if (days < 0) return 0;    // overdue
  if (days <= 2) return 1;   // urgent
  return 2;                  // normal
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

export function GoalsPage() {
  const goals = useGoalsStore((s) => s.goals);
  const rescheduleOverdue = useGoalsStore((s) => s.rescheduleOverdue);
  const openModal = useUIStore((s) => s.openModal);
  const showToast = useUIStore((s) => s.showToast);

  const [activeTab, setActiveTab] = useState<Tab>('weekly');
  const [showSchedulePanel, setShowSchedulePanel] = useState(false);

  // Auto-reschedule overdue goals on mount
  useEffect(() => {
    const moved = rescheduleOverdue();
    if (moved.length > 0) {
      showToast(`${moved.length} overdue goal(s) rolled forward 🔄`, 'success');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visible = goals
    .filter((g) => !g.archived && g.goalType === activeTab)
    .sort((a, b) => urgencyScore(a) - urgencyScore(b));

  const counts = {
    weekly:  goals.filter(g => !g.archived && g.goalType === 'weekly').length,
    monthly: goals.filter(g => !g.archived && g.goalType === 'monthly').length,
    ongoing: goals.filter(g => !g.archived && g.goalType === 'ongoing').length,
  };

  return (
    <div className="space-y-6 pt-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-3xl font-display font-semibold tracking-tight">Goals</h1>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            icon={<Sparkles size={15} />}
            onClick={() => setShowSchedulePanel(true)}
          >
            AI Schedule
          </Button>
          <Button icon={<Plus size={16} />} onClick={() => openModal('addGoal')}>
            New goal
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-surface-card rounded-2xl border border-surface-stroke w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={[
              'px-4 py-2 rounded-xl text-sm font-medium transition-all relative',
              activeTab === tab.id
                ? 'bg-accent-cyan text-ink-inverse shadow'
                : 'text-ink-muted hover:text-ink-primary',
            ].join(' ')}
          >
            {tab.label}
            {counts[tab.id] > 0 && (
              <span className={[
                'ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                activeTab === tab.id ? 'bg-white/20' : 'bg-surface-stroke',
              ].join(' ')}>
                {counts[tab.id]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Goal grid */}
      {visible.length === 0 ? (
        <EmptyState
          icon={<Target size={32} />}
          title={`No ${activeTab} goals yet`}
          hint={
            activeTab === 'weekly'
              ? "Set weekly goals to track your week's focus."
              : activeTab === 'monthly'
              ? 'Set monthly goals to track bigger objectives.'
              : "Set ongoing goals for long-term projects."
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {visible.map((goal) => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
        </div>
      )}

      {/* Modals & panels */}
      <AddGoalModal />
      <AiSchedulePanel open={showSchedulePanel} onClose={() => setShowSchedulePanel(false)} />
    </div>
  );
}
