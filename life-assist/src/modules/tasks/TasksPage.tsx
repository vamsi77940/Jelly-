import { useState, useMemo } from 'react';
import { Plus, ListChecks, ArrowUpDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { useTasksStore } from '@/store/useTasksStore';
import { useUIStore } from '@/store/useUIStore';
import { TaskRow } from './TaskRow';
import { AddTaskModal } from './AddTaskModal';
import type { Task } from '@/types';

type SortOption = 'createdAt' | 'dueDate' | 'priority';

const PRIORITY_WEIGHT: Record<Task['priority'], number> = {
  high: 3,
  medium: 2,
  low: 1,
};

export function TasksPage() {
  const tasks = useTasksStore((s) => s.tasks);
  const openModal = useUIStore((s) => s.openModal);
  const [sortBy, setSortBy] = useState<SortOption>('createdAt');

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      if (sortBy === 'dueDate') {
        const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        return dateA - dateB;
      }
      if (sortBy === 'priority') {
        return PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
      }
      // default: createdAt descending
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [tasks, sortBy]);

  const pending = sortedTasks.filter((t) => !t.completed);
  const done = sortedTasks.filter((t) => t.completed);

  return (
    <div className="space-y-6 pt-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-display font-semibold tracking-tight">Tasks</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-ink-muted bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
            <ArrowUpDown size={14} />
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-transparent outline-none cursor-pointer appearance-none text-ink-primary"
            >
              <option value="createdAt" className="bg-base-bg text-ink-primary">Latest</option>
              <option value="dueDate" className="bg-base-bg text-ink-primary">Due Date</option>
              <option value="priority" className="bg-base-bg text-ink-primary">Priority</option>
            </select>
          </div>
          <Button icon={<Plus size={16} />} onClick={() => openModal('addTask')}>
            Add task
          </Button>
        </div>
      </div>

      {tasks.length === 0 ? (
        <EmptyState
          icon={<ListChecks size={32} />}
          title="No tasks yet"
          hint="Add your first task and LifeAssist will help you track it, and later, prioritize it for you."
        />
      ) : (
        <div className="space-y-8">
          {pending.length > 0 && (
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {pending.map((task) => (
                  <motion.div
                    key={task.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <TaskRow task={task} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
          {done.length > 0 && (
            <div>
              <h2 className="text-xs uppercase tracking-wide text-ink-faint mb-3">
                Completed ({done.length})
              </h2>
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {done.map((task) => (
                    <motion.div
                      key={task.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                    >
                      <TaskRow task={task} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>
      )}

      <AddTaskModal />
    </div>
  );
}
