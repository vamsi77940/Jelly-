import { create } from 'zustand';
import { readJSON, writeJSON } from '@/lib/storage';
import { createId } from '@/lib/id';
import type { Priority, Task, TaskRepeat } from '@/types';

interface NewTaskInput {
  title: string;
  dueDate: string | null;
  dueTime: string | null;
  priority: Priority;
  repeat?: TaskRepeat;
}

interface TasksState {
  tasks: Task[];
  hydrate: () => void;
  addTask: (input: NewTaskInput) => Task;
  updateTask: (id: string, updates: Partial<Task>) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
}

function persist(tasks: Task[]) {
  writeJSON('tasks', tasks);
}

export const useTasksStore = create<TasksState>((set, get) => ({
  tasks: readJSON<Task[]>('tasks', []),

  hydrate: () => set({ tasks: readJSON<Task[]>('tasks', []) }),

  addTask: (input) => {
    const task: Task = {
      id: createId(),
      title: input.title.trim(),
      dueDate: input.dueDate,
      dueTime: input.dueTime,
      priority: input.priority,
      repeat: input.repeat || 'none',
      completed: false,
      createdAt: new Date().toISOString(),
      completedAt: null,
    };
    const tasks = [...get().tasks, task];
    set({ tasks });
    persist(tasks);
    return task;
  },

  updateTask: (id, updates) => {
    const tasks = get().tasks.map((t) => (t.id === id ? { ...t, ...updates } : t));
    set({ tasks });
    persist(tasks);
  },

  toggleTask: (id) => {
    const tasks = get().tasks.map((t) => {
      if (t.id !== id) return t;
      const willComplete = !t.completed;
      
      // If repeating task is completed, instead of completing it, 
      // we could push the dueDate forward. But to keep it simple and standard, 
      // let's mark it complete, and the UI or a cron worker can spawn the next one.
      // For a truly basic implementation, we just mark it complete here. 
      return { ...t, completed: willComplete, completedAt: willComplete ? new Date().toISOString() : null };
    });
    set({ tasks });
    persist(tasks);
  },

  deleteTask: (id) => {
    const tasks = get().tasks.filter((t) => t.id !== id);
    set({ tasks });
    persist(tasks);
  },
}));
