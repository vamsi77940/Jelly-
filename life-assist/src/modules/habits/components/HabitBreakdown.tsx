import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Flame, Trophy, Calendar } from 'lucide-react';
import { useHabitsStore } from '@/store/useHabitsStore';
import { toLocalDateString } from '@/lib/time';
import { Card } from '@/components/ui/Card';
import type { Habit } from '@/types';

const COLOR_MAP: Record<Habit['color'], { ring: string; text: string; bg: string; glow: string }> = {
  cyan:  { ring: 'stroke-cyan-400',   text: 'text-cyan-400',   bg: 'bg-cyan-500/10',   glow: 'shadow-[0_0_12px_rgba(34,211,238,0.25)]' },
  amber: { ring: 'stroke-amber-400',  text: 'text-amber-400',  bg: 'bg-amber-500/10',  glow: 'shadow-[0_0_12px_rgba(251,191,36,0.25)]' },
  mint:  { ring: 'stroke-emerald-400', text: 'text-emerald-400', bg: 'bg-emerald-500/10', glow: 'shadow-[0_0_12px_rgba(52,211,153,0.25)]' },
  rose:  { ring: 'stroke-rose-400',   text: 'text-rose-400',   bg: 'bg-rose-500/10',   glow: 'shadow-[0_0_12px_rgba(251,113,133,0.25)]' },
};

// Radial progress ring SVG
function ProgressRing({ percentage, color, size = 64 }: { percentage: number; color: string; size?: number }) {
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      {/* Background track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.05)"
        strokeWidth={strokeWidth}
      />
      {/* Progress arc */}
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        className={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1, ease: 'easeOut' }}
      />
    </svg>
  );
}

// Mini sparkline for weekly activity (last 7 days)
function WeeklySparkline({ habit }: { habit: Habit }) {
  const days = useMemo(() => {
    const result: boolean[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      result.push(habit.checkIns.includes(toLocalDateString(d)));
    }
    return result;
  }, [habit.checkIns]);

  const colors = COLOR_MAP[habit.color] || COLOR_MAP.cyan;

  return (
    <div className="flex items-end gap-[3px] h-5">
      {days.map((done, i) => (
        <motion.div
          key={i}
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 0.3, delay: i * 0.04 }}
          className={`w-[5px] rounded-full origin-bottom transition-all ${
            done
              ? `h-5 ${colors.bg} border ${colors.text.replace('text-', 'border-')}/30`
              : 'h-2 bg-white/5 border border-white/[0.04]'
          }`}
        />
      ))}
    </div>
  );
}

function HabitAnalyticsCard({ habit, index }: { habit: Habit; index: number }) {
  const currentStreak = useHabitsStore((s) => s.currentStreak);
  const longestStreak = useHabitsStore((s) => s.longestStreak);

  const colors = COLOR_MAP[habit.color] || COLOR_MAP.cyan;

  const stats = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const today = now.getDate();

    const monthCheckins = habit.checkIns.filter(c => {
      const d = new Date(c);
      return d.getMonth() === month && d.getFullYear() === year;
    }).length;

    const monthlyPct = totalDays > 0 ? Math.round((monthCheckins / totalDays) * 100) : 0;
    const consistencyPct = today > 0 ? Math.round((monthCheckins / today) * 100) : 0;
    const streak = currentStreak(habit);
    const longest = longestStreak(habit);
    const totalAll = habit.checkIns.length;

    return { monthCheckins, monthlyPct, consistencyPct, streak, longest, totalDays, totalAll };
  }, [habit, currentStreak, longestStreak]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, delay: index * 0.08, ease: 'easeOut' }}
    >
      <motion.div
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 5 + index * 0.7, repeat: Infinity, ease: 'easeInOut' }}
        whileHover={{ scale: 1.02, y: -5 }}
        className={`relative overflow-hidden rounded-2xl border border-white/[0.07] bg-slate-950/50 backdrop-blur-xl p-5
          shadow-[0_8px_32px_rgba(0,0,0,0.35)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)] transition-shadow duration-300
          before:pointer-events-none before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/[0.05] before:via-transparent before:to-white/[0.02]`}
      >
        {/* Top Section: Name + Ring */}
        <div className="relative z-10 flex items-center justify-between mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`h-3 w-3 rounded-full ${colors.text.replace('text-', 'bg-')} ${colors.glow}`} />
            <span className="text-base font-semibold text-white truncate">{habit.name}</span>
          </div>

          {/* Radial Progress Ring with percentage inside */}
          <div className="relative shrink-0">
            <ProgressRing percentage={stats.monthlyPct} color={colors.ring} size={56} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-xs font-bold ${colors.text}`}>{stats.monthlyPct}%</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="relative z-10 grid grid-cols-3 gap-3 mb-4">
          <div className="flex flex-col items-center gap-0.5 rounded-lg bg-white/[0.03] border border-white/[0.04] py-2 px-1">
            <Flame size={14} className="text-accent-amber" />
            <span className="text-sm font-bold text-white">{stats.streak}</span>
            <span className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold">Streak</span>
          </div>
          <div className="flex flex-col items-center gap-0.5 rounded-lg bg-white/[0.03] border border-white/[0.04] py-2 px-1">
            <Trophy size={14} className="text-emerald-400" />
            <span className="text-sm font-bold text-white">{stats.longest}</span>
            <span className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold">Best</span>
          </div>
          <div className="flex flex-col items-center gap-0.5 rounded-lg bg-white/[0.03] border border-white/[0.04] py-2 px-1">
            <Calendar size={14} className="text-accent-cyan" />
            <span className="text-sm font-bold text-white">{stats.totalAll}</span>
            <span className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold">Total</span>
          </div>
        </div>

        {/* Bottom: Weekly Sparkline + Monthly Progress Bar */}
        <div className="relative z-10 flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Last 7 days</span>
            <WeeklySparkline habit={habit} />
          </div>

          <div className="flex-1 flex flex-col gap-1.5">
            <div className="flex justify-between">
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">This Month</span>
              <span className="text-[10px] text-slate-400 font-medium">{stats.monthCheckins}/{stats.totalDays}</span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${colors.text.replace('text-', 'bg-')} ${colors.glow}`}
                initial={{ width: 0 }}
                animate={{ width: `${stats.monthlyPct}%` }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: index * 0.1 }}
              />
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function HabitBreakdown() {
  const habits = useHabitsStore((s) => s.habits);

  if (habits.length === 0) return null;

  return (
    <Card className="w-full overflow-hidden p-6 bg-slate-950/40 border-slate-900/80 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
      {/* Background glow */}
      <div className="absolute -top-20 -right-20 w-56 h-56 bg-cyan-500/5 rounded-full blur-[80px] pointer-events-none" />

      <div className="flex justify-between items-center mb-5 relative z-10">
        <div>
          <h2 className="text-xl font-semibold text-white tracking-tight">Habit Analytics</h2>
          <p className="text-xs text-ink-muted">Per-habit breakdown with streaks, progress rings, and weekly activity</p>
        </div>
      </div>

      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {habits.map((habit, i) => (
          <HabitAnalyticsCard key={habit.id} habit={habit} index={i} />
        ))}
      </div>
    </Card>
  );
}
