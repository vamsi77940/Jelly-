import { create } from 'zustand';
import { readJSON, writeJSON } from '@/lib/storage';
import { createId } from '@/lib/id';
import type { Note, NoteCategory } from '@/types';

interface NewNoteInput {
  title: string;
  content: string;
  category: NoteCategory;
}

interface NotesState {
  notes: Note[];
  hydrate: () => void;
  addNote: (input: NewNoteInput) => Note;
  updateNote: (id: string, updates: Partial<Note>) => void;
  togglePinNote: (id: string) => void;
  toggleArchiveNote: (id: string) => void;
  deleteNote: (id: string) => void;
}

function persist(notes: Note[]) {
  writeJSON('notes', notes);
}

export const useNotesStore = create<NotesState>((set, get) => ({
  notes: readJSON<Note[]>('notes', []),

  hydrate: () => set({ notes: readJSON<Note[]>('notes', []) }),

  addNote: (input) => {
    const now = new Date().toISOString();
    const note: Note = {
      id: createId(),
      title: input.title.trim(),
      content: input.content.trim(),
      category: input.category,
      pinned: false,
      archived: false,
      createdAt: now,
      updatedAt: now,
    };
    const notes = [note, ...get().notes];
    set({ notes });
    persist(notes);
    return note;
  },

  updateNote: (id, updates) => {
    const notes = get().notes.map((n) => 
      n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n
    );
    set({ notes });
    persist(notes);
  },

  togglePinNote: (id) => {
    const notes = get().notes.map((n) =>
      n.id === id ? { ...n, pinned: !n.pinned, updatedAt: new Date().toISOString() } : n
    );
    set({ notes });
    persist(notes);
  },

  toggleArchiveNote: (id) => {
    const notes = get().notes.map((n) =>
      n.id === id ? { ...n, archived: !n.archived, updatedAt: new Date().toISOString() } : n
    );
    set({ notes });
    persist(notes);
  },

  deleteNote: (id) => {
    const notes = get().notes.filter((n) => n.id !== id);
    set({ notes });
    persist(notes);
  },
}));
