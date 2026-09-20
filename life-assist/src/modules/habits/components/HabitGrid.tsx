import { useMemo, useCallback, memo } from 'react';
import { motion } from 'framer-motion';
import { Check, Trash2 } from 'lucide-react';
import { useHabitsStore } from '@/store/useHabitsStore';
import { useProgressStore } from '@/store/useProgressStore';
import { useUIStore } from '@/store/useUIStore';
import { toLocalDateString } from '@/lib/time';
import { Card } from '@/components/ui/Card';
import type { Habit } from '@/types';

// Returns conditional formatting classes for percentage cells to match the sheet color scale
function getPercentageClass(pct: number) {
  if (pct === 0) {
    return 'bg-slate-950/60 text-slate-500 border border-slate-900/80';
  }
  if (pct <= 25) {
    return 'bg-emerald-950/40 text-emerald-400 border border-emerald-950/50 shadow-[0_0_6px_rgba(16,185,129,0.1)]';
  }
  if (pct <= 50) {
    return 'bg-emerald-900/50 text-emerald-300 border border-emerald-900/60 shadow-[0_0_8px_rgba(16,185,129,0.15)]';
  }
  if (pct <= 75) {
    return 'bg-emerald-800/60 text-emerald-200 border border-emerald-800/70 shadow-[0_0_10px_rgba(16,185,129,0.2)]';
  }
  if (pct < 100) {
    return 'bg-emerald-700/70 text-emerald-100 border border-emerald-600/70 shadow-[0_0_12px_rgba(16,185,129,0.25)]';
  }
  return 'bg-emerald-500 text-slate-950 font-black border border-emerald-400 shadow-[0_0_14px_rgba(16,185,129,0.55)]';
}

const COLOR_MAP: Record<Habit['color'], { dot: string; glow: string }> = {
  cyan: { dot: 'bg-accent-cyan', glow: 'shadow-[0_0_8px_rgba(34,211,238,0.4)]' },
  amber: { dot: 'bg-accent-amber', glow: 'shadow-[0_0_8px_rgba(251,191,36,0.4)]' },
  mint: { dot: 'bg-accent-mint', glow: 'shadow-[0_0_8px_rgba(52,211,153,0.4)]' },
  rose: { dot: 'bg-accent-rose', glow: 'shadow-[0_0_8px_rgba(251,113,133,0.4)]' },
};

// Memoized grid cell to avoid re-rendering all 31*N cells on a single toggle
const GridCell = memo(function GridCell({
  isCompleted,
  habitName,
  dateStr,
  onToggle,
}: {
  isCompleted: boolean;
  habitName: string;
  dateStr: string;
  onToggle: (dateStr: string) => void;
}) {
  return (
    <div className="w-11 shrink-0 flex items-center justify-center border-r border-white/[0.015]">
      <motion.button
        onClick={() => onToggle(dateStr)}
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.85 }}
        className={`h-[24px] w-[24px] rounded-[5px] border flex items-center justify-center transition-all ${
          isCompleted
            ? 'bg-emerald-500 border-transparent text-slate-950 shadow-[0_0_10px_rgba(16,185,129,0.5)]'
            : 'border-slate-800 bg-slate-950/40 hover:border-slate-600 hover:bg-slate-900/60'
        }`}
        aria-label={`Toggle ${habitName} for ${dateStr}`}
      >
        {isCompleted && (
          <motion.div
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 15 }}
          >
            <Check size={14} className="stroke-[3.5]" />
          </motion.div>
        )}
      </motion.button>
    </div>
  );
});

