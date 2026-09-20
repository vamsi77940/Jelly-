import { create } from 'zustand';
import { createId } from '@/lib/id';
import type { ToastMessage } from '@/types';

export type ModalName =
  | 'addTask'
  | 'addNote'
  | 'addAlarm'
  | 'editMorningAlarm'
  | 'addHabit'
  | 'addGoal'
  | 'addEvent'
  | null;

interface UIState {
  toasts: ToastMessage[];
  activeModal: ModalName;
  modalPayload: any; // Used to pass IDs (like taskId for editing)
  showToast: (text: string, tone?: ToastMessage['tone']) => void;
  dismissToast: (id: string) => void;
  openModal: (modal: Exclude<ModalName, null>, payload?: any) => void;
  closeModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  toasts: [],
  activeModal: null,
  modalPayload: null,
  showToast: (text, tone = 'default') => {
    const id = createId();
    set((state) => ({ toasts: [...state.toasts, { id, text, tone }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 3200);
  },
  dismissToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
  openModal: (modal, payload) => set({ activeModal: modal, modalPayload: payload }),
  closeModal: () => set({ activeModal: null, modalPayload: null }),
}));
