import { create } from 'zustand';
import { readJSON, writeJSON } from '@/lib/storage';
import { createId } from '@/lib/id';
import type { ScheduleBlock, ScheduleBlockType } from '@/types';

interface NewBlockInput {
  title: string;
  type: ScheduleBlockType;
  date: string;
  startTime: string;
  endTime: string;
  linkedGoalId?: string | null;
  notes?: string;
  aiGenerated?: boolean;
}

interface ScheduleState {
  blocks: ScheduleBlock[];
  hydrate: () => void;
  addBlock: (input: NewBlockInput) => ScheduleBlock;
  deleteBlock: (id: string) => void;
  updateBlock: (id: string, patch: Partial<ScheduleBlock>) => void;
  markDone: (id: string) => void;
  replaceAiBlocks: (inputs: NewBlockInput[]) => ScheduleBlock[];
  getBlocksForDate: (date: string) => ScheduleBlock[];
  getBlocksForWeek: (weekStart: string) => ScheduleBlock[];
  getBlocksForMonth: (yearMonth: string) => ScheduleBlock[];
}

function persist(blocks: ScheduleBlock[]) {
  writeJSON('scheduleBlocks', blocks);
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

export const useScheduleStore = create<ScheduleState>((set, get) => ({
  blocks: readJSON<ScheduleBlock[]>('scheduleBlocks', []),

  hydrate: () => set({ blocks: readJSON<ScheduleBlock[]>('scheduleBlocks', []) }),

  addBlock: (input) => {
    const block: ScheduleBlock = {
      id: createId(),
      title: input.title,
      type: input.type,
      date: input.date,
      startTime: input.startTime,
      endTime: input.endTime,
      linkedGoalId: input.linkedGoalId ?? null,
      notes: input.notes ?? '',
      createdAt: new Date().toISOString(),
      aiGenerated: input.aiGenerated ?? false,
      done: false,
    };
    const blocks = [...get().blocks, block];
    set({ blocks });
    persist(blocks);
    return block;
  },

  deleteBlock: (id) => {
    const blocks = get().blocks.filter((b) => b.id !== id);
    set({ blocks });
    persist(blocks);
  },

  updateBlock: (id, patch) => {
    const blocks = get().blocks.map((b) => (b.id === id ? { ...b, ...patch } : b));
    set({ blocks });
    persist(blocks);
  },

  markDone: (id) => {
    const blocks = get().blocks.map((b) => (b.id === id ? { ...b, done: true } : b));
    set({ blocks });
    persist(blocks);
  },

  replaceAiBlocks: (inputs) => {
    // Remove all previously AI-generated blocks, add new ones
    const manual = get().blocks.filter((b) => !b.aiGenerated);
    const newBlocks: ScheduleBlock[] = inputs.map((input) => ({
      id: createId(),
      title: input.title,
      type: input.type,
      date: input.date,
      startTime: input.startTime,
      endTime: input.endTime,
      linkedGoalId: input.linkedGoalId ?? null,
      notes: input.notes ?? '',
      createdAt: new Date().toISOString(),
      aiGenerated: true,
      done: false,
    }));
    const blocks = [...manual, ...newBlocks];
    set({ blocks });
    persist(blocks);
    return newBlocks;
  },

  getBlocksForDate: (date) => get().blocks.filter((b) => b.date === date),

  getBlocksForWeek: (weekStart) => {
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    return get().blocks.filter((b) => days.includes(b.date));
  },

  getBlocksForMonth: (yearMonth) =>
    get().blocks.filter((b) => b.date.startsWith(yearMonth)),
}));
