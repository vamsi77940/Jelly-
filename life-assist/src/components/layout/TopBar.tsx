import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings as SettingsIcon } from 'lucide-react';
import { IconButton } from '@/components/ui/IconButton';
import { useAssistantStore } from '@/store/useAssistantStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { ThreeOrb } from '@/components/ThreeOrb';
import { formatClock } from '@/lib/time';

export function TopBar() {
  const [now, setNow] = useState(new Date());
  const navigate = useNavigate();
  const setVoiceMode = useAssistantStore((s) => s.setVoiceMode);
  const lowPerformanceMode = useSettingsStore((s) => s.settings.lowPerformanceMode);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between px-4 md:px-8 py-4 border-b border-white/[0.08] bg-base-bg/60 backdrop-blur-glass">
      <div className="flex-1" />
      <div className="flex items-center gap-3">
        <time className="hidden sm:block font-mono text-sm text-ink-muted tabular-nums" dateTime={now.toISOString()}>
          {formatClock(now)}
        </time>
        <button
          onClick={() => setVoiceMode(true)}
          className="relative h-10 w-10 flex items-center justify-center rounded-full bg-black/20 border border-white/10 hover:border-accent-cyan/40 hover:bg-black/40 transition-all select-none cursor-pointer group"
          aria-label="Open Voice Mode"
          title="Open Voice Mode"
        >
          {lowPerformanceMode ? (
            <div className="relative flex items-center justify-center h-6 w-6">
              <div className="absolute inset-0 rounded-full border border-accent-cyan/40 animate-ping opacity-60" />
              <div className="absolute inset-0.5 rounded-full bg-gradient-to-tr from-accent-cyan via-accent-cyan to-accent-indigo shadow-sm" />
            </div>
          ) : (
            <ThreeOrb size={36} state="idle" showControls={false} />
          )}
          <div className="absolute inset-0 rounded-full border border-accent-cyan/0 group-hover:border-accent-cyan/35 group-hover:scale-105 transition-all duration-300 pointer-events-none" />
        </button>
        <IconButton
          label="Open settings"
          icon={<SettingsIcon size={18} />}
          onClick={() => navigate('/settings')}
        />
      </div>
    </header>
  );
}
