import { useState, useEffect } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Field, inputClass } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { TipTapEditor } from '@/components/ui/TipTapEditor';
import { useNotesStore } from '@/store/useNotesStore';
import { useUIStore } from '@/store/useUIStore';
import { getClient } from '@/store/useAssistantStore';
import type { NoteCategory } from '@/types';

export function AddNoteModal() {
  const isOpen = useUIStore((s) => s.activeModal === 'addNote');
  const modalPayload = useUIStore((s) => s.modalPayload);
  const closeModal = useUIStore((s) => s.closeModal);
  const showToast = useUIStore((s) => s.showToast);
  
  const notes = useNotesStore((s) => s.notes);
  const addNote = useNotesStore((s) => s.addNote);
  const updateNote = useNotesStore((s) => s.updateNote);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<NoteCategory>('general');
  const [isSummarizing, setIsSummarizing] = useState(false);

  const editMode = typeof modalPayload === 'string';
  const noteToEdit = editMode ? notes.find(n => n.id === modalPayload) : null;

  useEffect(() => {
    if (isOpen) {
      if (noteToEdit) {
        setTitle(noteToEdit.title);
        setContent(noteToEdit.content);
        setCategory(noteToEdit.category);
      } else {
        reset();
      }
    }
  }, [isOpen, noteToEdit]);

  function reset() {
    setTitle('');
    setContent('');
    setCategory('general');
    setIsSummarizing(false);
  }

  async function handleSummarize() {
    const plainContent = content.replace(/<[^>]*>?/gm, '').trim();
    if (!plainContent) {
      showToast('Please write some content to summarize first.', 'warning');
      return;
    }
    
    setIsSummarizing(true);
    try {
      const client = getClient();
      const response = await client.send([], `Please summarize the following note briefly and professionally. Return ONLY the summary text:\n\n${plainContent}`);
      setContent((prev) => `<p><strong>✨ AI Summary:</strong> ${response}</p><hr/>${prev}`);
      showToast('Summary added!', 'success');
    } catch (e) {
      showToast('Failed to generate summary.', 'warning');
    } finally {
      setIsSummarizing(false);
    }
  }

  function handleSubmit() {
    const plainContent = content.replace(/<[^>]*>?/gm, '').trim();
    if (!title.trim() || !plainContent) return;
    
    if (editMode && noteToEdit) {
      updateNote(noteToEdit.id, { title, content, category });
      showToast('Note updated.', 'success');
    } else {
      addNote({ title, content, category });
      showToast('Note added.', 'success');
    }
    
    reset();
    closeModal();
  }

  return (
    <Modal
      title={editMode ? "Edit note" : "New note"}
      isOpen={isOpen}
      onClose={() => {
        reset();
        closeModal();
      }}
      footer={
        <div className="flex w-full items-center justify-between">
          <Button 
            variant="secondary" 
            onClick={handleSummarize} 
            disabled={isSummarizing || !content.replace(/<[^>]*>?/gm, '').trim()}
            className="text-accent-cyan"
            icon={isSummarizing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          >
            {isSummarizing ? 'Summarizing...' : 'Summarize'}
          </Button>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!title.trim() || !content.replace(/<[^>]*>?/gm, '').trim()}>
              {editMode ? "Save changes" : "Save note"}
            </Button>
          </div>
        </div>
      }
    >
      <Field label="Title" htmlFor="note-title">
        <input
          id="note-title"
          className={inputClass}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
        />
      </Field>
      <Field label="Content" htmlFor="note-content">
        <TipTapEditor content={content} onChange={setContent} />
      </Field>
      <Field label="Category" htmlFor="note-category">
        <select
          id="note-category"
          className={inputClass}
          value={category}
          onChange={(e) => setCategory(e.target.value as NoteCategory)}
        >
          <option value="general">General</option>
          <option value="study">Study</option>
          <option value="work">Work</option>
          <option value="personal">Personal</option>
          <option value="idea">Idea</option>
        </select>
      </Field>
    </Modal>
  );
}
