import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Flame, Target, TrendingUp, Zap } from 'lucide-react';
import { useHabitsStore } from '@/store/useHabitsStore';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtitle: string;
  color: string;
  glowColor: string;
  delay: number;
  floatDuration: number;
}

function StatCard({ icon, label, value, subtitle, color, glowColor, delay, floatDuration }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 25, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
      className="flex-1 min-w-[200px]"
    >
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: floatDuration, repeat: Infinity, ease: 'easeInOut', delay: delay * 2 }}
        whileHover={{ scale: 1.03, y: -6 }}
        className={`relative overflow-hidden rounded-2xl border border-white/[0.08] bg-slate-950/50 backdrop-blur-xl p-5 cursor-default
          shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)] transition-shadow duration-300
          before:pointer-events-none before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/[0.06] before:via-transparent before:to-white/[0.02]`}
      >
        {/* Ambient glow orb */}
        <div className={`absolute -top-8 -right-8 w-24 h-24 rounded-full blur-[40px] pointer-events-none opacity-30 ${glowColor}`} />

        <div className="relative z-10 flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</span>
            <motion.span
              key={String(value)}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className={`text-3xl font-bold tracking-tight ${color}`}
            >
              {value}
            </motion.span>
            <span className="text-[10px] text-slate-500 font-medium mt-0.5">{subtitle}</span>
          </div>

          <div className={`flex items-center justify-center h-10 w-10 rounded-xl bg-white/[0.04] border border-white/[0.06] ${color}`}>
            {icon}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function StatsOverview() {
  const habits = useHabitsStore((s) => s.habits);
  const currentStreak = useHabitsStore((s) => s.currentStreak);
  const longestStreak = useHabitsStore((s) => s.longestStreak);

  const stats = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const today = now.getDate();

    const totalHabits = habits.length;

    // Best current streak across all habits
    const bestStreak = habits.reduce((max, h) => Math.max(max, currentStreak(h)), 0);

    // Best longest streak across all habits
    const bestLongest = habits.reduce((max, h) => Math.max(max, longestStreak(h)), 0);

    // Monthly score: total check-ins this month across all habits
    const monthlyCheckins = habits.reduce((sum, h) => {
      return sum + h.checkIns.filter(c => {
        const d = new Date(c);
        return d.getMonth() === month && d.getFullYear() === year;
      }).length;
    }, 0);

    // Max possible check-ins this month (habits * days elapsed so far)
    const maxPossible = totalHabits * today;

    // Average consistency: percentage of possible check-ins completed
    const avgConsistency = maxPossible > 0 ? Math.round((monthlyCheckins / maxPossible) * 100) : 0;

    // Monthly score out of total possible for the whole month
    const totalPossible = totalHabits * totalDays;
    const monthlyScore = totalPossible > 0 ? Math.round((monthlyCheckins / totalPossible) * 100) : 0;

    return { totalHabits, bestStreak, bestLongest, monthlyCheckins, avgConsistency, monthlyScore, totalPossible, totalDays };
  }, [habits, currentStreak, longestStreak]);

  return (
    <div className="flex flex-wrap gap-4">
      <StatCard
        icon={<Target size={20} />}
        label="Active Habits"
        value={stats.totalHabits}
        subtitle="Tracking this month"
        color="text-accent-cyan"
        glowColor="bg-cyan-500"
        delay={0}
        floatDuration={5}
      />
      <StatCard
        icon={<Flame size={20} />}
        label="Best Streak"
        value={`${stats.bestStreak}d`}
        subtitle={`Longest ever: ${stats.bestLongest}d`}
        color="text-accent-amber"
        glowColor="bg-amber-500"
        delay={0.08}
        floatDuration={5.8}
      />
      <StatCard
        icon={<Zap size={20} />}
        label="Monthly Score"
        value={`${stats.monthlyScore}%`}
        subtitle={`${stats.monthlyCheckins} / ${stats.totalPossible} check-ins`}
        color="text-emerald-400"
        glowColor="bg-emerald-500"
        delay={0.16}
        floatDuration={6.4}
      />
      <StatCard
        icon={<TrendingUp size={20} />}
        label="Avg Consistency"
        value={`${stats.avgConsistency}%`}
        subtitle="Based on days elapsed"
        color="text-accent-rose"
        glowColor="bg-rose-500"
        delay={0.24}
        floatDuration={7}
      />
    </div>
  );
}
