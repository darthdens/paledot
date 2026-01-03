import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Youtube from '@tiptap/extension-youtube';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  NumberedListLeft,
  Quote,
  Minus,
  Link as LinkIcon,
  MediaImage,
  Undo,
  Redo,
  ColorFilter,
  Palette,
  Youtube as YoutubeIcon
} from 'iconoir-react';
import { useEffect, forwardRef, useMemo, useRef, useState } from 'react';
import { sanitizeRichTextHtml } from '@/lib/richText';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}


const TEXT_COLORS = [
  { name: 'Default', value: '' },
  { name: 'Black', value: '#000000' },
  { name: 'White', value: '#ffffff' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Pink', value: '#ec4899' },
];

const HIGHLIGHT_COLORS = [
  { name: 'None', value: '' },
  { name: 'Yellow', value: '#fef08a' },
  { name: 'Green', value: '#bbf7d0' },
  { name: 'Blue', value: '#bfdbfe' },
  { name: 'Pink', value: '#fbcfe8' },
  { name: 'Purple', value: '#e9d5ff' },
  { name: 'Orange', value: '#fed7aa' },
];

const RichTextEditor = forwardRef<HTMLDivElement, RichTextEditorProps>(
  ({ content, onChange, placeholder }, ref) => {
    const normalizedContent = useMemo(() => sanitizeRichTextHtml(content), [content]);

    const extensions = useMemo(
      () => [
        StarterKit.configure({
          heading: {
            levels: [1, 2, 3],
          },
        }),
        Underline,
        TextStyle,
        Color,
        Highlight.configure({
          multicolor: true,
        }),
        Link.configure({
          openOnClick: false,
          HTMLAttributes: {
            class: 'text-primary underline',
          },
        }),
        Image.configure({
          HTMLAttributes: {
            class: 'rounded-lg max-w-full',
          },
        }),
        TextAlign.configure({
          types: ['heading', 'paragraph'],
        }),
        Youtube.configure({
          width: 640,
          height: 360,
          HTMLAttributes: {
            class: 'rounded-lg max-w-full aspect-video',
          },
        }),
      ],
      [],
    );

    const editor = useEditor(
      {
        extensions,
        // IMPORTANT: content is only used on initial mount. Admin pages remount the editor
        // when switching items via a React `key`, so selection/formatting stays stable.
        content: normalizedContent,
        onUpdate: ({ editor }) => {
          const html = editor.getHTML();
          const normalized = sanitizeRichTextHtml(html);
          onChange(normalized);
        },
        editorProps: {
          attributes: {
            // Match the same typography + theme-aware colors used on the public Project/Article pages.
            class:
              'prose prose-lg max-w-none text-muted-foreground prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground prose-a:text-primary prose-blockquote:text-muted-foreground prose-code:text-foreground min-h-[200px] p-4 focus:outline-none',
            ...(placeholder ? { 'data-placeholder': placeholder } : {}),
          },
        },
      },
      [],
    );

  // NOTE: We intentionally do NOT sync `content` prop back into the editor on every change.
  // The parent updates `content` on every keystroke; re-setting editor content would reset selection
  // and make toolbar formatting feel broken. We instead remount the editor when switching items
  // (see `key` usage in the admin pages).

  const imageInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const lastSelection = useRef<{ from: number; to: number } | null>(null);

  useEffect(() => {
    if (!editor) return;

    const storeSelection = () => {
      const { from, to } = editor.state.selection;
      // Only treat non-empty selections as "the" selection we want to preserve.
      // (Toolbar interactions can temporarily collapse selection.)
      if (from !== to) {
        lastSelection.current = { from, to };
        return;
      }

      // Still keep cursor position updates when the editor is focused.
      if (editor.view.hasFocus()) {
        lastSelection.current = { from, to };
      }
    };

    storeSelection();
    editor.on('selectionUpdate', storeSelection);

    const dom = editor.view.dom;
    dom.addEventListener('mouseup', storeSelection);
    dom.addEventListener('keyup', storeSelection);
    dom.addEventListener('touchend', storeSelection);

    return () => {
      editor.off('selectionUpdate', storeSelection);
      dom.removeEventListener('mouseup', storeSelection);
      dom.removeEventListener('keyup', storeSelection);
      dom.removeEventListener('touchend', storeSelection);
    };
  }, [editor]);

  if (!editor) {
    return null;
  }

  const chainWithSelection = () => {
    let chain = editor.chain().focus();

    if (lastSelection.current) {
      const max = editor.state.doc.content.size;
      const clamp = (pos: number) => Math.max(0, Math.min(pos, max));
      chain = chain.setTextSelection({
        from: clamp(lastSelection.current.from),
        to: clamp(lastSelection.current.to),
      });
    }

    return chain;
  };

  const addLink = () => {
    const url = window.prompt('Enter URL:');
    if (url) {
      chainWithSelection().extendMarkRange('link').setLink({ href: url }).run();
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a JPG, PNG, or WebP image');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setIsUploadingImage(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `content/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(fileName);

      editor.chain().focus().setImage({ src: publicUrl }).run();
      toast.success('Image added!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setIsUploadingImage(false);
      if (imageInputRef.current) {
        imageInputRef.current.value = '';
      }
    }
  };

  const addImage = () => {
    imageInputRef.current?.click();
  };

  const addYoutubeVideo = () => {
    const url = window.prompt('Enter YouTube URL:');
    if (url) {
      editor.commands.setYoutubeVideo({ src: url });
    }
  };

  const ToolbarButton = ({ 
    onClick, 
    isActive = false, 
    children,
    title
  }: { 
    onClick: () => void; 
    isActive?: boolean; 
    children: React.ReactNode;
    title: string;
  }) => (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={`h-8 w-8 ${isActive ? 'bg-muted' : ''}`}
      onMouseDown={(e) => e.preventDefault()}
      onPointerDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      title={title}
    >
      {children}
    </Button>
  );

  return (
    <div ref={ref} className="border border-border rounded-lg overflow-hidden bg-background">
      {/* Hidden file input for image uploads */}
      <input
        type="file"
        ref={imageInputRef}
        accept="image/jpeg,image/png,image/webp"
        onChange={handleImageUpload}
        className="hidden"
      />
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 p-2 border-b border-border bg-muted/30">
        {/* Block Type */}
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 mr-2 gap-2"
              onMouseDown={(e) => e.preventDefault()}
            >
              {editor.isActive('heading', { level: 1 })
                ? 'Heading 1'
                : editor.isActive('heading', { level: 2 })
                ? 'Heading 2'
                : editor.isActive('heading', { level: 3 })
                ? 'Heading 3'
                : 'Paragraph'}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            onCloseAutoFocus={(e) => e.preventDefault()}
          >
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                chainWithSelection().setParagraph().run();
              }}
            >
              Paragraph
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                chainWithSelection().setHeading({ level: 1 }).run();
              }}
            >
              Heading 1
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                chainWithSelection().setHeading({ level: 2 }).run();
              }}
            >
              Heading 2
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                chainWithSelection().setHeading({ level: 3 }).run();
              }}
            >
              Heading 3
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="w-px h-6 bg-border mx-1" />

        <ToolbarButton
          onClick={() => chainWithSelection().toggleBold().run()}
          isActive={editor.isActive('bold')}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => chainWithSelection().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => chainWithSelection().toggleUnderline().run()}
          isActive={editor.isActive('underline')}
          title="Underline"
        >
          <UnderlineIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => chainWithSelection().toggleStrike().run()}
          isActive={editor.isActive('strike')}
          title="Strikethrough"
        >
          <Strikethrough className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => chainWithSelection().toggleCode().run()}
          isActive={editor.isActive('code')}
          title="Code"
        >
          <Code className="h-4 w-4" />
        </ToolbarButton>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Text Color */}
        <div className="relative group">
          <ToolbarButton onClick={() => {}} title="Text Color">
            <ColorFilter className="h-4 w-4" />
          </ToolbarButton>
          <div className="absolute top-full left-0 mt-1 hidden group-hover:flex flex-wrap gap-1 p-2 bg-popover border border-border rounded-lg shadow-lg z-50 w-32">
            {TEXT_COLORS.map((color) => (
              <button
                key={color.value || 'default'}
                type="button"
                className="w-6 h-6 rounded border border-border hover:scale-110 transition-transform"
                style={{ backgroundColor: color.value || 'transparent' }}
                onMouseDown={(e) => e.preventDefault()}
                onPointerDown={(e) => {
                  e.preventDefault();
                  const chain = chainWithSelection();
                  if (color.value) {
                    chain.setColor(color.value).run();
                  } else {
                    chain.unsetColor().run();
                  }
                }}
                title={color.name}
              />
            ))}
          </div>
        </div>

        {/* Highlight Color */}
        <div className="relative group">
          <ToolbarButton onClick={() => {}} title="Highlight">
            <Palette className="h-4 w-4" />
          </ToolbarButton>
          <div className="absolute top-full left-0 mt-1 hidden group-hover:flex flex-wrap gap-1 p-2 bg-popover border border-border rounded-lg shadow-lg z-50 w-32">
            {HIGHLIGHT_COLORS.map((color) => (
              <button
                key={color.value || 'none'}
                type="button"
                className="w-6 h-6 rounded border border-border hover:scale-110 transition-transform"
                style={{ backgroundColor: color.value || 'transparent' }}
                onMouseDown={(e) => e.preventDefault()}
                onPointerDown={(e) => {
                  e.preventDefault();
                  const chain = chainWithSelection();
                  if (color.value) {
                    chain.toggleHighlight({ color: color.value }).run();
                  } else {
                    chain.unsetHighlight().run();
                  }
                }}
                title={color.name}
              />
            ))}
          </div>
        </div>

        <div className="w-px h-6 bg-border mx-1" />

        <ToolbarButton
          onClick={() => chainWithSelection().setTextAlign('left').run()}
          isActive={editor.isActive({ textAlign: 'left' })}
          title="Align Left"
        >
          <AlignLeft className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => chainWithSelection().setTextAlign('center').run()}
          isActive={editor.isActive({ textAlign: 'center' })}
          title="Align Center"
        >
          <AlignCenter className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => chainWithSelection().setTextAlign('right').run()}
          isActive={editor.isActive({ textAlign: 'right' })}
          title="Align Right"
        >
          <AlignRight className="h-4 w-4" />
        </ToolbarButton>

        <div className="w-px h-6 bg-border mx-1" />

        <ToolbarButton
          onClick={() => chainWithSelection().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => chainWithSelection().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          title="Numbered List"
        >
          <NumberedListLeft className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => chainWithSelection().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
          title="Quote"
        >
          <Quote className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => chainWithSelection().setHorizontalRule().run()}
          title="Horizontal Rule"
        >
          <Minus className="h-4 w-4" />
        </ToolbarButton>

        <div className="w-px h-6 bg-border mx-1" />

        <ToolbarButton onClick={addLink} isActive={editor.isActive('link')} title="Add Link">
          <LinkIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={addImage} title="Upload Image">
          {isUploadingImage ? (
            <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          ) : (
            <MediaImage className="h-4 w-4" />
          )}
        </ToolbarButton>
        <ToolbarButton onClick={addYoutubeVideo} title="Add YouTube Video">
          <YoutubeIcon className="h-4 w-4" />
        </ToolbarButton>

        <div className="w-px h-6 bg-border mx-1" />

        <ToolbarButton onClick={() => chainWithSelection().undo().run()} title="Undo">
          <Undo className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => chainWithSelection().redo().run()} title="Redo">
          <Redo className="h-4 w-4" />
        </ToolbarButton>
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} />
    </div>
  );
});

RichTextEditor.displayName = 'RichTextEditor';

export default RichTextEditor;
