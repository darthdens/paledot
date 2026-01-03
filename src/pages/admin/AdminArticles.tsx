import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Edit, Trash } from "iconoir-react";
import { z } from "zod";

// Validation schema for article data
const articleSchema = z.object({
  slug: z.string()
    .trim()
    .min(1, "Slug is required")
    .max(100, "Slug must be less than 100 characters")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens only"),
  title_en: z.string().trim().min(1, "English title is required").max(200, "Title must be less than 200 characters"),
  title_fr: z.string().trim().min(1, "French title is required").max(200, "Title must be less than 200 characters"),
  excerpt_en: z.string().trim().min(1, "English excerpt is required").max(500, "Excerpt must be less than 500 characters"),
  excerpt_fr: z.string().trim().min(1, "French excerpt is required").max(500, "Excerpt must be less than 500 characters"),
  content_en: z.string().trim().min(1, "English content is required").max(50000, "Content must be less than 50,000 characters"),
  content_fr: z.string().trim().min(1, "French content is required").max(50000, "Content must be less than 50,000 characters"),
  image_url: z.string().trim().url("Invalid image URL").max(500, "Image URL must be less than 500 characters").optional().or(z.literal("")),
  category_en: z.string().trim().max(50, "Category must be less than 50 characters").optional().or(z.literal("")),
  category_fr: z.string().trim().max(50, "Category must be less than 50 characters").optional().or(z.literal("")),
  read_time: z.number().int().min(1, "Read time must be at least 1 minute").max(120, "Read time must be less than 120 minutes"),
  is_published: z.boolean(),
  published_at: z.string().nullable(),
});

interface Article {
  id: string;
  slug: string;
  title_en: string;
  title_fr: string;
  excerpt_en: string;
  excerpt_fr: string;
  content_en: string;
  content_fr: string;
  image_url: string | null;
  category_en: string | null;
  category_fr: string | null;
  read_time: number;
  is_published: boolean;
  published_at: string | null;
}

const emptyArticle: Omit<Article, "id"> = {
  slug: "",
  title_en: "",
  title_fr: "",
  excerpt_en: "",
  excerpt_fr: "",
  content_en: "",
  content_fr: "",
  image_url: "",
  category_en: "",
  category_fr: "",
  read_time: 5,
  is_published: false,
  published_at: null,
};

const AdminArticles = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [formData, setFormData] = useState<Omit<Article, "id">>(emptyArticle);

  const fetchArticles = async () => {
    const { data, error } = await supabase
      .from("articles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load articles");
      return;
    }
    setArticles(data || []);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const handleOpenDialog = (article?: Article) => {
    if (article) {
      setEditingArticle(article);
      setFormData(article);
    } else {
      setEditingArticle(null);
      setFormData(emptyArticle);
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data
    const validation = articleSchema.safeParse(formData);
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      toast.error(firstError.message);
      return;
    }

    const articleData = {
      ...formData,
      image_url: formData.image_url || null,
      category_en: formData.category_en || null,
      category_fr: formData.category_fr || null,
      published_at: formData.is_published ? (formData.published_at || new Date().toISOString()) : null,
    };

    if (editingArticle) {
      const { error } = await supabase
        .from("articles")
        .update(articleData)
        .eq("id", editingArticle.id);

      if (error) {
        toast.error("Failed to update article");
        return;
      }
      toast.success("Article updated!");
    } else {
      const { error } = await supabase.from("articles").insert(articleData);

      if (error) {
        toast.error("Failed to create article");
        return;
      }
      toast.success("Article created!");
    }

    setIsDialogOpen(false);
    fetchArticles();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this article?")) return;

    const { error } = await supabase.from("articles").delete().eq("id", id);

    if (error) {
      toast.error("Failed to delete article");
      return;
    }
    toast.success("Article deleted!");
    fetchArticles();
  };

  if (isLoading) {
    return <div className="text-muted-foreground">Loading articles...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="font-serif text-xl md:text-2xl font-bold">Articles</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Add Article
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto mx-4">
            <DialogHeader>
              <DialogTitle>{editingArticle ? "Edit Article" : "Add Article"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="my-article"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="read_time">Read Time (minutes)</Label>
                  <Input
                    id="read_time"
                    type="number"
                    value={formData.read_time}
                    onChange={(e) => setFormData({ ...formData, read_time: parseInt(e.target.value) || 5 })}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title_en">Title (English)</Label>
                  <Input
                    id="title_en"
                    value={formData.title_en}
                    onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title_fr">Title (French)</Label>
                  <Input
                    id="title_fr"
                    value={formData.title_fr}
                    onChange={(e) => setFormData({ ...formData, title_fr: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category_en">Category (English)</Label>
                  <Input
                    id="category_en"
                    value={formData.category_en || ""}
                    onChange={(e) => setFormData({ ...formData, category_en: e.target.value })}
                    placeholder="Technology"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category_fr">Category (French)</Label>
                  <Input
                    id="category_fr"
                    value={formData.category_fr || ""}
                    onChange={(e) => setFormData({ ...formData, category_fr: e.target.value })}
                    placeholder="Technologie"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="excerpt_en">Excerpt (English)</Label>
                  <Textarea
                    id="excerpt_en"
                    value={formData.excerpt_en}
                    onChange={(e) => setFormData({ ...formData, excerpt_en: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="excerpt_fr">Excerpt (French)</Label>
                  <Textarea
                    id="excerpt_fr"
                    value={formData.excerpt_fr}
                    onChange={(e) => setFormData({ ...formData, excerpt_fr: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content_en">Content (English) - Markdown supported</Label>
                <Textarea
                  id="content_en"
                  value={formData.content_en}
                  onChange={(e) => setFormData({ ...formData, content_en: e.target.value })}
                  className="min-h-[200px]"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content_fr">Content (French) - Markdown supported</Label>
                <Textarea
                  id="content_fr"
                  value={formData.content_fr}
                  onChange={(e) => setFormData({ ...formData, content_fr: e.target.value })}
                  className="min-h-[200px]"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="image_url">Featured Image URL</Label>
                <Input
                  id="image_url"
                  value={formData.image_url || ""}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="is_published"
                  checked={formData.is_published}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                />
                <Label htmlFor="is_published">Published</Label>
              </div>

              <Button type="submit" className="w-full">
                {editingArticle ? "Update Article" : "Create Article"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {articles.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No articles yet. Create your first one!
            </CardContent>
          </Card>
        ) : (
          articles.map((article) => (
            <Card key={article.id}>
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4">
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-base md:text-lg truncate">{article.title_en}</CardTitle>
                  <p className="text-sm text-muted-foreground truncate">
                    /{article.slug} • {article.read_time} min read
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {article.is_published ? (
                    <span className="text-xs bg-green-500/10 text-green-500 px-2 py-1 rounded whitespace-nowrap">Published</span>
                  ) : (
                    <span className="text-xs bg-yellow-500/10 text-yellow-500 px-2 py-1 rounded whitespace-nowrap">Draft</span>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(article)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(article.id)}>
                    <Trash className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminArticles;
