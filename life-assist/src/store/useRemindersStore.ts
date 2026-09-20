import { create } from 'zustand';
import { readJSON, writeJSON } from '@/lib/storage';
import { createId } from '@/lib/id';
import type { Alarm, AlarmRepeat, MorningAlarm } from '@/types';

interface NewAlarmInput {
  title: string;
  time: string;
  repeat: AlarmRepeat;
  linkedTaskId?: string;
}

interface RemindersState {
  alarms: Alarm[];
  morningAlarm: MorningAlarm;
  hydrate: () => void;
  addAlarm: (input: NewAlarmInput) => Alarm;
  deleteAlarm: (id: string) => void;
  toggleAlarm: (id: string) => void;
  setMorningAlarmTime: (time: string) => void;
  toggleMorningAlarm: (enabled: boolean) => void;
}

function persistAlarms(alarms: Alarm[]) {
  writeJSON('alarms', alarms);
}

function persistMorning(morningAlarm: MorningAlarm) {
  writeJSON('morningAlarm', morningAlarm);
}

export const useRemindersStore = create<RemindersState>((set, get) => ({
  alarms: readJSON<Alarm[]>('alarms', []),
  morningAlarm: readJSON<MorningAlarm>('morningAlarm', { time: '07:00', enabled: true }),

  hydrate: () =>
    set({
      alarms: readJSON<Alarm[]>('alarms', []),
      morningAlarm: readJSON<MorningAlarm>('morningAlarm', { time: '07:00', enabled: true }),
    }),

  addAlarm: (input) => {
    const alarm: Alarm = {
      id: createId(),
      title: input.title.trim(),
      time: input.time,
      repeat: input.repeat,
      enabled: true,
      createdAt: new Date().toISOString(),
      linkedTaskId: input.linkedTaskId,
    };
    const alarms = [...get().alarms, alarm];
    set({ alarms });
    persistAlarms(alarms);
    return alarm;
  },

  deleteAlarm: (id) => {
    const alarms = get().alarms.filter((a) => a.id !== id);
    set({ alarms });
    persistAlarms(alarms);
  },

  toggleAlarm: (id) => {
    const alarms = get().alarms.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a));
    set({ alarms });
    persistAlarms(alarms);
  },

  setMorningAlarmTime: (time) => {
    const morningAlarm = { ...get().morningAlarm, time };
    set({ morningAlarm });
    persistMorning(morningAlarm);
  },

  toggleMorningAlarm: (enabled) => {
    const morningAlarm = { ...get().morningAlarm, enabled };
    set({ morningAlarm });
    persistMorning(morningAlarm);
  },
}));
