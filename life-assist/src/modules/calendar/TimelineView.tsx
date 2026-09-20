import { Clock, Plus, Trash2, CheckCircle2, Circle } from 'lucide-react';
import type { Task, CalendarEvent, EventCategory } from '@/types';
import { IconButton } from '@/components/ui/IconButton';
import { formatTimeString, toLocalDateString } from '@/lib/time';

interface TimelineViewProps {
  dateKey: string;
  tasks: Task[];
  events: CalendarEvent[];
  onHourClick: (time: string) => void;
  onDeleteEvent: (id: string) => void;
  onToggleTask: (id: string) => void;
}

const CATEGORY_COLORS: Record<EventCategory, { bg: string; border: string; text: string }> = {
  work: {
    bg: 'bg-accent-indigo/10 hover:bg-accent-indigo/20',
    border: 'border-accent-indigo/30',
    text: 'text-accent-indigo',
  },
  personal: {
    bg: 'bg-accent-mint/10 hover:bg-accent-mint/20',
    border: 'border-accent-mint/30',
    text: 'text-accent-mint',
  },
  health: {
    bg: 'bg-accent-rose/10 hover:bg-accent-rose/20',
    border: 'border-accent-rose/30',
    text: 'text-accent-rose',
  },
  study: {
    bg: 'bg-accent-cyan/10 hover:bg-accent-cyan/20',
    border: 'border-accent-cyan/30',
    text: 'text-accent-cyan',
  },
  other: {
    bg: 'bg-accent-cyan/10 hover:bg-accent-cyan/20',
    border: 'border-accent-cyan/30',
    text: 'text-accent-cyan',
  },
};

