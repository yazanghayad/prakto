'use client';

import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import Placeholder from '@tiptap/extension-placeholder';
import { Icons } from '@/components/icons';
import { Toggle } from '@/components/ui/toggle';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

// ─── Toolbar ─────────────────────────────────────────────────

function ToolbarButton({
  pressed,
  onPressedChange,
  children,
  title
}: {
  pressed: boolean;
  onPressedChange: () => void;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <Toggle
      size='sm'
      pressed={pressed}
      onPressedChange={onPressedChange}
      aria-label={title}
      title={title}
      className='h-8 w-8 p-0'
    >
      {children}
    </Toggle>
  );
}

function EditorToolbar({ editor }: { editor: Editor }) {
  return (
    <div className='bg-muted/50 flex flex-wrap items-center gap-0.5 border-b px-2 py-1.5'>
      {/* ── Text style ─── */}
      <ToolbarButton
        pressed={editor.isActive('bold')}
        onPressedChange={() => editor.chain().focus().toggleBold().run()}
        title='Fet (Ctrl+B)'
      >
        <Icons.bold className='h-4 w-4' />
      </ToolbarButton>
      <ToolbarButton
        pressed={editor.isActive('italic')}
        onPressedChange={() => editor.chain().focus().toggleItalic().run()}
        title='Kursiv (Ctrl+I)'
      >
        <Icons.italic className='h-4 w-4' />
      </ToolbarButton>
      <ToolbarButton
        pressed={editor.isActive('underline')}
        onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
        title='Understruken (Ctrl+U)'
      >
        <Icons.underline className='h-4 w-4' />
      </ToolbarButton>
      <ToolbarButton
        pressed={editor.isActive('strike')}
        onPressedChange={() => editor.chain().focus().toggleStrike().run()}
        title='Genomstruken'
      >
        <Icons.strikethrough className='h-4 w-4' />
      </ToolbarButton>
      <ToolbarButton
        pressed={editor.isActive('highlight')}
        onPressedChange={() => editor.chain().focus().toggleHighlight().run()}
        title='Markera'
      >
        <Icons.highlight className='h-4 w-4' />
      </ToolbarButton>

      <Separator orientation='vertical' className='mx-1 h-6' />

      {/* ── Headings ─── */}
      <ToolbarButton
        pressed={editor.isActive('heading', { level: 1 })}
        onPressedChange={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        title='Rubrik 1'
      >
        <Icons.heading1 className='h-4 w-4' />
      </ToolbarButton>
      <ToolbarButton
        pressed={editor.isActive('heading', { level: 2 })}
        onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        title='Rubrik 2'
      >
        <Icons.heading2 className='h-4 w-4' />
      </ToolbarButton>
      <ToolbarButton
        pressed={editor.isActive('heading', { level: 3 })}
        onPressedChange={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        title='Rubrik 3'
      >
        <Icons.heading3 className='h-4 w-4' />
      </ToolbarButton>

      <Separator orientation='vertical' className='mx-1 h-6' />

      {/* ── Lists ─── */}
      <ToolbarButton
        pressed={editor.isActive('bulletList')}
        onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
        title='Punktlista'
      >
        <Icons.list className='h-4 w-4' />
      </ToolbarButton>
      <ToolbarButton
        pressed={editor.isActive('orderedList')}
        onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
        title='Numrerad lista'
      >
        <Icons.listNumbers className='h-4 w-4' />
      </ToolbarButton>

      <Separator orientation='vertical' className='mx-1 h-6' />

      {/* ── Alignment ─── */}
      <ToolbarButton
        pressed={editor.isActive({ textAlign: 'left' })}
        onPressedChange={() => editor.chain().focus().setTextAlign('left').run()}
        title='Vänsterjustera'
      >
        <Icons.alignLeft className='h-4 w-4' />
      </ToolbarButton>
      <ToolbarButton
        pressed={editor.isActive({ textAlign: 'center' })}
        onPressedChange={() => editor.chain().focus().setTextAlign('center').run()}
        title='Centrera'
      >
        <Icons.alignCenter className='h-4 w-4' />
      </ToolbarButton>
      <ToolbarButton
        pressed={editor.isActive({ textAlign: 'right' })}
        onPressedChange={() => editor.chain().focus().setTextAlign('right').run()}
        title='Högerjustera'
      >
        <Icons.alignRight className='h-4 w-4' />
      </ToolbarButton>

      <Separator orientation='vertical' className='mx-1 h-6' />

      {/* ── Block ─── */}
      <ToolbarButton
        pressed={editor.isActive('blockquote')}
        onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
        title='Citat'
      >
        <Icons.text className='h-4 w-4' />
      </ToolbarButton>
      <ToolbarButton
        pressed={editor.isActive('codeBlock')}
        onPressedChange={() => editor.chain().focus().toggleCodeBlock().run()}
        title='Kodblock'
      >
        <Icons.code className='h-4 w-4' />
      </ToolbarButton>
      <ToolbarButton
        pressed={false}
        onPressedChange={() => editor.chain().focus().setHorizontalRule().run()}
        title='Horisontell linje'
      >
        <Icons.separator className='h-4 w-4' />
      </ToolbarButton>
    </div>
  );
}

// ─── Editor ──────────────────────────────────────────────────

interface RichTextEditorProps {
  content: string;
  onUpdate: (html: string) => void;
  className?: string;
  editable?: boolean;
}

export default function RichTextEditor({
  content,
  onUpdate,
  className,
  editable = true
}: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] }
      }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight.configure({ multicolor: false }),
      Placeholder.configure({ placeholder: 'Börja skriva...' })
    ],
    content,
    editable,
    onUpdate: ({ editor: e }) => {
      onUpdate(e.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-sm dark:prose-invert max-w-none min-h-[calc(100vh-280px)] px-8 py-6 focus:outline-none'
      }
    }
  });

  if (!editor) return null;

  return (
    <div className={cn('bg-background flex flex-col rounded-lg border', className)}>
      {editable && <EditorToolbar editor={editor} />}
      <div className='flex-1 overflow-y-auto'>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
