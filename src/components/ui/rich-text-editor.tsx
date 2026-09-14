/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Quote,
  Undo,
  Redo,
  Link as LinkIcon,
  Code,
  ImageIcon,
  Minus,
} from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { useCallback } from 'react';
import { api } from '@/lib/api/axios-instance';
import { toast } from 'sonner';

interface RichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Write your blog content here...',
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4], // Backed allows h1, h2, h3, h4
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline cursor-pointer font-medium',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class:
            'rounded-lg max-h-[450px] object-cover mx-auto my-4 border border-border shadow-sm',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          'min-h-[350px] max-h-[650px] overflow-y-auto w-full rounded-b-md border border-t-0 border-input bg-background/50 px-4 py-3 text-sm focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 prose prose-sm dark:prose-invert max-w-none focus:outline-none ' +
          '[&_h1]:text-2xl [&_h1]:font-bold [&_h1]:my-4 [&_h1]:text-foreground ' +
          '[&_h2]:text-xl [&_h2]:font-bold [&_h2]:my-3 [&_h2]:text-foreground ' +
          '[&_h3]:text-lg [&_h3]:font-semibold [&_h3]:my-2 [&_h3]:text-foreground ' +
          '[&_h4]:text-base [&_h4]:font-semibold [&_h4]:my-2 [&_h4]:text-foreground ' +
          '[&_p]:leading-relaxed [&_p]:my-2 ' +
          '[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2 ' +
          '[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2 ' +
          '[&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:my-3 ' +
          '[&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono ' +
          '[&_pre]:bg-muted/80 [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:my-3 [&_pre_code]:bg-transparent [&_pre_code]:p-0',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const addImage = useCallback(() => {
    if (!editor) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('file', file);

      try {
        toast.loading('Uploading inline image...');
        const { data } = await api.post('/uploads/image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.dismiss();

        const uploadedUrl = data?.data?.url || data?.url;
        if (uploadedUrl) {
          editor.chain().focus().setImage({ src: uploadedUrl }).run();
          toast.success('Image inserted successfully');
        }
      } catch (err) {
        toast.dismiss();
        toast.error('Failed to upload image');
      }
    };
    input.click();
  }, [editor]);

  if (!editor) {
    return (
      <div className='min-h-[350px] w-full rounded-md border border-input bg-muted/20 animate-pulse' />
    );
  }

  return (
    <div className='w-full rounded-md border border-border/50 shadow-sm overflow-hidden'>
      {/* Toolbar */}
      <div className='flex flex-wrap items-center gap-1 border-b border-border/50 bg-muted/40 p-1.5'>
        {/* Headings: H1, H2, H3, H4 */}
        <Toggle
          size='sm'
          pressed={editor.isActive('heading', { level: 1 })}
          onPressedChange={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          aria-label='Heading 1'
          title='Heading 1 (h1)'
        >
          <Heading1 className='h-4 w-4' />
        </Toggle>

        <Toggle
          size='sm'
          pressed={editor.isActive('heading', { level: 2 })}
          onPressedChange={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          aria-label='Heading 2'
          title='Heading 2 (h2)'
        >
          <Heading2 className='h-4 w-4' />
        </Toggle>

        <Toggle
          size='sm'
          pressed={editor.isActive('heading', { level: 3 })}
          onPressedChange={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          aria-label='Heading 3'
          title='Heading 3 (h3)'
        >
          <Heading3 className='h-4 w-4' />
        </Toggle>

        <Toggle
          size='sm'
          pressed={editor.isActive('heading', { level: 4 })}
          onPressedChange={() =>
            editor.chain().focus().toggleHeading({ level: 4 }).run()
          }
          aria-label='Heading 4'
          title='Heading 4 (h4)'
        >
          <Heading4 className='h-4 w-4' />
        </Toggle>

        <div className='h-4 w-[1px] bg-border mx-1' />

        {/* Text Styling */}
        <Toggle
          size='sm'
          pressed={editor.isActive('bold')}
          onPressedChange={() => editor.chain().focus().toggleBold().run()}
          aria-label='Toggle bold'
          title='Bold (strong)'
        >
          <Bold className='h-4 w-4' />
        </Toggle>

        <Toggle
          size='sm'
          pressed={editor.isActive('italic')}
          onPressedChange={() => editor.chain().focus().toggleItalic().run()}
          aria-label='Toggle italic'
          title='Italic (em)'
        >
          <Italic className='h-4 w-4' />
        </Toggle>

        <Toggle
          size='sm'
          pressed={editor.isActive('strike')}
          onPressedChange={() => editor.chain().focus().toggleStrike().run()}
          aria-label='Toggle strike'
          title='Strikethrough (s)'
        >
          <Strikethrough className='h-4 w-4' />
        </Toggle>

        <div className='h-4 w-[1px] bg-border mx-1' />

        {/* Lists */}
        <Toggle
          size='sm'
          pressed={editor.isActive('bulletList')}
          onPressedChange={() =>
            editor.chain().focus().toggleBulletList().run()
          }
          aria-label='Bullet List'
          title='Unordered List (ul > li)'
        >
          <List className='h-4 w-4' />
        </Toggle>

        <Toggle
          size='sm'
          pressed={editor.isActive('orderedList')}
          onPressedChange={() =>
            editor.chain().focus().toggleOrderedList().run()
          }
          aria-label='Ordered List'
          title='Ordered List (ol > li)'
        >
          <ListOrdered className='h-4 w-4' />
        </Toggle>

        <div className='h-4 w-[1px] bg-border mx-1' />

        {/* Block & Media */}
        <Toggle
          size='sm'
          pressed={editor.isActive('blockquote')}
          onPressedChange={() =>
            editor.chain().focus().toggleBlockquote().run()
          }
          aria-label='Blockquote'
          title='Blockquote'
        >
          <Quote className='h-4 w-4' />
        </Toggle>

        <Toggle
          size='sm'
          pressed={editor.isActive('codeBlock')}
          onPressedChange={() => editor.chain().focus().toggleCodeBlock().run()}
          aria-label='Code Block'
          title='Code Block (pre > code)'
        >
          <Code className='h-4 w-4' />
        </Toggle>

        <Toggle
          size='sm'
          pressed={editor.isActive('link')}
          onPressedChange={setLink}
          aria-label='Set Link'
          title='Add Link (a)'
        >
          <LinkIcon className='h-4 w-4' />
        </Toggle>

        <Toggle
          size='sm'
          onPressedChange={addImage}
          aria-label='Insert Image'
          title='Insert Inline Image (img)'
        >
          <ImageIcon className='h-4 w-4' />
        </Toggle>

        <Toggle
          size='sm'
          onPressedChange={() =>
            editor.chain().focus().setHorizontalRule().run()
          }
          aria-label='Horizontal Rule'
          title='Divider Line (hr)'
        >
          <Minus className='h-4 w-4' />
        </Toggle>

        <div className='h-4 w-[1px] bg-border mx-1' />

        {/* Undo/Redo */}
        <Toggle
          size='sm'
          onPressedChange={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          aria-label='Undo'
          title='Undo'
        >
          <Undo className='h-4 w-4' />
        </Toggle>

        <Toggle
          size='sm'
          onPressedChange={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          aria-label='Redo'
          title='Redo'
        >
          <Redo className='h-4 w-4' />
        </Toggle>
      </div>

      {/* Editor Body */}
      <EditorContent editor={editor} />
    </div>
  );
}
