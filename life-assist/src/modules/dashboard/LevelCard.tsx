import { Flame, Trophy } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { useProgressStore } from '@/store/useProgressStore';
import { computeLevel } from '@/lib/leveling';

export function LevelCard() {
  const totalXp = useProgressStore((s) => s.totalXp());
  const currentStreak = useProgressStore((s) => s.currentStreak());
  const peakStreak = useProgressStore((s) => s.peakStreak);
  const bestDay = useProgressStore((s) => s.bestDay());

  const { level, xpIntoLevel, xpForNextLevel, progress, title } = computeLevel(totalXp);

  return (
    <Card className="relative overflow-hidden">
      {/* Background glow effects - brighter and pulsing to reveal through glass */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-accent-cyan/15 rounded-full blur-[64px] pointer-events-none animate-pulse" />
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-accent-indigo/15 rounded-full blur-[64px] pointer-events-none animate-pulse" />

      <div className="relative z-10">
        <div className="flex items-center gap-5 mb-6">
          <div className="relative shrink-0 group">
            <div className="absolute inset-0 bg-accent-cyan/20 blur-xl rounded-full scale-110 group-hover:scale-125 transition-transform duration-500" />
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-accent-cyan/20 to-accent-indigo/20 border border-white/10 flex items-center justify-center text-3xl shadow-glow-sm select-none">
              👤
            </div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-gradient-to-br from-accent-cyan to-accent-indigo p-[1px] shadow-glow transform rotate-12 group-hover:rotate-0 transition-transform duration-300">
              <div className="w-full h-full bg-base-bg rounded-xl flex items-center justify-center font-display font-bold text-sm text-accent-cyan select-none" title="Current Daily Streak">
                {currentStreak}
              </div>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-display font-semibold text-xl bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
              {title}
            </h2>
            <p className="text-sm text-ink-muted mt-0.5">
              Level {level} Explorer
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs font-medium">
            <span className="text-accent-cyan">{xpIntoLevel} XP</span>
            <span className="text-ink-muted">{xpForNextLevel} XP needed</span>
          </div>
          <div className="h-2.5 bg-black/40 rounded-full overflow-hidden border border-white/5 shadow-inner">
            <div 
              className="h-full bg-gradient-to-r from-accent-cyan to-accent-indigo rounded-full relative"
              style={{ width: `${progress * 100}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-6 pt-5 border-t border-white/10">
          <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/5 border border-white/[0.08] backdrop-blur-md shadow-sm hover:bg-white/10 hover:border-white/15 transition-all">
            <Flame size={18} className="text-accent-amber mb-2 animate-pulse" />
            <p className="font-display font-bold text-lg text-white">{currentStreak}</p>
            <p className="text-[10px] uppercase tracking-wider text-ink-muted font-medium">Streak</p>
          </div>
          <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/5 border border-white/[0.08] backdrop-blur-md shadow-sm hover:bg-white/10 hover:border-white/15 transition-all">
            <Trophy size={18} className="text-accent-indigo mb-2" />
            <p className="font-display font-bold text-lg text-white">{peakStreak}</p>
            <p className="text-[10px] uppercase tracking-wider text-ink-muted font-medium">Peak</p>
          </div>
          <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/5 border border-white/[0.08] backdrop-blur-md shadow-sm hover:bg-white/10 hover:border-white/15 transition-all text-center">
            <span className="text-accent-cyan mb-2 text-lg font-bold">★</span>
            <p className="font-display font-bold text-sm text-white truncate w-full">{bestDay ? bestDay.xp : 0}</p>
            <p className="text-[10px] uppercase tracking-wider text-ink-muted font-medium">Best XP</p>
          </div>
        </div>
      </div>
    </Card>
  );
}
