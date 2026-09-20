import { create } from 'zustand';
import { readJSON, writeJSON } from '@/lib/storage';
import { createId } from '@/lib/id';
import type { CalendarEvent, EventCategory } from '@/types';

interface NewEventInput {
  title: string;
  date: string;
  time: string | null;
  category: EventCategory;
}

interface CalendarState {
  events: CalendarEvent[];
  hydrate: () => void;
  addEvent: (input: NewEventInput) => CalendarEvent;
  deleteEvent: (id: string) => void;
}

function persist(events: CalendarEvent[]) {
  writeJSON('calendarEvents', events);
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
  events: readJSON<CalendarEvent[]>('calendarEvents', []),

  hydrate: () => set({ events: readJSON<CalendarEvent[]>('calendarEvents', []) }),

  addEvent: (input) => {
    const event: CalendarEvent = {
      id: createId(),
      title: input.title.trim(),
      date: input.date,
      time: input.time,
      category: input.category,
      createdAt: new Date().toISOString(),
    };
    const events = [...get().events, event];
    set({ events });
    persist(events);
    return event;
  },

  deleteEvent: (id) => {
    const events = get().events.filter((e) => e.id !== id);
    set({ events });
    persist(events);
  },
}));