export function HabitGrid() {
  const habits = useHabitsStore((s) => s.habits);
  const toggleDate = useHabitsStore((s) => s.toggleDate);
  const deleteHabit = useHabitsStore((s) => s.deleteHabit);
  const currentStreak = useHabitsStore((s) => s.currentStreak);
  const addXp = useProgressStore((s) => s.addXp);
  const showToast = useUIStore((s) => s.showToast);

  // Get days in the current month
  const daysInMonth = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const totalDays = new Date(year, month + 1, 0).getDate();
    
    return Array.from({ length: totalDays }, (_, i) => {
      const date = new Date(year, month, i + 1);
      return {
        date,
        dayNum: i + 1,
        dateStr: toLocalDateString(date),
      };
    });
  }, []);

  const monthName = useMemo(() => {
    return new Date().toLocaleString('default', { month: 'long' });
  }, []);

  // Compute stats for each day
  const dailyStats = useMemo(() => {
    if (habits.length === 0) return {};
    const stats: Record<string, number> = {};
    daysInMonth.forEach(({ dateStr }) => {
      const completed = habits.filter((h) => h.checkIns.includes(dateStr)).length;
      stats[dateStr] = habits.length > 0 ? Math.round((completed / habits.length) * 100) : 0;
    });
    return stats;
  }, [habits, daysInMonth]);

  const handleCellToggle = useCallback((habit: Habit, dateStr: string) => {
    const isDone = habit.checkIns.includes(dateStr);
    toggleDate(habit.id, dateStr);
    
    if (!isDone) {
      addXp(5);
      showToast(`${habit.name} completed! (+5 XP)`, 'success');
    } else {
      showToast(`${habit.name} unchecked.`, 'default');
    }
  }, [toggleDate, addXp, showToast]);

  return (
    <Card className="w-full overflow-hidden p-6 bg-slate-950/40 border-slate-900/80 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
      {/* Top dashboard title metadata */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-white tracking-tight">Consistency Grid</h2>
          <p className="text-xs text-ink-muted">Month: {monthName} {new Date().getFullYear()}</p>
        </div>
      </div>

      {/* Main Grid Viewport: Flex Container with Sticky Sidebar + Scrollable Grid */}
      <div className="relative flex border border-white/5 rounded-xl bg-slate-950/20 overflow-hidden">
        
        {/* Left Side: Sticky Habits Sidebar */}
        <div className="sticky left-0 w-80 shrink-0 bg-slate-950/95 backdrop-blur-md border-r border-white/5 z-20 flex flex-col">
          {/* Header Row */}
          <div className="h-20 flex flex-col justify-end pb-3 px-4 border-b border-white/5 font-semibold text-xs text-slate-400">
            <div>Habit Details</div>
            <div className="text-[10px] text-slate-500 font-normal mt-0.5">Streak & Monthly Progress</div>
          </div>
          
          {/* Habit Rows */}
          <div className="flex flex-col">
            {habits.map((habit) => {
              const streak = currentStreak(habit);
              const colors = COLOR_MAP[habit.color] || COLOR_MAP.cyan;
              
              const currentMonthCheckins = habit.checkIns.filter(c => {
                const checkDate = new Date(c);
                const now = new Date();
                return checkDate.getMonth() === now.getMonth() && checkDate.getFullYear() === now.getFullYear();
              }).length;
              
              const monthlyProgressPct = Math.round((currentMonthCheckins / daysInMonth.length) * 100);

              return (
                <div 
                  key={habit.id}
                  className="group h-16 flex items-center justify-between px-4 border-b border-white/[0.03] hover:bg-white/[0.01] transition-colors"
                >
                  <div className="flex-1 flex flex-col min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${colors.dot} ${colors.glow}`} />
                      <span className="text-sm font-medium text-white/90 truncate max-w-[140px]" title={habit.name}>
                        {habit.name}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete "${habit.name}"?`)) {
                            deleteHabit(habit.id);
                            showToast('Habit deleted.');
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-rose-400 text-slate-500 rounded transition-all shrink-0 ml-1"
                        title="Delete habit"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    
                    {/* Monthly Progress Bar */}
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"
                          initial={{ width: 0 }}
                          animate={{ width: `${monthlyProgressPct}%` }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium shrink-0">
                        {currentMonthCheckins}/{daysInMonth.length}
                      </span>
                    </div>
                  </div>

                  {/* Streak Badge */}
                  <div className="shrink-0 flex flex-col items-end">
                    <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Streak</span>
                    <span className="text-xs font-semibold text-accent-amber bg-accent-amber/10 border border-accent-amber/20 px-2 py-0.5 rounded-[4px] mt-0.5 flex items-center gap-0.5">
                      🔥 {streak}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Scrollable Grid of Days */}
        <div className="flex-1 overflow-x-auto select-none scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
          <div className="flex flex-col min-w-max">
            
            {/* Header Row (Percentage Chips and Day Numbers) */}
            <div className="h-20 flex border-b border-white/5 font-semibold text-xs text-slate-400">
              {daysInMonth.map(({ dayNum, dateStr }) => {
                const pct = dailyStats[dateStr] || 0;
                return (
                  <div key={dayNum} className="w-11 shrink-0 flex flex-col items-center justify-between py-2 border-r border-white/[0.02]">
                    {/* Animated Percentage Chip */}
                    <motion.div 
                      key={`${dayNum}-${pct}`}
                      initial={{ scale: 0.8, opacity: 0.8 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 15 }}
                      className={`text-[9px] w-9 py-1 text-center rounded-[4px] transition-all duration-300 font-bold ${getPercentageClass(pct)}`}
                    >
                      {pct}%
                    </motion.div>
                    
                    {/* Day Number */}
                    <span className="text-[10px] text-slate-400 font-semibold mb-1">{dayNum}</span>
                  </div>
                );
              })}
            </div>

            {/* Checkbox Rows — uses memoized GridCell for perf */}
            <div className="flex flex-col">
              {habits.map((habit) => (
                <GridRow key={habit.id} habit={habit} daysInMonth={daysInMonth} onCellToggle={handleCellToggle} />
              ))}
            </div>

          </div>
        </div>

      </div>
    </Card>
  );
}

// Memoized row for a single habit — only re-renders when that habit's checkIns change
const GridRow = memo(function GridRow({
  habit,
  daysInMonth,
  onCellToggle,
}: {
  habit: Habit;
  daysInMonth: { date: Date; dayNum: number; dateStr: string }[];
  onCellToggle: (habit: Habit, dateStr: string) => void;
}) {
  const handleToggle = useCallback(
    (dateStr: string) => onCellToggle(habit, dateStr),
    [habit, onCellToggle]
  );

  return (
    <div className="h-16 flex border-b border-white/[0.03] hover:bg-white/[0.005] transition-colors">
      {daysInMonth.map(({ dateStr, dayNum }) => {
        const isCompleted = habit.checkIns.includes(dateStr);
        return (
          <GridCell
            key={dayNum}
            isCompleted={isCompleted}
            habitName={habit.name}
            dateStr={dateStr}
            onToggle={handleToggle}
          />
        );
      })}
    </div>
  );
});

