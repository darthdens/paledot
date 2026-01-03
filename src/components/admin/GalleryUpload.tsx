import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Trash, MediaImage } from 'iconoir-react';

interface GalleryUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  folder?: string;
}

const GalleryUpload = ({ value = [], onChange, folder = 'gallery' }: GalleryUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    setIsUploading(true);
    const newUrls: string[] = [];

    try {
      for (const file of Array.from(files)) {
        if (!validTypes.includes(file.type)) {
          toast.error(`${file.name}: Invalid file type`);
          continue;
        }

        if (file.size > maxSize) {
          toast.error(`${file.name}: File too large (max 5MB)`);
          continue;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('media')
          .upload(fileName, file);

        if (uploadError) {
          toast.error(`${file.name}: Upload failed`);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('media')
          .getPublicUrl(fileName);

        newUrls.push(publicUrl);
      }

      if (newUrls.length > 0) {
        onChange([...value, ...newUrls]);
        toast.success(`${newUrls.length} image(s) uploaded!`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload images');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = (index: number) => {
    const newUrls = value.filter((_, i) => i !== index);
    onChange(newUrls);
  };

  const moveImage = (from: number, to: number) => {
    if (to < 0 || to >= value.length) return;
    const newUrls = [...value];
    const [moved] = newUrls.splice(from, 1);
    newUrls.splice(to, 0, moved);
    onChange(newUrls);
  };

  return (
    <div className="space-y-3">
      <Input
        type="file"
        ref={fileInputRef}
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
        multiple
      />

      {/* Image Grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {value.map((url, index) => (
            <div key={url} className="relative group aspect-video">
              <img
                src={url}
                alt={`Gallery image ${index + 1}`}
                className="w-full h-full object-cover rounded-lg border border-border"
              />
              <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 rounded-lg">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => moveImage(index, index - 1)}
                  disabled={index === 0}
                >
                  ←
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleRemove(index)}
                >
                  <Trash className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => moveImage(index, index + 1)}
                  disabled={index === value.length - 1}
                >
                  →
                </Button>
              </div>
              <span className="absolute top-1 left-1 bg-background/80 text-xs px-1.5 py-0.5 rounded">
                {index + 1}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Add Button */}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="w-full h-24 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-1 hover:border-primary/50 hover:bg-muted/30 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isUploading ? (
          <>
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-muted-foreground">Uploading...</span>
          </>
        ) : (
          <>
            <Plus className="w-6 h-6 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Add images</span>
            <span className="text-xs text-muted-foreground">JPG, PNG, WebP • Max 5MB each</span>
          </>
        )}
      </button>
    </div>
  );
};

export default GalleryUpload;
