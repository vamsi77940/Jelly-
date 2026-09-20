import { useState, useEffect } from 'react';
import {
  Flame,
  Sparkles,
  Timer,
  CheckSquare,
  Award,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useProgressStore } from '@/store/useProgressStore';
import { useTasksStore } from '@/store/useTasksStore';
import { useHabitsStore } from '@/store/useHabitsStore';
import { useFocusStore } from '@/store/useFocusStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { getClient } from '@/store/useAssistantStore';
import { toLocalDateString } from '@/lib/time';
import { computeLevel } from '@/lib/leveling';
import { readJSON, writeJSON } from '@/lib/storage';

export function AnalyticsPage() {
  const { peakStreak, totalXp, currentStreak } = useProgressStore();
  const { tasks } = useTasksStore();
  const { habits } = useHabitsStore();
  const { sessionLog } = useFocusStore();
  const settings = useSettingsStore((s) => s.settings);

  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  // Load last summary on mount
  useEffect(() => {
    const saved = readJSON<string | null>('lastAiAnalyticsSummary', null);
    if (saved) setAiSummary(saved);
  }, []);

  // Productivity math
  const completedTasks = tasks.filter((t) => t.completed);
  const totalCompletedTasks = completedTasks.length;
  
  const totalFocusSessions = sessionLog.length;
  const totalFocusMinutes = totalFocusSessions * 25;

  let totalHabitCheckins = 0;
  habits.forEach((h) => {
    totalHabitCheckins += h.checkIns.length;
  });

  const xpValue = totalXp();
  const { level, xpIntoLevel, xpForNextLevel, progress } = computeLevel(xpValue);

  const bestDayData = (() => {
    if (sessionLog.length === 0) return null;
    const counts: Record<string, number> = {};
    sessionLog.forEach((ts) => {
      try {
        const dateStr = toLocalDateString(new Date(ts));
        counts[dateStr] = (counts[dateStr] ?? 0) + 1;
      } catch (e) {
        // ignore
      }
    });
    const entries = Object.entries(counts);
    if (entries.length === 0) return null;
    const [date, count] = entries.reduce((best, cur) => (cur[1] > best[1] ? cur : best));
    return { date, minutes: count * 25 };
  })();

  // Last 7 days dates and Working Minutes
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return toLocalDateString(d);
  });

  const focusMinutesValues = last7Days.map((dateStr) => {
    const count = sessionLog.filter((ts) => {
      try {
        const dateStrLocal = toLocalDateString(new Date(ts));
        return dateStrLocal === dateStr;
      } catch {
        return false;
      }
    }).length;
    return count * 25;
  });
  
  const maxMinutes = Math.max(...focusMinutesValues, 50); // scale divisor, min height limit 50 minutes

  const dayLabels = last7Days.map((dateStr) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString(undefined, { weekday: 'short' });
  });

  // Prompt logic
  const handleGenerateSummary = async () => {
    setGenerating(true);
    setGenError(null);
    try {
      const client = getClient();
      if (!client.isConfigured()) {
        throw new Error('AI assistant is not configured. Please add an API key in Settings.');
      }

      const tasksText = completedTasks.length > 0 
        ? completedTasks.slice(0, 10).map((t) => `- ${t.title}`).join('\n')
        : 'No tasks completed yet.';

      const habitsText = habits.length > 0
        ? habits.map((h) => `- ${h.name}: ${h.checkIns.length} check-ins total`).join('\n')
        : 'No habits tracked yet.';

      const statsContext = `
Productivity Overview:
- Current Level: ${level} (Total XP: ${xpValue}, XP Progress: ${progress.toFixed(0)}%)
- Current Daily Streak: ${currentStreak()} days (Peak: ${peakStreak} days)
- Completed Tasks: ${totalCompletedTasks}
- Focus Sessions Completed: ${totalFocusSessions} (${totalFocusMinutes} minutes spent focusing)
- Habit Check-Ins: ${totalHabitCheckins}

Recently Completed Tasks:
${tasksText}

Habits Status:
${habitsText}
`;

      const prompt = `You are Jarvis, a highly intelligent personal AI assistant. 
Please write a weekly productivity review based on the following logs:
${statsContext}

Outline:
1. **Weekly Vibe**: Summarize the performance with a short, encouraging or fitting assessment.
2. **Wins & Strengths**: Highlight where I performed well (XP, focus sessions, or habits).
3. **Growth Areas**: Suggest small improvements (e.g. if focus hours are low, or tasks are pending).
4. **Action Plan**: Provide 2-3 specific, actionable recommendations for tomorrow.

Tone: Please write in a ${settings.assistantTone} tone. Write concise, clean markdown with clear headings, no greetings, and no conversational filler.`;

      const response = await client.send([], prompt);
      setAiSummary(response);
      writeJSON('lastAiAnalyticsSummary', response);
    } catch (err: any) {
      console.error(err);
      let errorMsg = err.message || 'Failed to generate weekly review. Try again.';
      if (err instanceof TypeError || (err.message && err.message.includes('fetch'))) {
        errorMsg = 'Could not connect to the secure AI backend. Please verify your internet connection or check if the backend is deployed. Alternatively, you can use local API keys by removing VITE_ASSISTANT_API_URL from your .env file.';
      }
      setGenError(errorMsg);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="animate-fadeUp max-w-6xl mx-auto space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-display font-semibold tracking-tight">Productivity Analytics</h1>
        <p className="text-sm text-ink-muted mt-1.5">
          Visualize your progress, check your streaks, and get customized AI recommendations.
        </p>
      </div>

      {/* Main Stats Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="flex items-center gap-4 p-5">
          <div className="p-3 bg-accent-cyan/10 text-accent-cyan rounded-xl">
            <Award size={24} />
          </div>
          <div>
            <p className="text-xs text-ink-muted font-medium uppercase tracking-wider">Level & Progress</p>
            <p className="text-xl font-semibold mt-0.5">Level {level}</p>
            <p className="text-xs text-ink-faint mt-1">
              {xpValue} total XP ({xpForNextLevel - xpIntoLevel} XP to level up)
            </p>
          </div>
        </Card>

        <Card className="flex items-center gap-4 p-5">
          <div className="p-3 bg-accent-orange/10 text-accent-orange rounded-xl">
            <Flame size={24} />
          </div>
          <div>
            <p className="text-xs text-ink-muted font-medium uppercase tracking-wider">Daily Streak</p>
            <p className="text-xl font-semibold mt-0.5">{currentStreak()} days</p>
            <p className="text-xs text-ink-faint mt-1">
              Longest streak: {peakStreak} days
            </p>
          </div>
        </Card>

        <Card className="flex items-center gap-4 p-5">
          <div className="p-3 bg-accent-mint/10 text-accent-mint rounded-xl">
            <CheckSquare size={24} />
          </div>
          <div>
            <p className="text-xs text-ink-muted font-medium uppercase tracking-wider">Tasks & Habits</p>
            <p className="text-xl font-semibold mt-0.5">{totalCompletedTasks} Tasks</p>
            <p className="text-xs text-ink-faint mt-1">
              {totalHabitCheckins} habit check-ins
            </p>
          </div>
        </Card>

        <Card className="flex items-center gap-4 p-5">
          <div className="p-3 bg-accent-indigo/10 text-accent-indigo rounded-xl">
            <Timer size={24} />
          </div>
          <div>
            <p className="text-xs text-ink-muted font-medium uppercase tracking-wider">Focus Mode</p>
            <p className="text-xl font-semibold mt-0.5">{totalFocusMinutes} Mins</p>
            <p className="text-xs text-ink-faint mt-1">
              {totalFocusSessions} Pomodoro sessions
            </p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Weekly Chart */}
        <Card className="lg:col-span-2 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold text-base">Weekly Working Time</h3>
                <p className="text-xs text-ink-muted mt-0.5">Focus time (minutes) over the last 7 days</p>
              </div>
              {bestDayData && (
                <div className="text-right">
                  <p className="text-xs text-ink-muted">Personal Best</p>
                  <p className="text-sm font-semibold text-accent-cyan mt-0.5">
                    {bestDayData.minutes} Mins ({bestDayData.date})
                  </p>
                </div>
              )}
            </div>

            {/* Custom Chart Display with Y-Axis and Grid Lines */}
            <div className="flex gap-4 items-stretch h-64 mt-6">
              {/* Y-Axis Labels */}
              <div className="flex flex-col justify-between text-[10px] font-mono text-ink-faint w-12 text-right pr-2 select-none py-2">
                <span>{Math.round(maxMinutes)} Min</span>
                <span>{Math.round(maxMinutes / 2)} Min</span>
                <span>0 Min</span>
              </div>

              {/* Chart Area */}
              <div className="flex-1 relative">
                {/* Horizontal Grid Lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none py-2">
                  <div className="border-b border-base-border/40 border-dashed w-full h-0" />
                  <div className="border-b border-base-border/40 border-dashed w-full h-0" />
                  <div className="border-b border-base-border w-full h-0" />
                </div>

                {/* Bars Container */}
                <div className="absolute inset-0 flex items-end gap-3 sm:gap-6 px-2">
                  {focusMinutesValues.map((minutes, index) => {
                    const heightPercent = (minutes / maxMinutes) * 100;
                    const isToday = index === 6;

                    return (
                      <div key={index} className="flex-1 flex flex-col items-center group relative h-full justify-end z-10">
                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-2 bg-base-raised border border-base-border rounded px-2.5 py-1.5 text-xs text-ink-primary opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none shadow-lg z-20 text-center font-mono min-w-[70px]">
                          <span className="block font-semibold text-accent-cyan">{minutes} Mins</span>
                          <span className="text-[10px] text-ink-muted">{last7Days[index]}</span>
                        </div>

                        {/* Bar */}
                        <div className="w-full relative flex justify-center items-end" style={{ height: '80%' }}>
                          <div
                            style={{ height: `${Math.max(heightPercent, 2)}%` }}
                            className={`w-full max-w-[40px] rounded-t-lg transition-all duration-300 ${
                              isToday
                                ? 'bg-gradient-to-t from-accent-cyan/80 to-accent-cyan shadow-glow-sm'
                                : 'bg-base-raised hover:bg-accent-cyan/30 border border-base-border'
                            }`}
                          />
                        </div>

                        {/* Label */}
                        <span className={`text-xs mt-3 font-medium select-none ${isToday ? 'text-accent-cyan font-semibold' : 'text-ink-muted'}`}>
                          {dayLabels[index]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* AI summary & recommendations */}
        <Card className="p-6 flex flex-col justify-between h-full min-h-[350px]">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="text-accent-cyan" size={18} />
                <h3 className="font-semibold text-base">Jarvis AI Insights</h3>
              </div>
              {aiSummary && (
                <Button
                  variant="ghost"
                  className="p-1.5 min-w-[32px] h-[32px] rounded-full hover:bg-base-raised"
                  onClick={handleGenerateSummary}
                  disabled={generating}
                  title="Regenerate Summary"
                >
                  <RefreshCw size={14} className={generating ? 'animate-spin' : ''} />
                </Button>
              )}
            </div>

            {genError && (
              <div className="bg-accent-rose/10 border border-accent-rose/20 rounded-lg p-3 text-xs text-accent-rose">
                {genError}
              </div>
            )}

            <div className="overflow-y-auto max-h-[320px] pr-1 space-y-3">
              {generating ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-3">
                  <div className="w-8 h-8 border-2 border-accent-cyan border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-ink-muted animate-pulse">Jarvis is compiling your productivity report...</p>
                </div>
              ) : aiSummary ? (
                <div className="text-sm leading-relaxed text-ink-muted space-y-4 prose prose-invert font-sans whitespace-pre-wrap">
                  {aiSummary}
                </div>
              ) : (
                <div className="text-center py-12 text-ink-faint space-y-3">
                  <Zap className="mx-auto" size={32} />
                  <div>
                    <p className="text-sm">No productivity report generated yet.</p>
                    <p className="text-xs text-ink-muted mt-1">Gathers completed tasks, streaks, and habits to build a customized review.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {!generating && !aiSummary && (
            <div className="pt-4 border-t border-base-border mt-auto">
              <Button className="w-full" onClick={handleGenerateSummary}>
                Generate AI Weekly Review
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