export function TimelineView({
  dateKey,
  tasks,
  events,
  onHourClick,
  onDeleteEvent,
  onToggleTask,
}: TimelineViewProps) {
  // Hours to show in timeline: 7 AM to 10 PM
  const hours = Array.from({ length: 16 }, (_, i) => i + 7);

  // Group timed items by hour
  const timedTasks = tasks.filter((t) => t.dueDate === dateKey && t.dueTime);
  const timedEvents = events.filter((e) => e.date === dateKey && e.time);

  // Untimed items (all-day/anytime)
  const untimedTasks = tasks.filter((t) => t.dueDate === dateKey && !t.dueTime);
  const untimedEvents = events.filter((e) => e.date === dateKey && !e.time);

  function getItemsForHour(hour: number) {
    const hourStr = hour.toString().padStart(2, '0');
    
    const matchedEvents = timedEvents.filter((e) => e.time?.startsWith(`${hourStr}:`));
    const matchedTasks = timedTasks.filter((t) => t.dueTime?.startsWith(`${hourStr}:`));

    return {
      events: matchedEvents,
      tasks: matchedTasks,
    };
  }

  const isTodaySelected = dateKey === toLocalDateString();
  const currentHour = new Date().getHours();
  const currentMinutes = new Date().getMinutes();

  return (
    <div className="space-y-6">
      {/* Anytime / All-Day Header Section */}
      {(untimedEvents.length > 0 || untimedTasks.length > 0) && (
        <div className="rounded-2xl border border-white/5 bg-base-panel/20 p-4 backdrop-blur-md shadow-glass">
          <h4 className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-3">Anytime Today</h4>
          <div className="space-y-2">
            {untimedEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl border border-white/5 bg-white/5 text-sm"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="h-2 w-2 rounded-full bg-accent-cyan shadow-glow" />
                  <span className="font-medium truncate">{event.title}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md border border-white/10 text-ink-muted uppercase font-mono">
                    {event.category}
                  </span>
                </div>
                <IconButton
                  label="Delete event"
                  icon={<Trash2 size={14} />}
                  onClick={() => onDeleteEvent(event.id)}
                  className="text-ink-muted hover:text-accent-rose hover:bg-accent-rose/10"
                />
              </div>
            ))}
            {untimedTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between gap-3 px-3.5 py-2 rounded-xl border border-white/5 bg-white/5 text-sm"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <button onClick={() => onToggleTask(task.id)} className="text-ink-muted hover:text-accent-mint transition-colors">
                    {task.completed ? <CheckCircle2 size={16} className="text-accent-mint" /> : <Circle size={16} />}
                  </button>
                  <span className={`truncate ${task.completed ? 'line-through text-ink-faint' : 'font-medium'}`}>{task.title}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-accent-amber/10 border border-accent-amber/20 text-accent-amber uppercase font-mono">
                    Task
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hourly Timeline Grid */}
      <div className="relative border border-white/5 bg-base-panel/30 rounded-3xl p-5 backdrop-blur-md shadow-glass overflow-hidden">
        {/* Current Time Indicator Line */}
        {isTodaySelected && currentHour >= 7 && currentHour <= 22 && (
          <div
            className="absolute left-[70px] right-5 h-[1.5px] bg-accent-rose z-20 pointer-events-none flex items-center"
            style={{
              top: `${((currentHour - 7) * 72) + 24 + ((currentMinutes / 60) * 72)}px`,
            }}
          >
            <span className="absolute -left-1.5 w-3 h-3 rounded-full bg-accent-rose shadow-[0_0_8px_rgba(255,59,48,0.5)]" />
          </div>
        )}

        <div className="space-y-0.5">
          {hours.map((hour) => {
            const { events: hourEvents, tasks: hourTasks } = getItemsForHour(hour);
            const hourLabel = formatTimeString(`${hour.toString().padStart(2, '0')}:00`);

            return (
              <div key={hour} className="flex gap-4 min-h-[72px] relative group/hour">
                {/* Time Label */}
                <div className="w-12 text-right pt-1 text-xs font-mono font-medium text-ink-muted">
                  {hourLabel}
                </div>

                {/* Vertical Divider line */}
                <div className="relative w-px bg-white/5 flex justify-center">
                  <div className="absolute top-0 bottom-0 w-[1px] bg-white/5 group-hover/hour:bg-accent-cyan/15 transition-colors" />
                </div>

                {/* Hourly Slots Content */}
                <div className="flex-1 pb-4 flex flex-col gap-2 relative">
                  {hourEvents.length === 0 && hourTasks.length === 0 ? (
                    <button
                      onClick={() => onHourClick(`${hour.toString().padStart(2, '0')}:00`)}
                      className="absolute inset-0 flex items-center justify-end pr-4 opacity-0 group-hover/hour:opacity-100 transition-opacity text-xs text-accent-cyan font-medium gap-1 hover:underline cursor-pointer"
                    >
                      <Plus size={12} /> Add event
                    </button>
                  ) : (
                    <div className="flex flex-col gap-1.5 z-10">
                      {hourEvents.map((event) => {
                        const style = CATEGORY_COLORS[event.category] || CATEGORY_COLORS.other;
                        return (
                          <div
                            key={event.id}
                            className={`flex items-center justify-between gap-3 px-3.5 py-2 rounded-xl border ${style.bg} ${style.border} ${style.text} text-sm transition-all shadow-sm`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <Clock size={12} className="shrink-0" />
                              <span className="font-mono text-xs opacity-75">{event.time}</span>
                              <span className="font-medium truncate text-ink-primary">{event.title}</span>
                            </div>
                            <IconButton
                              label="Delete event"
                              icon={<Trash2 size={13} />}
                              onClick={() => onDeleteEvent(event.id)}
                              className="opacity-0 group-hover/hour:opacity-100 text-ink-muted hover:text-accent-rose hover:bg-accent-rose/10 transition-opacity"
                            />
                          </div>
                        );
                      })}
                      {hourTasks.map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center justify-between gap-3 px-3.5 py-2 rounded-xl border border-accent-amber/20 bg-accent-amber/5 text-accent-amber text-sm transition-all shadow-sm"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <button onClick={() => onToggleTask(task.id)} className="text-ink-muted hover:text-accent-mint transition-colors">
                              {task.completed ? <CheckCircle2 size={14} className="text-accent-mint" /> : <Circle size={14} />}
                            </button>
                            <span className="font-mono text-xs opacity-75">{task.dueTime}</span>
                            <span className={`truncate text-ink-primary ${task.completed ? 'line-through opacity-50' : 'font-medium'}`}>
                              {task.title}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
