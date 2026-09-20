import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useUIStore } from '@/store/useUIStore';
import { useFocusStore } from '@/store/useFocusStore';
import { useProgressStore } from '@/store/useProgressStore';
import { usePomodoro } from './usePomodoro';
import { useEffect, useRef } from 'react';

export function PomodoroTimer() {
  const minutes = useSettingsStore((s) => s.settings.pomodoroMinutes);
  const showToast = useUIStore((s) => s.showToast);
  const logCompletedSession = useFocusStore((s) => s.logCompletedSession);
  const addXp = useProgressStore((s) => s.addXp);
  const { label, isRunning, start, pause, reset, isFinished } = usePomodoro(minutes);
  const notifiedRef = useRef(false);

  useEffect(() => {
    if (isFinished && !notifiedRef.current) {
      notifiedRef.current = true;
      logCompletedSession();
      addXp(15);
      showToast('Focus session complete. Take a short break.', 'success');
    }
    if (!isFinished) notifiedRef.current = false;
  }, [isFinished, showToast, logCompletedSession, addXp]);

  return (
    <Card>
      <h3 className="font-medium mb-1">Study timer</h3>
      <p className="text-sm text-ink-muted mb-5">
        A focused {minutes}-minute session, Pomodoro-style. Adjust the length in Settings.
      </p>
      <div className="flex justify-center mb-5">
        <span className="text-5xl font-mono font-medium tabular-nums" aria-live="polite">
          {label}
        </span>
      </div>
      <div className="flex justify-center gap-3">
        {!isRunning ? (
          <Button onClick={start}>{isFinished ? 'Restart' : 'Start'}</Button>
        ) : (
          <Button variant="secondary" onClick={pause}>
            Pause
          </Button>
        )}
        <Button variant="ghost" onClick={reset}>
          Reset
        </Button>
      </div>
    </Card>
  );
}
