import { X, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { IconButton } from '@/components/ui/IconButton';
import { useSuggestions } from '@/lib/jarvis/useSuggestions';
import { useHabitsStore } from '@/store/useHabitsStore';
import { useProgressStore } from '@/store/useProgressStore';
import { useUIStore } from '@/store/useUIStore';
import { toLocalDateString } from '@/lib/time';
import type { SuggestionPriority } from '@/lib/jarvis/types';

const PRIORITY_COLOR: Record<SuggestionPriority, string> = {
  high: 'text-accent-rose',
  medium: 'text-accent-amber',
  low: 'text-accent-cyan',
};

interface JarvisPanelProps {
  maxResults?: number;
  emptyText?: string;
}

export function JarvisPanel({ maxResults = 3, emptyText }: JarvisPanelProps) {
  const { suggestions, dismiss } = useSuggestions(maxResults);
  const navigate = useNavigate();

  const toggleDate = useHabitsStore((s) => s.toggleDate);
  const habits = useHabitsStore((s) => s.habits);
  const addXp = useProgressStore((s) => s.addXp);
  const showToast = useUIStore((s) => s.showToast);

  if (suggestions.length === 0 && !emptyText) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="relative overflow-hidden rounded-3xl p-6 bg-base-panel/60 backdrop-blur-glass border border-white/10 shadow-glass"
    >
      {/* Background glow behind Jarvis */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-accent-cyan/10 via-transparent to-transparent pointer-events-none" />
      
      <div className="relative flex items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <img src="/jelly-logo.png" alt="Jelly" className="w-8 h-8 rounded-xl object-cover border border-cyan-400/40 shadow-md shadow-cyan-500/30" />
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-cyan-400 block">Jelly AI</span>
            <h2 className="font-display font-semibold text-base tracking-tight text-white">
              For you right now
            </h2>
          </div>
        </div>
      </div>

      {suggestions.length === 0 ? (
        <p className="text-sm text-ink-muted relative">{emptyText}</p>
      ) : (
        <div className="space-y-3 relative">
          <AnimatePresence initial={false}>
            {suggestions.map((s) => {
              const isHabitReminder = s.id.startsWith('habit-reminder:');
              const habitId = isHabitReminder ? s.id.split(':')[1] : null;

              const handleAction = () => {
                if (isHabitReminder && habitId) {
                  const habit = habits.find((h) => h.id === habitId);
                  if (habit) {
                    const todayStr = toLocalDateString();
                    toggleDate(habitId, todayStr);
                    addXp(5);
                    showToast(`"${habit.name}" completed! (+5 XP)`, 'success');
                  }
                } else if (s.actionTo) {
                  navigate(s.actionTo);
                }
              };

              return (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, height: 0, padding: 0, margin: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-start gap-3 rounded-2xl bg-black/40 backdrop-blur-md border border-white/5 p-4 shadow-sm"
                >
                  <div className={`mt-1.5 shrink-0 ${PRIORITY_COLOR[s.priority]}`}>
                    <div className="w-2 h-2 rounded-full bg-current shadow-glow" />
                  </div>
                  <p className="flex-1 text-sm text-ink-primary leading-relaxed">{s.text}</p>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <IconButton
                      label="Dismiss suggestion"
                      icon={<X size={16} />}
                      onClick={() => dismiss(s.id)}
                      className="text-ink-muted hover:text-white"
                    />
                    {s.actionLabel && (isHabitReminder || s.actionTo) && (
                      <button
                        onClick={handleAction}
                        className={`text-xs font-medium transition-all flex items-center gap-1 ${
                          isHabitReminder
                            ? 'text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 px-3 py-1.5 rounded-lg shadow-[0_0_8px_rgba(16,185,129,0.15)] font-semibold'
                            : 'text-accent-cyan hover:text-accent-cyan/80'
                        }`}
                      >
                        {isHabitReminder && <Check size={12} className="stroke-[3]" />}
                        {isHabitReminder ? 'Complete' : s.actionLabel}
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
