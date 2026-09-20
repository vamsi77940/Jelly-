import { useState } from 'react';
import { X, Sparkles, Plus, Trash2, Loader2, RefreshCw, BookOpen, Sun, Moon } from 'lucide-react';
import { useGoalsStore } from '@/store/useGoalsStore';
import { useScheduleStore } from '@/store/useScheduleStore';
import { useUIStore } from '@/store/useUIStore';
import { getClient } from '@/store/useAssistantStore';
import type { ScheduleBlockType } from '@/types';

interface ClassSlot {
  id: string;
  subject: string;
  days: string;
  time: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

type TimePreference = 'morning' | 'afternoon' | 'night';

/** Get the ISO Monday of the current week */
function thisMonday(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split('T')[0];
}

const BLOCK_COLORS: Record<ScheduleBlockType, string> = {
  'goal-session': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  'study':        'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  'personal':     'bg-amber-500/20 text-amber-300 border-amber-500/30',
  'break':        'bg-slate-500/20 text-slate-300 border-slate-500/30',
};

export function AiSchedulePanel({ open, onClose }: Props) {
  const goals = useGoalsStore((s) => s.goals);
  const replaceAiBlocks = useScheduleStore((s) => s.replaceAiBlocks);
  const showToast = useUIStore((s) => s.showToast);

  const [classSlots, setClassSlots] = useState<ClassSlot[]>([
    { id: '1', subject: '', days: 'Mon,Wed,Fri', time: '09:00' },
  ]);
  const [timePref, setTimePref] = useState<TimePreference>('morning');
  const [studyHours, setStudyHours] = useState(4);
  const [isGenerating, setIsGenerating] = useState(false);
  const [preview, setPreview] = useState<{ title: string; type: string; date: string; startTime: string; endTime: string }[]>([]);

  function addSlot() {
    setClassSlots((p) => [...p, { id: Date.now().toString(), subject: '', days: 'Mon,Wed', time: '10:00' }]);
  }
  function removeSlot(id: string) {
    setClassSlots((p) => p.filter((s) => s.id !== id));
  }
  function updateSlot(id: string, key: keyof ClassSlot, val: string) {
    setClassSlots((p) => p.map((s) => s.id === id ? { ...s, [key]: val } : s));
  }

  async function handleGenerate() {
    setIsGenerating(true);
    try {
      const monday = thisMonday();

      const activeGoals = goals.filter((g) => !g.archived).slice(0, 6);
      const goalSummary = activeGoals.map((g) => {
        const pct = g.milestones.length === 0 ? 0
          : Math.round((g.milestones.filter(m => m.completed).length / g.milestones.length) * 100);
        return `- ${g.title} [${g.goalType}, ${pct}% done]`;
      }).join('\n') || '- No active goals';

      const classSummary = classSlots
        .filter(s => s.subject.trim())
        .map(s => `${s.subject}: ${s.days} at ${s.time}`)
        .join(', ') || 'None';

      const prompt = `You are a smart academic schedule planner. Generate a detailed 7-day study + goal schedule for the week starting ${monday}.

User context:
- Active goals:\n${goalSummary}
- Academic classes: ${classSummary}
- Study preference: ${timePref} person
- Study hours per day: ${studyHours}h

Return ONLY a JSON array (no markdown, no explanation) of schedule blocks. Each block must have:
{
  "title": "string",
  "type": "goal-session" | "study" | "personal" | "break",
  "date": "YYYY-MM-DD",
  "startTime": "HH:mm",
  "endTime": "HH:mm",
  "linkedGoalTitle": "string or null",
  "notes": "string"
}

Generate 4-7 blocks per day. Include class time as study blocks, breaks, goal work sessions, and personal time. Use the actual dates for the week of ${monday}. Spread goal work sessions across multiple days.`;

      const client = getClient();
      const rawJson = await client.send([], prompt, []);

      // Extract JSON array from response
      const match = rawJson.match(/\[[\s\S]*\]/);
      if (!match) throw new Error('AI did not return valid JSON');

      const blocks: any[] = JSON.parse(match[0]);
      setPreview(blocks);
    } catch (err) {
      showToast('Failed to generate schedule. Check your AI key.', 'warning');
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  }

  function handleApply() {
    if (preview.length === 0) return;
    const goalMap = Object.fromEntries(goals.map(g => [g.title.toLowerCase(), g.id]));

    const inputs = preview.map((b: any) => ({
      title: b.title,
      type: (b.type as ScheduleBlockType) || 'study',
      date: b.date,
      startTime: b.startTime,
      endTime: b.endTime,
      linkedGoalId: b.linkedGoalTitle
        ? (Object.entries(goalMap).find(([k]) => k.includes(b.linkedGoalTitle?.toLowerCase?.()))?.[1] ?? null)
        : null,
      notes: b.notes || '',
      aiGenerated: true,
    }));

    replaceAiBlocks(inputs);

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    showToast(`${inputs.length} schedule blocks added to your calendar! 🗓️`, 'success');
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end sm:justify-end p-0 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative bg-surface-base border border-surface-stroke rounded-t-3xl sm:rounded-2xl w-full sm:w-[480px] max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-surface-base border-b border-surface-stroke px-5 py-4 flex items-center justify-between rounded-t-3xl sm:rounded-t-2xl">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-accent-cyan" />
            <h2 className="font-semibold text-base">AI Schedule Generator</h2>
          </div>
          <button onClick={onClose} className="text-ink-muted hover:text-ink-primary transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5 flex-1">
          {/* Academic schedule */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold flex items-center gap-1.5">
                <BookOpen size={14} className="text-accent-cyan" /> Academic Classes
              </span>
              <button onClick={addSlot} className="text-xs text-accent-cyan flex items-center gap-1">
                <Plus size={12} /> Add class
              </button>
            </div>
            <div className="space-y-2">
              {classSlots.map((slot) => (
                <div key={slot.id} className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center">
                  <input
                    className="text-xs bg-surface-card border border-surface-stroke rounded-lg px-2.5 py-1.5 text-ink-primary placeholder:text-ink-muted w-full"
                    value={slot.subject}
                    onChange={(e) => updateSlot(slot.id, 'subject', e.target.value)}
                    placeholder="Subject (e.g. Physics)"
                  />
                  <input
                    className="text-xs bg-surface-card border border-surface-stroke rounded-lg px-2 py-1.5 text-ink-primary w-28"
                    value={slot.days}
                    onChange={(e) => updateSlot(slot.id, 'days', e.target.value)}
                    placeholder="Mon,Wed"
                  />
                  <input
                    type="time"
                    className="text-xs bg-surface-card border border-surface-stroke rounded-lg px-2 py-1.5 text-ink-primary"
                    value={slot.time}
                    onChange={(e) => updateSlot(slot.id, 'time', e.target.value)}
                  />
                  <button onClick={() => removeSlot(slot.id)} className="text-ink-muted hover:text-red-400 transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Preferences */}
          <div>
            <span className="text-sm font-semibold block mb-2">Study preference</span>
            <div className="grid grid-cols-3 gap-2">
              {([
                { val: 'morning' as TimePreference, icon: <Sun size={14} />, label: 'Morning' },
                { val: 'afternoon' as TimePreference, icon: <Sparkles size={14} />, label: 'Afternoon' },
                { val: 'night' as TimePreference, icon: <Moon size={14} />, label: 'Night owl' },
              ]).map(({ val, icon, label }) => (
                <button
                  key={val}
                  onClick={() => setTimePref(val)}
                  className={[
                    'flex items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-medium transition-all',
                    timePref === val
                      ? 'border-accent-cyan bg-accent-cyan/10 text-accent-cyan'
                      : 'border-surface-stroke text-ink-muted hover:border-accent-cyan/40',
                  ].join(' ')}
                >
                  {icon} {label}
                </button>
              ))}
            </div>
          </div>

          {/* Study hours slider */}
          <div>
            <div className="flex justify-between mb-1.5">
              <span className="text-sm font-semibold">Study hours per day</span>
              <span className="text-sm font-bold text-accent-cyan">{studyHours}h</span>
            </div>
            <input
              type="range" min={1} max={10} value={studyHours}
              onChange={(e) => setStudyHours(Number(e.target.value))}
              className="w-full accent-accent-cyan"
            />
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full py-3 rounded-xl bg-accent-cyan text-ink-inverse font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60 hover:brightness-110 transition-all"
          >
            {isGenerating ? (
              <><Loader2 size={16} className="animate-spin" /> Generating your week plan…</>
            ) : (
              <><Sparkles size={16} /> Generate Week Plan</>
            )}
          </button>

          {/* Preview */}
          {preview.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold">Preview ({preview.length} blocks)</span>
                <button onClick={handleGenerate} className="text-xs text-ink-muted flex items-center gap-1 hover:text-accent-cyan transition-colors">
                  <RefreshCw size={11} /> Regenerate
                </button>
              </div>
              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                {preview.map((b, i) => (
                  <div key={i} className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs ${BLOCK_COLORS[(b.type as ScheduleBlockType) || 'study']}`}>
                    <span className="font-mono opacity-70">{b.startTime}–{b.endTime}</span>
                    <span className="font-medium flex-1 truncate">{b.title}</span>
                    <span className="text-[10px] opacity-60 uppercase">{b.date?.slice(5)}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={handleApply}
                className="mt-3 w-full py-2.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 font-semibold text-sm hover:bg-emerald-500/20 transition-all"
              >
                ✓ Apply to Calendar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
