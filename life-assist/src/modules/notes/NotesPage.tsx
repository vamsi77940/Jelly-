import { useState, useMemo } from 'react';
import { Plus, NotebookPen, Filter, Archive } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { useNotesStore } from '@/store/useNotesStore';
import { useUIStore } from '@/store/useUIStore';
import { listStagger } from '@/lib/animation';
import { NoteCard } from './NoteCard';
import { AddNoteModal } from './AddNoteModal';
import type { NoteCategory } from '@/types';

type Tab = 'active' | 'archived';

export function NotesPage() {
  const notes = useNotesStore((s) => s.notes);
  const openModal = useUIStore((s) => s.openModal);
  
  const [activeTab, setActiveTab] = useState<Tab>('active');
  const [categoryFilter, setCategoryFilter] = useState<NoteCategory | 'all'>('all');

  const filteredNotes = useMemo(() => {
    let filtered = notes.filter(n => activeTab === 'archived' ? n.archived : !n.archived);
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(n => n.category === categoryFilter);
    }
    // Sort: Pinned first, then by date (newest first)
    return filtered.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [notes, activeTab, categoryFilter]);

  return (
    <div className="space-y-6 pt-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-display font-semibold tracking-tight">Notes</h1>
        <div className="flex items-center gap-3">
          <div className="flex bg-white/5 border border-white/10 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('active')}
              className={`px-4 py-1.5 rounded-lg text-sm transition-colors ${activeTab === 'active' ? 'bg-white/10 text-white' : 'text-ink-muted hover:text-white'}`}
            >
              Notes
            </button>
            <button
              onClick={() => setActiveTab('archived')}
              className={`px-4 py-1.5 rounded-lg text-sm transition-colors ${activeTab === 'archived' ? 'bg-white/10 text-white' : 'text-ink-muted hover:text-white'} flex items-center gap-1.5`}
            >
              <Archive size={14} /> Archived
            </button>
          </div>
          <Button icon={<Plus size={16} />} onClick={() => openModal('addNote')}>
            New note
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-6">
        <Filter size={14} className="text-ink-muted" />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as NoteCategory | 'all')}
          className="bg-transparent text-sm text-ink-muted outline-none cursor-pointer appearance-none"
        >
          <option value="all" className="bg-base-bg text-ink-primary">All Categories</option>
          <option value="general" className="bg-base-bg text-ink-primary">General</option>
          <option value="study" className="bg-base-bg text-ink-primary">Study</option>
          <option value="work" className="bg-base-bg text-ink-primary">Work</option>
          <option value="personal" className="bg-base-bg text-ink-primary">Personal</option>
          <option value="idea" className="bg-base-bg text-ink-primary">Idea</option>
        </select>
      </div>

      {filteredNotes.length === 0 ? (
        <EmptyState
          icon={<NotebookPen size={32} />}
          title={activeTab === 'archived' ? "No archived notes" : "No notes found"}
          hint={activeTab === 'archived' ? "Archived notes will appear here." : "Capture an idea, a study summary, or a quick thought."}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map((note, i) => (
            <NoteCard key={note.id} note={note} style={listStagger(i)} />
          ))}
        </div>
      )}

      <AddNoteModal />
    </div>
  );
}
