import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { StatsOverview } from './components/StatsOverview';
import { HabitGrid } from './components/HabitGrid';
import { TrendlineGraph } from './components/TrendlineGraph';
import { HabitBreakdown } from './components/HabitBreakdown';
import { JarvisPanel } from '@/components/JarvisPanel';
import { useUIStore } from '@/store/useUIStore';

export function HabitsDashboard() {
  const openModal = useUIStore((s) => s.openModal);

  return (
    <div className="space-y-6 pt-4 relative">
      {/* Floating background decorative orbs */}
      <div className="absolute top-10 right-20 w-72 h-72 bg-accent-cyan/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-accent-mint/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[50%] left-[40%] w-80 h-80 bg-accent-amber/3 rounded-full blur-[110px] pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between z-10 relative">
        <div>
          <h1 className="text-3xl font-display font-semibold tracking-tight text-white">
            Habit Space
          </h1>
          <p className="text-sm text-ink-muted mt-1">
            Build streaks, track daily consistency, and visualize your progress.
          </p>
        </div>
        
        <Button 
          icon={<Plus size={16} />} 
          onClick={() => openModal('addHabit')}
          className="shadow-[0_0_15px_rgba(34,211,238,0.25)] hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] transition-all"
        >
          New Habit
        </Button>
      </div>

      {/* Dynamic assistant nudges/suggestions specifically for habit completions */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="z-10 relative"
      >
        <JarvisPanel maxResults={1} />
      </motion.div>

      {/* Main Dashboard Layout */}
      <div className="flex flex-col gap-6 relative z-10">
        
        {/* 1. Gamified Stats Overview Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <StatsOverview />
        </motion.div>

        {/* 2. Habit Grid with gentle vertical floating loop */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
        >
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{
              duration: 5.5,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          >
            <HabitGrid />
          </motion.div>
        </motion.div>

        {/* 3. Trendline Graph with out-of-phase floating loop */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
        >
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{
              duration: 7,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.4
            }}
          >
            <TrendlineGraph />
          </motion.div>
        </motion.div>

        {/* 4. Per-Habit Analytics Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
        >
          <motion.div
            animate={{ y: [0, -3, 0] }}
            transition={{
              duration: 6.2,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.8
            }}
          >
            <HabitBreakdown />
          </motion.div>
        </motion.div>

      </div>
    </div>
  );
}
