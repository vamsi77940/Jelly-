import { useMemo, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar, CheckCircle2, Sparkles, Circle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Card } from '@/components/ui/Card';
import { useTasksStore } from '@/store/useTasksStore';
import { useCalendarStore } from '@/store/useCalendarStore';
import { useScheduleStore } from '@/store/useScheduleStore';
import { useUIStore } from '@/store/useUIStore';
import { buildMonthGrid } from './monthGrid';
import { AddEventModal } from './AddEventModal';
import { TimelineView } from './TimelineView';
import { toLocalDateString } from '@/lib/time';
import type { ScheduleBlockType } from '@/types';

const BLOCK_COLORS: Record<ScheduleBlockType, { dot: string; chip: string }> = {
  'goal-session': { dot: 'bg-emerald-400', chip: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
  'study':        { dot: 'bg-cyan-400',    chip: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30' },
  'personal':     { dot: 'bg-amber-400',   chip: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  'break':        { dot: 'bg-slate-400',   chip: 'bg-slate-500/15 text-slate-300 border-slate-500/30' },
};

const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  work: { bg: 'bg-accent-indigo/10 hover:bg-accent-indigo/20', border: 'border-accent-indigo/30', text: 'text-accent-indigo' },
  personal: { bg: 'bg-accent-mint/10 hover:bg-accent-mint/20', border: 'border-accent-mint/30', text: 'text-accent-mint' },
  health: { bg: 'bg-accent-rose/10 hover:bg-accent-rose/20', border: 'border-accent-rose/30', text: 'text-accent-rose' },
  study: { bg: 'bg-accent-cyan/10 hover:bg-accent-cyan/20', border: 'border-accent-cyan/30', text: 'text-accent-cyan' },
  other: { bg: 'bg-accent-cyan/10 hover:bg-accent-cyan/20', border: 'border-accent-cyan/30', text: 'text-accent-cyan' },
};

function getDaysOfWeek(dateStr: string): Date[] {
  const current = new Date(dateStr + 'T00:00:00');
  const day = current.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const mondayDiff = day === 0 ? -6 : 1 - day;
  const monday = new Date(current);
  monday.setDate(current.getDate() + mondayDiff);
  
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push(d);
  }
  return days;
}

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function CalendarPage() {
  const tasks = useTasksStore((s) => s.tasks);
  const events = useCalendarStore((s) => s.events);
  const blocks = useScheduleStore((s) => s.blocks);
  const markDone = useScheduleStore((s) => s.markDone);
  const deleteBlock = useScheduleStore((s) => s.deleteBlock);
  const deleteEvent = useCalendarStore((s) => s.deleteEvent);
  const toggleTask = useTasksStore((s) => s.toggleTask);
  const openModal = useUIStore((s) => s.openModal);

  const [cursor, setCursor] = useState(() => new Date());
  const [selectedKey, setSelectedKey] = useState(() => toLocalDateString());
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day');

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const grid = useMemo(() => buildMonthGrid(year, month), [year, month]);

  const itemsByDay = useMemo(() => {
    const map = new Map<string, { id: string; label: string; kind: 'task' | 'event' | 'block'; blockType?: ScheduleBlockType }[]>();
    tasks
      .filter((t) => t.dueDate)
      .forEach((t) => {
        const key = t.dueDate as string;
        map.set(key, [...(map.get(key) ?? []), { id: t.id, label: t.title, kind: 'task' }]);
      });
    events.forEach((e) => {
      map.set(e.date, [...(map.get(e.date) ?? []), { id: e.id, label: e.title, kind: 'event' }]);
    });
    blocks.forEach((b) => {
      map.set(b.date, [...(map.get(b.date) ?? []), { id: b.id, label: b.title, kind: 'block', blockType: b.type }]);
    });
    return map;
  }, [tasks, events, blocks]);

  // Keyboard navigation for calendar days
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'SELECT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      const current = new Date(selectedKey + 'T00:00:00');
      if (e.key === 'ArrowLeft') {
        current.setDate(current.getDate() - 1);
        const nextKey = toLocalDateString(current);
        setSelectedKey(nextKey);
        setCursor(current);
      } else if (e.key === 'ArrowRight') {
        current.setDate(current.getDate() + 1);
        const nextKey = toLocalDateString(current);
        setSelectedKey(nextKey);
        setCursor(current);
      } else if (e.key.toLowerCase() === 't') {
        const today = toLocalDateString();
        setSelectedKey(today);
        setCursor(new Date());
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedKey]);

  const selectedDate = new Date(selectedKey + 'T00:00:00');
  const displaySelectedDate = selectedDate.toLocaleDateString([], {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const dailyTasks = tasks.filter((t) => t.dueDate === selectedKey);
  const dailyEvents = events.filter((e) => e.date === selectedKey);
  const dailyBlocks = blocks.filter((b) => b.date === selectedKey).sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div className="space-y-6 pt-4">
      {/* Calendar Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <h1 className="text-3xl font-display font-semibold tracking-tight">Calendar</h1>
        <div className="flex flex-wrap items-center gap-3">
          {/* Quick Date Filters */}
          <div className="flex bg-surface-card rounded-xl p-1 border border-surface-stroke text-xs">
            <button
              onClick={() => {
                const d = new Date();
                d.setDate(d.getDate() - 1);
                const k = toLocalDateString(d);
                setSelectedKey(k);
                setCursor(d);
                setViewMode('day');
              }}
              className={`px-3.5 py-1.5 rounded-lg font-medium transition-all ${
                selectedKey === toLocalDateString(new Date(Date.now() - 86400000)) && viewMode === 'day'
                  ? 'bg-accent-cyan text-white shadow font-semibold'
                  : 'text-ink-muted hover:text-ink-primary'
              }`}
            >
              Yesterday
            </button>
            <button
              onClick={() => {
                const d = new Date();
                const k = toLocalDateString(d);
                setSelectedKey(k);
                setCursor(d);
                setViewMode('day');
              }}
              className={`px-3.5 py-1.5 rounded-lg font-medium transition-all ${
                selectedKey === toLocalDateString(new Date()) && viewMode === 'day'
                  ? 'bg-accent-cyan text-white shadow font-semibold'
                  : 'text-ink-muted hover:text-ink-primary'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => {
                const d = new Date();
                d.setDate(d.getDate() + 1);
                const k = toLocalDateString(d);
                setSelectedKey(k);
                setCursor(d);
                setViewMode('day');
              }}
              className={`px-3.5 py-1.5 rounded-lg font-medium transition-all ${
                selectedKey === toLocalDateString(new Date(Date.now() + 86400000)) && viewMode === 'day'
                  ? 'bg-accent-cyan text-white shadow font-semibold'
                  : 'text-ink-muted hover:text-ink-primary'
              }`}
            >
              Tomorrow
            </button>
          </div>

          {/* View Mode Buttons */}
          <div className="flex bg-surface-card rounded-xl p-1 border border-surface-stroke text-xs">
            <button
              onClick={() => setViewMode('day')}
              className={`px-3.5 py-1.5 rounded-lg font-medium transition-all ${
                viewMode === 'day'
                  ? 'bg-accent-cyan text-white shadow font-semibold'
                  : 'text-ink-muted hover:text-ink-primary'
              }`}
            >
              Daily
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3.5 py-1.5 rounded-lg font-medium transition-all ${
                viewMode === 'week'
                  ? 'bg-accent-cyan text-white shadow font-semibold'
                  : 'text-ink-muted hover:text-ink-primary'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-3.5 py-1.5 rounded-lg font-medium transition-all ${
                viewMode === 'month'
                  ? 'bg-accent-cyan text-white shadow font-semibold'
                  : 'text-ink-muted hover:text-ink-primary'
              }`}
            >
              Monthly
            </button>
          </div>

          <Button
            icon={<Plus size={16} />}
            onClick={() => openModal('addEvent', { date: selectedKey })}
          >
            New event
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Left Column: Glass Month Navigator */}
        <aside className="w-full lg:w-80 shrink-0 space-y-4">
          <Card variant="glass" className="p-4 border-white/5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-ink-primary">
                {cursor.toLocaleDateString([], { month: 'long', year: 'numeric' })}
              </h2>
              <div className="flex items-center gap-0.5">
                <IconButton
                  label="Previous month"
                  icon={<ChevronLeft size={16} />}
                  onClick={() => setCursor(new Date(year, month - 1, 1))}
                  className="hover:bg-white/5"
                />
                <IconButton
                  label="Next month"
                  icon={<ChevronRight size={16} />}
                  onClick={() => setCursor(new Date(year, month + 1, 1))}
                  className="hover:bg-white/5"
                />
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-ink-muted uppercase tracking-wider mb-2">
              {WEEKDAY_LABELS.map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {grid.map((day) => {
                const items = itemsByDay.get(day.key) ?? [];
                const isSelected = day.key === selectedKey;
                return (
                  <button
                    key={day.key}
                    onClick={() => {
                      setSelectedKey(day.key);
                      setViewMode('day');
                    }}
                    aria-current={day.isToday ? 'date' : undefined}
                    aria-pressed={isSelected}
                    className={`aspect-square rounded-xl p-1 text-center text-xs flex flex-col items-center justify-between border transition-all ${
                      isSelected
                        ? 'border-accent-cyan bg-accent-cyanSoft text-white shadow-glow-sm'
                        : 'border-transparent hover:bg-white/5 text-ink-muted hover:text-ink-primary'
                    } ${day.inCurrentMonth ? '' : 'opacity-30'}`}
                  >
                    <span className={`h-5 w-5 rounded-full flex items-center justify-center font-medium ${
                      day.isToday && !isSelected ? 'bg-accent-cyan/15 text-accent-cyan' : ''
                    }`}>
                      {day.date.getDate()}
                    </span>
                    {items.length > 0 && (
                      <span className="flex gap-0.5 mt-0.5 justify-center" aria-hidden="true">
                        {items.slice(0, 3).map((item, i) => (
                          <span
                            key={i}
                            className={`h-1 w-1 rounded-full ${
                              item.kind === 'task' ? 'bg-accent-amber'
                              : item.kind === 'block' ? (BLOCK_COLORS[item.blockType ?? 'study']?.dot ?? 'bg-accent-cyan')
                              : 'bg-accent-cyan'
                            }`}
                          />
                        ))}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </Card>

          <Card variant="glass" className="hidden lg:block p-4 border-white/5 text-xs text-ink-muted leading-relaxed">
            <div className="flex items-center gap-2 mb-2 text-ink-primary font-medium">
              <Calendar size={14} className="text-accent-cyan" />
              <span>Keyboard Shortcuts</span>
            </div>
            <ul className="space-y-1">
              <li><kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 font-mono">←</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 font-mono">→</kbd> Move daily focus</li>
              <li><kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 font-mono">T</kbd> Jump to current day</li>
            </ul>
          </Card>
        </aside>

        {/* Right Column */}
        <main className="flex-1 w-full min-w-0">
          {viewMode === 'day' && (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-semibold text-lg text-ink-primary">
                  {displaySelectedDate}
                </h3>
                <span className="text-xs font-mono font-medium text-ink-muted">
                  {dailyEvents.length} events · {dailyTasks.filter(t => !t.completed).length} tasks · {dailyBlocks.length} blocks
                </span>
              </div>

              {/* AI Schedule Blocks */}
              {dailyBlocks.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Sparkles size={13} className="text-accent-cyan" />
                    <span className="text-xs font-semibold text-ink-muted uppercase tracking-wide">AI Schedule</span>
                  </div>
                  <div className="space-y-1.5">
                    {dailyBlocks.map((block) => {
                      const colors = BLOCK_COLORS[block.type] ?? BLOCK_COLORS.study;
                      return (
                        <div
                          key={block.id}
                          className={`flex items-center gap-3 rounded-xl border px-3 py-2 text-xs transition-all ${
                            block.done ? 'opacity-40 line-through' : ''
                          } ${colors.chip}`}
                        >
                          <span className="font-mono text-[11px] opacity-70 shrink-0">
                            {block.startTime}–{block.endTime}
                          </span>
                          <span className="flex-1 font-medium truncate">{block.title}</span>
                          <span className="opacity-50 uppercase text-[10px] shrink-0">{block.type.replace('-', ' ')}</span>
                          {!block.done ? (
                            <button
                              onClick={() => markDone(block.id)}
                              title="Mark done"
                              className="ml-1 text-emerald-400 hover:text-emerald-300 transition-colors"
                            >
                              <CheckCircle2 size={14} />
                            </button>
                          ) : null}
                          <button
                            onClick={() => deleteBlock(block.id)}
                            className="ml-0.5 text-ink-muted hover:text-red-400 transition-colors text-[10px]"
                            title="Remove block"
                          >✕</button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <TimelineView
                dateKey={selectedKey}
                tasks={dailyTasks}
                events={dailyEvents}
                onHourClick={(time) => openModal('addEvent', { date: selectedKey, time })}
                onDeleteEvent={deleteEvent}
                onToggleTask={toggleTask}
              />
            </>
          )}

          {viewMode === 'week' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-semibold text-lg text-ink-primary">
                  Weekly Schedule
                </h3>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {getDaysOfWeek(selectedKey).map((day) => {
                  const dayKey = toLocalDateString(day);
                  const dayTasks = tasks.filter((t) => t.dueDate === dayKey);
                  const dayEvents = events.filter((e) => e.date === dayKey);
                  const dayBlocks = blocks.filter((b) => b.date === dayKey).sort((a, b) => a.startTime.localeCompare(b.startTime));
                  const displayDay = day.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
                  const isToday = dayKey === toLocalDateString();

                  return (
                    <Card key={dayKey} className={`p-4 border border-white/5 bg-base-panel/10 backdrop-blur-md shadow-glass ${isToday ? 'ring-1 ring-accent-cyan/30' : ''}`}>
                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/5">
                        <button
                          onClick={() => {
                            setSelectedKey(dayKey);
                            setViewMode('day');
                          }}
                          className="text-sm font-semibold text-ink-primary flex items-center gap-2 hover:text-accent-cyan transition-colors"
                        >
                          {isToday && <span className="h-2 w-2 rounded-full bg-accent-cyan shadow-glow animate-pulse" />}
                          {displayDay}
                        </button>
                        <span className="text-[10px] text-ink-muted font-mono">
                          {dayEvents.length} events · {dayTasks.length} tasks · {dayBlocks.length} AI blocks
                        </span>
                      </div>

                      <div className="space-y-2">
                        {/* Events */}
                        {dayEvents.map((event) => {
                          const style = CATEGORY_COLORS[event.category] || CATEGORY_COLORS.other;
                          return (
                            <div key={event.id} className={`flex items-center justify-between p-2 rounded-lg border text-xs ${style.bg} ${style.border} ${style.text}`}>
                              <span className="font-semibold truncate">{event.title}</span>
                              {event.time && <span className="font-mono text-[10px] opacity-75">{event.time}</span>}
                            </div>
                          );
                        })}

                        {/* AI Blocks */}
                        {dayBlocks.map((block) => {
                          const colors = BLOCK_COLORS[block.type] ?? BLOCK_COLORS.study;
                          return (
                            <div key={block.id} className={`flex items-center justify-between p-2 rounded-lg border text-xs ${colors.chip} ${block.done ? 'opacity-40 line-through' : ''}`}>
                              <span className="font-medium truncate">{block.title}</span>
                              <span className="font-mono text-[10px] opacity-75 shrink-0">{block.startTime}–{block.endTime}</span>
                            </div>
                          );
                        })}

                        {/* Tasks */}
                        {dayTasks.map((task) => (
                          <div key={task.id} className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/5 text-xs text-ink-primary">
                            <button onClick={() => toggleTask(task.id)} className="text-ink-muted hover:text-accent-mint transition-colors shrink-0">
                              {task.completed ? <CheckCircle2 size={13} className="text-accent-mint" /> : <Circle size={13} />}
                            </button>
                            <span className={`truncate ${task.completed ? 'line-through text-ink-faint' : 'font-medium'}`}>{task.title}</span>
                          </div>
                        ))}

                        {dayEvents.length === 0 && dayBlocks.length === 0 && dayTasks.length === 0 && (
                          <p className="text-xs text-ink-muted italic pl-1">No scheduled items</p>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {viewMode === 'month' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-semibold text-lg text-ink-primary">
                  Monthly Agenda ({cursor.toLocaleDateString([], { month: 'long', year: 'numeric' })})
                </h3>
              </div>
              <Card className="p-4 border border-white/5 bg-base-panel/10 backdrop-blur-md shadow-glass">
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                  {Array.from({ length: new Date(year, month + 1, 0).getDate() }, (_, i) => i + 1).map((dayNum) => {
                    const d = new Date(year, month, dayNum);
                    const dayKey = toLocalDateString(d);
                    const dayTasks = tasks.filter((t) => t.dueDate === dayKey);
                    const dayEvents = events.filter((e) => e.date === dayKey);
                    const dayBlocks = blocks.filter((b) => b.date === dayKey);

                    if (dayTasks.length === 0 && dayEvents.length === 0 && dayBlocks.length === 0) return null;

                    return (
                      <div key={dayKey} className="flex gap-4 p-2.5 rounded-xl border border-white/5 bg-white/5 hover:border-accent-cyan/30 transition-all">
                        <button
                          onClick={() => {
                            setSelectedKey(dayKey);
                            setViewMode('day');
                          }}
                          className="w-16 shrink-0 text-center border-r border-white/5 pr-3 hover:text-accent-cyan transition-colors"
                        >
                          <p className="text-[10px] uppercase font-bold text-ink-muted">{d.toLocaleDateString([], { weekday: 'short' })}</p>
                          <p className="text-lg font-bold text-ink-primary leading-tight">{dayNum}</p>
                        </button>
                        <div className="flex-1 space-y-1.5 min-w-0 self-center">
                          {dayEvents.map(e => (
                            <div key={e.id} className="text-xs text-accent-cyan flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan shrink-0" />
                              <span className="truncate text-ink-primary font-medium">{e.title}</span>
                              {e.time && <span className="text-[9px] font-mono text-ink-muted">({e.time})</span>}
                            </div>
                          ))}
                          {dayBlocks.map(b => (
                            <div key={b.id} className={`text-xs text-emerald-400 flex items-center gap-1.5 ${b.done ? 'opacity-40 line-through' : ''}`}>
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                              <span className="truncate text-ink-primary font-medium">{b.title}</span>
                              <span className="text-[9px] font-mono text-ink-muted">({b.startTime})</span>
                            </div>
                          ))}
                          {dayTasks.map(t => (
                            <div key={t.id} className={`text-xs flex items-center gap-1.5 ${t.completed ? 'text-ink-faint line-through' : 'text-accent-amber'}`}>
                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${t.completed ? 'bg-ink-faint' : 'bg-accent-amber'}`} />
                              <span className="truncate text-ink-primary font-medium">{t.title}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  {Array.from({ length: new Date(year, month + 1, 0).getDate() }, (_, i) => i + 1).every((dayNum) => {
                    const d = new Date(year, month, dayNum);
                    const dayKey = toLocalDateString(d);
                    return tasks.filter(t => t.dueDate === dayKey).length === 0 &&
                           events.filter(e => e.date === dayKey).length === 0 &&
                           blocks.filter(b => b.date === dayKey).length === 0;
                  }) && (
                    <p className="text-sm text-ink-muted italic text-center py-8">No scheduled items for this month</p>
                  )}
                </div>
              </Card>
            </div>
          )}
        </main>
      </div>

      <AddEventModal defaultDate={selectedKey} />
    </div>
  );
}
