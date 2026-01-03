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

    const editor = useEditor({
      extensions: [
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
    });

    useEffect(() => {
      if (editor && normalizedContent !== editor.getHTML()) {
        editor.commands.setContent(normalizedContent);
      }
    }, [normalizedContent, editor]);

  if (!editor) {
    return null;
  }

  const addLink = () => {
    const url = window.prompt('Enter URL:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const imageInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

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
      onClick={onClick}
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
        {/* Text Style Dropdown */}
        <select
          className="h-8 px-2 text-sm bg-background text-foreground border border-border rounded mr-2"
          value={
            editor.isActive('heading', { level: 1 }) ? 'h1' :
            editor.isActive('heading', { level: 2 }) ? 'h2' :
            editor.isActive('heading', { level: 3 }) ? 'h3' : 'p'
          }
          onChange={(e) => {
            const value = e.target.value;
            if (value === 'p') {
              editor.chain().focus().setParagraph().run();
            } else if (value === 'h1') {
              editor.chain().focus().setHeading({ level: 1 }).run();
            } else if (value === 'h2') {
              editor.chain().focus().setHeading({ level: 2 }).run();
            } else if (value === 'h3') {
              editor.chain().focus().setHeading({ level: 3 }).run();
            }
          }}
        >
          <option value="p">Paragraph</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
        </select>

        <div className="w-px h-6 bg-border mx-1" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive('underline')}
          title="Underline"
        >
          <UnderlineIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive('strike')}
          title="Strikethrough"
        >
          <Strikethrough className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          isActive={editor.isActive('code')}
          title="Code"
        >
          <Code className="h-4 w-4" />
        </ToolbarButton>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Text Color */}
        <div className="relative group">
          <ToolbarButton
            onClick={() => {}}
            title="Text Color"
          >
            <ColorFilter className="h-4 w-4" />
          </ToolbarButton>
          <div className="absolute top-full left-0 mt-1 hidden group-hover:flex flex-wrap gap-1 p-2 bg-popover border border-border rounded-lg shadow-lg z-50 w-32">
            {TEXT_COLORS.map((color) => (
              <button
                key={color.value || 'default'}
                type="button"
                className="w-6 h-6 rounded border border-border hover:scale-110 transition-transform"
                style={{ backgroundColor: color.value || 'transparent' }}
                onClick={() => {
                  if (color.value) {
                    editor.chain().focus().setColor(color.value).run();
                  } else {
                    editor.chain().focus().unsetColor().run();
                  }
                }}
                title={color.name}
              />
            ))}
          </div>
        </div>

        {/* Highlight Color */}
        <div className="relative group">
          <ToolbarButton
            onClick={() => {}}
            title="Highlight"
          >
            <Palette className="h-4 w-4" />
          </ToolbarButton>
          <div className="absolute top-full left-0 mt-1 hidden group-hover:flex flex-wrap gap-1 p-2 bg-popover border border-border rounded-lg shadow-lg z-50 w-32">
            {HIGHLIGHT_COLORS.map((color) => (
              <button
                key={color.value || 'none'}
                type="button"
                className="w-6 h-6 rounded border border-border hover:scale-110 transition-transform"
                style={{ backgroundColor: color.value || 'transparent' }}
                onClick={() => {
                  if (color.value) {
                    editor.chain().focus().toggleHighlight({ color: color.value }).run();
                  } else {
                    editor.chain().focus().unsetHighlight().run();
                  }
                }}
                title={color.name}
              />
            ))}
          </div>
        </div>

        <div className="w-px h-6 bg-border mx-1" />

        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          isActive={editor.isActive({ textAlign: 'left' })}
          title="Align Left"
        >
          <AlignLeft className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          isActive={editor.isActive({ textAlign: 'center' })}
          title="Align Center"
        >
          <AlignCenter className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          isActive={editor.isActive({ textAlign: 'right' })}
          title="Align Right"
        >
          <AlignRight className="h-4 w-4" />
        </ToolbarButton>

        <div className="w-px h-6 bg-border mx-1" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          title="Numbered List"
        >
          <NumberedListLeft className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
          title="Quote"
        >
          <Quote className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Horizontal Rule"
        >
          <Minus className="h-4 w-4" />
        </ToolbarButton>

        <div className="w-px h-6 bg-border mx-1" />

        <ToolbarButton
          onClick={addLink}
          isActive={editor.isActive('link')}
          title="Add Link"
        >
          <LinkIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={addImage}
          title="Upload Image"
        >
          {isUploadingImage ? (
            <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          ) : (
            <MediaImage className="h-4 w-4" />
          )}
        </ToolbarButton>
        <ToolbarButton
          onClick={addYoutubeVideo}
          title="Add YouTube Video"
        >
          <YoutubeIcon className="h-4 w-4" />
        </ToolbarButton>

        <div className="w-px h-6 bg-border mx-1" />

        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          title="Undo"
        >
          <Undo className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          title="Redo"
        >
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
