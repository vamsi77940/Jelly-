import { Trash2, Edit2, Pin, Archive } from 'lucide-react';
import type { CSSProperties } from 'react';
import { IconButton } from '@/components/ui/IconButton';
import { Card } from '@/components/ui/Card';
import { formatShortDate } from '@/lib/time';
import { useNotesStore } from '@/store/useNotesStore';
import { useUIStore } from '@/store/useUIStore';
import type { Note } from '@/types';

const CATEGORY_LABEL: Record<Note['category'], string> = {
  general: 'General',
  study: 'Study',
  work: 'Work',
  personal: 'Personal',
  idea: 'Idea',
};

export function NoteCard({ note, style }: { note: Note; style?: CSSProperties }) {
  const deleteNote = useNotesStore((s) => s.deleteNote);
  const togglePinNote = useNotesStore((s) => s.togglePinNote);
  const toggleArchiveNote = useNotesStore((s) => s.toggleArchiveNote);
  const showToast = useUIStore((s) => s.showToast);
  const openModal = useUIStore((s) => s.openModal);

  return (
    <Card
      className={`group flex flex-col hover:border-accent-cyan/30 transition-colors animate-fadeUp ${note.pinned ? 'border-accent-cyan/20 bg-accent-cyan/5' : ''}`}
      style={style}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-medium leading-snug flex items-center gap-2">
          {note.title}
          {note.pinned && <Pin size={12} className="text-accent-cyan" />}
        </h3>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
          <IconButton
            label={note.pinned ? "Unpin note" : "Pin note"}
            icon={<Pin size={15} />}
            onClick={() => togglePinNote(note.id)}
            className={note.pinned ? "text-accent-cyan bg-accent-cyan/10" : "text-ink-muted hover:text-accent-cyan hover:bg-accent-cyan/10"}
          />
          <IconButton
            label={note.archived ? "Unarchive note" : "Archive note"}
            icon={<Archive size={15} />}
            onClick={() => {
              toggleArchiveNote(note.id);
              showToast(note.archived ? 'Note unarchived.' : 'Note archived.');
            }}
            className={note.archived ? "text-accent-amber bg-accent-amber/10" : "text-ink-muted hover:text-accent-amber hover:bg-accent-amber/10"}
          />
          <IconButton
            label={`Edit note "${note.title}"`}
            icon={<Edit2 size={15} />}
            onClick={() => openModal('addNote', note.id)}
            className="text-ink-muted hover:text-accent-cyan hover:bg-accent-cyan/10"
          />
          <IconButton
            label={`Delete note "${note.title}"`}
            icon={<Trash2 size={15} />}
            onClick={() => {
              deleteNote(note.id);
              showToast('Note deleted.');
            }}
            className="text-ink-muted hover:text-accent-rose hover:bg-accent-rose/10"
          />
        </div>
      </div>
      <span className="self-start text-[11px] uppercase tracking-wide text-accent-cyan/80 bg-accent-cyanSoft rounded-full px-2 py-0.5 mb-3">
        {CATEGORY_LABEL[note.category]}
      </span>
      {/* HTML content from TipTap */}
      <div 
        className="prose prose-sm prose-invert text-ink-muted flex-1 line-clamp-6 mb-3 opacity-90"
        dangerouslySetInnerHTML={{ __html: note.content }} 
      />
      <p className="text-xs text-ink-faint mt-auto">{formatShortDate(note.createdAt)}</p>
    </Card>
  );
}
