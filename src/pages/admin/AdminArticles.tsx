import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Edit, Trash } from "iconoir-react";
import RichTextEditor from "@/components/admin/RichTextEditor";

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

interface FormData {
  slug: string;
  title: string;
  category: string;
  read_time: number;
  description: string;
  content: string;
  image_url: string;
  is_published: boolean;
}

const categories = [
  "Getting Started",
  "Tutorials",
  "Case Studies",
  "Industry Insights",
  "Technology",
  "Design",
];

const emptyFormData: FormData = {
  slug: "",
  title: "",
  category: "Getting Started",
  read_time: 3,
  description: "",
  content: "",
  image_url: "",
  is_published: false,
};

const AdminArticles = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyFormData);

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
    document.title = "Articles | Admin | Dens";
  }, []);

  useEffect(() => {
    fetchArticles();
  }, []);

  const handleOpenDialog = (article?: Article) => {
    if (article) {
      setEditingArticle(article);
      setFormData({
        slug: article.slug,
        title: article.title_en,
        category: article.category_en || "Getting Started",
        read_time: article.read_time,
        description: article.excerpt_en,
        content: article.content_en,
        image_url: article.image_url || "",
        is_published: article.is_published,
      });
    } else {
      setEditingArticle(null);
      setFormData(emptyFormData);
    }
    setIsDialogOpen(true);
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      slug: prev.slug || generateSlug(title),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Map to database fields (EN/FR both get same value for now)
    const articleData = {
      slug: formData.slug,
      title_en: formData.title,
      title_fr: formData.title, // Same as EN, auto-translated later
      excerpt_en: formData.description,
      excerpt_fr: formData.description, // Same as EN
      content_en: formData.content,
      content_fr: formData.content, // Same as EN
      image_url: formData.image_url || null,
      category_en: formData.category || null,
      category_fr: formData.category || null, // Same as EN
      read_time: formData.read_time,
      is_published: formData.is_published,
      published_at: formData.is_published ? new Date().toISOString() : null,
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
              <DialogTitle>{editingArticle ? "Edit Article" : "Create Article"}</DialogTitle>
              <p className="text-sm text-muted-foreground">
                Content will be automatically translated to French when saved.
              </p>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title <span className="text-destructive">*</span></Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="Enter title"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="auto-generated"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="read_time">Read Time (minutes)</Label>
                  <Input
                    id="read_time"
                    type="number"
                    value={formData.read_time}
                    onChange={(e) => setFormData({ ...formData, read_time: parseInt(e.target.value) || 3 })}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="image_url">Thumbnail</Label>
                <p className="text-xs text-muted-foreground">16:9 aspect ratio required, max 2MB (JPG, PNG, WebP)</p>
                <Input
                  id="image_url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-2">
                <Label>Content</Label>
                <RichTextEditor
                  content={formData.content}
                  onChange={(content) => setFormData({ ...formData, content })}
                  placeholder="Write your content here..."
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

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  {editingArticle ? "Update Article" : "Create Article"}
                </Button>
              </div>
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