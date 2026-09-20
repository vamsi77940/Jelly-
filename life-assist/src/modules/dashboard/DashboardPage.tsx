import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ListChecks, NotebookPen, BellRing, MessagesSquare, Flame, Target } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { formatDayGreeting } from '@/lib/time';
import { useTasksStore } from '@/store/useTasksStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useUIStore } from '@/store/useUIStore';
import { useHabitsStore } from '@/store/useHabitsStore';
import { useGoalsStore } from '@/store/useGoalsStore';
import { useCalendarStore } from '@/store/useCalendarStore';
import { useProgressStore } from '@/store/useProgressStore';
import { LevelCard } from './LevelCard';
import { JarvisPanel } from '@/components/JarvisPanel';

const QUICK_ACTIONS = [
  { label: 'New task', icon: ListChecks, modal: 'addTask' as const },
  { label: 'New note', icon: NotebookPen, modal: 'addNote' as const },
  { label: 'Set reminder', icon: BellRing, modal: 'addAlarm' as const },
];

import { toLocalDateString } from '@/lib/time';

function todayKey() {
  return toLocalDateString();
}

export function DashboardPage() {
  const tasks = useTasksStore((s) => s.tasks);
  const name = useSettingsStore((s) => s.profile.name);
  const openModal = useUIStore((s) => s.openModal);
  const navigate = useNavigate();

  const habits = useHabitsStore((s) => s.habits);
  const toggleHabitToday = useHabitsStore((s) => s.toggleToday);
  const goals = useGoalsStore((s) => s.goals);
  const goalProgress = useGoalsStore((s) => s.goalProgress);
  const events = useCalendarStore((s) => s.events);
  const addXp = useProgressStore((s) => s.addXp);

  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

  const today = todayKey();
  const todaysTasks = tasks.filter((t) => t.dueDate === today && !t.completed);
  const todaysEvents = events.filter((e) => e.date === today);
  const habitsDoneToday = habits.filter((h) => h.checkIns.includes(today)).length;

  return (
    <div className="space-y-6 pt-4">
      <JarvisPanel />

      <LevelCard />

      <Card className="relative overflow-hidden border border-cyan-500/20 bg-gradient-to-br from-base-panel/80 via-base-panel/40 to-cyan-950/20">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                Jelly OS
              </span>
            </div>
            <h1 className="text-2xl font-display font-bold tracking-tight text-white">
              {formatDayGreeting(new Date())}
              {name ? `, ${name}` : ''}
            </h1>
          </div>
          <div className="relative group shrink-0">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 opacity-70 blur-sm group-hover:opacity-100 transition duration-300 animate-pulse" />
            <img
              src="/jelly-logo.png"
              alt="Jelly"
              className="relative w-14 h-14 rounded-2xl object-cover border border-cyan-300/40 shadow-xl shadow-cyan-500/30"
            />
          </div>
        </div>

        <p className="text-ink-muted text-sm mb-6">
          {total === 0
            ? "You don't have any tasks yet — ask Jelly to plan your day."
            : `${completed} of ${total} tasks done today. Keep going.`}
        </p>

        <h2 className="text-xs uppercase tracking-wide text-ink-faint mb-2 font-semibold">Today's progress</h2>
        <ProgressBar value={percent} label="Today's task completion" />
        <div className="flex justify-between text-xs text-ink-muted mt-2 font-mono">
          <span>{completed} completed</span>
          <span>{total} total</span>
        </div>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {QUICK_ACTIONS.map(({ label, icon: Icon, modal }) => (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            key={label}
            onClick={() => openModal(modal)}
            className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-white/5 bg-base-panel/40 backdrop-blur-md hover:border-accent-cyan/40 hover:bg-white/5 transition-colors py-6 text-sm shadow-sm"
          >
            <Icon size={24} className="text-accent-cyan opacity-80 mb-1" />
            <span className="font-medium text-ink-primary tracking-wide">{label}</span>
          </motion.button>
        ))}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/assistant')}
          className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-white/5 bg-base-panel/40 backdrop-blur-md hover:border-accent-cyan/40 hover:bg-white/5 transition-colors py-6 text-sm shadow-sm relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-accent-cyan/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <MessagesSquare size={24} className="text-accent-cyan opacity-80 mb-1" />
          <span className="font-medium text-ink-primary tracking-wide">Ask assistant</span>
        </motion.button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-medium flex items-center gap-2">
              <Flame size={16} className="text-accent-amber" /> Habits today
            </h2>
            <button onClick={() => navigate('/habits')} className="text-xs text-accent-cyan">
              View all
            </button>
          </div>
          {habits.length === 0 ? (
            <p className="text-sm text-ink-muted">No habits tracked yet.</p>
          ) : (
            <>
              <p className="text-sm text-ink-muted mb-3">
                {habitsDoneToday} of {habits.length} checked off today
              </p>
              <div className="flex flex-wrap gap-2">
                {habits.map((h) => {
                  const done = h.checkIns.includes(today);
                  return (
                    <button
                      key={h.id}
                      onClick={() => {
                        toggleHabitToday(h.id);
                        if (!done) addXp(5);
                      }}
                      aria-pressed={done}
                      className={`text-xs px-2.5 py-1.5 rounded-full border transition-colors ${
                        done
                          ? 'bg-accent-cyanSoft border-accent-cyan/50 text-accent-cyan'
                          : 'border-base-border text-ink-muted'
                      }`}
                    >
                      {h.name}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-medium flex items-center gap-2">
              <Target size={16} className="text-accent-cyan" /> Goals
            </h2>
            <button onClick={() => navigate('/goals')} className="text-xs text-accent-cyan">
              View all
            </button>
          </div>
          {goals.length === 0 ? (
            <p className="text-sm text-ink-muted">No goals set yet.</p>
          ) : (
            <div className="space-y-3">
              {goals.slice(0, 3).map((g) => (
                <div key={g.id}>
                  <p className="text-sm mb-1 truncate">{g.title}</p>
                  <ProgressBar value={goalProgress(g)} label={`Progress toward ${g.title}`} />
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {(todaysTasks.length > 0 || todaysEvents.length > 0) && (
        <Card>
          <h2 className="font-medium mb-3">On today's calendar</h2>
          <ul className="space-y-1.5">
            {todaysTasks.map((t) => (
              <li key={t.id} className="flex items-center gap-2 text-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-accent-amber" />
                {t.title}
                {t.dueTime && <span className="text-ink-faint text-xs">at {t.dueTime}</span>}
              </li>
            ))}
            {todaysEvents.map((e) => {
              const dotColor =
                e.category === 'work'
                  ? 'bg-accent-indigo'
                  : e.category === 'personal'
                  ? 'bg-accent-mint'
                  : e.category === 'health'
                  ? 'bg-accent-rose'
                  : 'bg-accent-cyan';
              return (
                <li key={e.id} className="flex items-center gap-2 text-sm">
                  <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
                  {e.title}
                  {e.time && <span className="text-ink-faint text-xs">at {e.time}</span>}
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}
