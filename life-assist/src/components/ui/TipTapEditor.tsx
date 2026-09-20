import { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, List, ListOrdered, Quote, Heading2 } from 'lucide-react';
import { IconButton } from './IconButton';

interface TipTapEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export function TipTapEditor({ content, onChange, placeholder = 'Write your thoughts...' }: TipTapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base focus:outline-none min-h-[150px] max-h-[400px] overflow-y-auto text-ink-primary',
      },
    },
  });

  // Sync external content changes into the editor (e.g., when opening an existing note)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [editor, content]);

  if (!editor) return null;

  return (
    <div className="border border-white/10 rounded-2xl bg-base-panel/30 overflow-hidden flex flex-col focus-within:border-accent-cyan/50 focus-within:ring-1 focus-within:ring-accent-cyan transition-all">
      <div className="flex items-center gap-1 border-b border-white/10 bg-white/5 px-2 py-1 flex-wrap">
        <IconButton
          icon={<Bold size={16} />}
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'bg-white/10 text-accent-cyan' : 'text-ink-muted'}
          label="Bold"
        />
        <IconButton
          icon={<Italic size={16} />}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'bg-white/10 text-accent-cyan' : 'text-ink-muted'}
          label="Italic"
        />
        <IconButton
          icon={<Heading2 size={16} />}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive('heading', { level: 2 }) ? 'bg-white/10 text-accent-cyan' : 'text-ink-muted'}
          label="Heading 2"
        />
        <div className="w-px h-4 bg-white/10 mx-1" />
        <IconButton
          icon={<List size={16} />}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? 'bg-white/10 text-accent-cyan' : 'text-ink-muted'}
          label="Bullet List"
        />
        <IconButton
          icon={<ListOrdered size={16} />}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive('orderedList') ? 'bg-white/10 text-accent-cyan' : 'text-ink-muted'}
          label="Numbered List"
        />
        <IconButton
          icon={<Quote size={16} />}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={editor.isActive('blockquote') ? 'bg-white/10 text-accent-cyan' : 'text-ink-muted'}
          label="Quote"
        />
      </div>
      <div className="p-4 cursor-text" onClick={() => editor.commands.focus()}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
