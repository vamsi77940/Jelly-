import { Trash2, Clock, Edit2 } from 'lucide-react';
import { IconButton } from '@/components/ui/IconButton';
import { formatShortDate, isOverdue, formatTimeString, toLocalDateString } from '@/lib/time';
import { useTasksStore } from '@/store/useTasksStore';
import { useUIStore } from '@/store/useUIStore';
import { useProgressStore } from '@/store/useProgressStore';
import type { Task } from '@/types';

const PRIORITY_DOT: Record<Task['priority'], string> = {
  high: 'bg-accent-rose',
  medium: 'bg-accent-amber',
  low: 'bg-accent-cyan',
};

export function TaskRow({ task }: { task: Task }) {
  const toggleTask = useTasksStore((s) => s.toggleTask);
  const deleteTask = useTasksStore((s) => s.deleteTask);
  const showToast = useUIStore((s) => s.showToast);
  const addXp = useProgressStore((s) => s.addXp);
  const overdue = !task.completed && isOverdue(task.dueDate, task.dueTime);

  return (
    <div
      className={`group flex items-center gap-4 rounded-2xl border px-5 py-4 transition-all duration-300 ${
        task.completed 
          ? 'bg-base-panel/30 border-white/5 opacity-60' 
          : 'bg-base-panel/60 border-white/10 backdrop-blur-md shadow-glass hover:bg-white/5'
      }`}
    >
      <div className="relative flex items-center justify-center">
        <input
          type="checkbox"
          checked={task.completed}
          onChange={() => {
            toggleTask(task.id);
            if (!task.completed) {
              addXp(10);
              showToast('Task completed. Nice work.', 'success');
            }
          }}
          aria-label={`Mark "${task.title}" as ${task.completed ? 'not done' : 'done'}`}
          className="peer h-6 w-6 appearance-none rounded-full border-[1.5px] border-white/20 checked:border-accent-cyan checked:bg-accent-cyan transition-all outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-base-bg cursor-pointer"
        />
        <svg 
          className="absolute pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity duration-200 text-base-bg w-3.5 h-3.5"
          viewBox="0 0 14 14" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M2.5 7.5L5.5 10.5L11.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      <span
        className={`h-2.5 w-2.5 rounded-full shrink-0 shadow-glow ${PRIORITY_DOT[task.priority]}`}
        role="img"
        aria-label={`${task.priority} priority`}
        title={`${task.priority} priority`}
      />

      <div className="flex-1 min-w-0">
        <p className={`truncate text-base transition-colors ${task.completed ? 'line-through text-ink-faint' : 'text-ink-primary font-medium'}`}>
          {task.title}
        </p>
        {task.dueDate && (
          <p className={`text-sm mt-0.5 ${overdue ? 'text-accent-rose' : 'text-ink-muted'}`}>
            {overdue ? 'Overdue · ' : 'Due '}
            {formatShortDate(task.dueDate)}
            {task.dueTime ? ` at ${formatTimeString(task.dueTime)}` : ''}
          </p>
        )}
      </div>

      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
        <IconButton
          label={`Snooze task "${task.title}"`}
          icon={<Clock size={18} />}
          onClick={() => {
            const currentDueDate = task.dueDate ? new Date(task.dueDate) : new Date();
            const tomorrow = new Date(currentDueDate);
            tomorrow.setDate(tomorrow.getDate() + 1);
            useTasksStore.getState().updateTask(task.id, { dueDate: toLocalDateString(tomorrow) });
            showToast('Task snoozed to tomorrow.');
          }}
          className="text-ink-muted hover:text-accent-amber hover:bg-accent-amber/10"
        />
        <IconButton
          label={`Edit task "${task.title}"`}
          icon={<Edit2 size={18} />}
          onClick={() => useUIStore.getState().openModal('addTask', task.id)}
          className="text-ink-muted hover:text-accent-cyan hover:bg-accent-cyan/10"
        />
        <IconButton
          label={`Delete task "${task.title}"`}
          icon={<Trash2 size={18} />}
          onClick={() => {
            deleteTask(task.id);
            showToast('Task deleted.');
          }}
          className="text-ink-muted hover:text-accent-rose hover:bg-accent-rose/10"
        />
      </div>
    </div>
  );
}
