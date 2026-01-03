import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Edit, Trash } from "iconoir-react";
import RichTextEditor from "@/components/admin/RichTextEditor";
import ImageUpload from "@/components/admin/ImageUpload";

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
  title_en: string;
  title_fr: string;
  category_en: string;
  category_fr: string;
  read_time: number;
  excerpt_en: string;
  excerpt_fr: string;
  content_en: string;
  content_fr: string;
  image_url: string;
  is_published: boolean;
}

const categoriesEn = [
  "Getting Started",
  "Tutorials",
  "Case Studies",
  "Industry Insights",
  "Technology",
  "Design",
];

const categoriesFr = [
  "Pour commencer",
  "Tutoriels",
  "Études de cas",
  "Perspectives de l'industrie",
  "Technologie",
  "Design",
];

const emptyFormData: FormData = {
  slug: "",
  title_en: "",
  title_fr: "",
  category_en: "Getting Started",
  category_fr: "Pour commencer",
  read_time: 3,
  excerpt_en: "",
  excerpt_fr: "",
  content_en: "",
  content_fr: "",
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
        title_en: article.title_en,
        title_fr: article.title_fr,
        category_en: article.category_en || "Getting Started",
        category_fr: article.category_fr || "Pour commencer",
        read_time: article.read_time,
        excerpt_en: article.excerpt_en,
        excerpt_fr: article.excerpt_fr,
        content_en: article.content_en,
        content_fr: article.content_fr,
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

  const handleTitleChange = (title: string, lang: 'en' | 'fr') => {
    if (lang === 'en') {
      setFormData(prev => ({
        ...prev,
        title_en: title,
        slug: prev.slug || generateSlug(title),
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        title_fr: title,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const articleData = {
      slug: formData.slug,
      title_en: formData.title_en,
      title_fr: formData.title_fr,
      excerpt_en: formData.excerpt_en,
      excerpt_fr: formData.excerpt_fr,
      content_en: formData.content_en,
      content_fr: formData.content_fr,
      image_url: formData.image_url || null,
      category_en: formData.category_en || null,
      category_fr: formData.category_fr || null,
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
          <DialogContent className="w-[calc(100vw-2rem)] max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingArticle ? "Edit Article" : "Create Article"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="auto-generated"
                  />
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

              <Tabs defaultValue="en" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="en">English</TabsTrigger>
                  <TabsTrigger value="fr">Français</TabsTrigger>
                </TabsList>
                
                <TabsContent value="en" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="title_en">Title (EN) <span className="text-destructive">*</span></Label>
                    <Input
                      id="title_en"
                      value={formData.title_en}
                      onChange={(e) => handleTitleChange(e.target.value, 'en')}
                      placeholder="Enter title in English"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category_en">Category (EN)</Label>
                    <Select
                      value={formData.category_en}
                      onValueChange={(value) => setFormData({ ...formData, category_en: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categoriesEn.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="excerpt_en">Excerpt (EN) <span className="text-destructive">*</span></Label>
                    <Textarea
                      id="excerpt_en"
                      value={formData.excerpt_en}
                      onChange={(e) => setFormData({ ...formData, excerpt_en: e.target.value })}
                      placeholder="Brief excerpt in English"
                      required
                      className="text-base"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Content (EN) <span className="text-destructive">*</span></Label>
                    <RichTextEditor
                      content={formData.content_en}
                      onChange={(content) => setFormData({ ...formData, content_en: content })}
                      placeholder="Write your content in English..."
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="fr" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="title_fr">Titre (FR) <span className="text-destructive">*</span></Label>
                    <Input
                      id="title_fr"
                      value={formData.title_fr}
                      onChange={(e) => handleTitleChange(e.target.value, 'fr')}
                      placeholder="Entrez le titre en français"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category_fr">Catégorie (FR)</Label>
                    <Select
                      value={formData.category_fr}
                      onValueChange={(value) => setFormData({ ...formData, category_fr: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner la catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        {categoriesFr.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="excerpt_fr">Extrait (FR) <span className="text-destructive">*</span></Label>
                    <Textarea
                      id="excerpt_fr"
                      value={formData.excerpt_fr}
                      onChange={(e) => setFormData({ ...formData, excerpt_fr: e.target.value })}
                      placeholder="Bref extrait en français"
                      required
                      className="text-base"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Contenu (FR) <span className="text-destructive">*</span></Label>
                    <RichTextEditor
                      content={formData.content_fr}
                      onChange={(content) => setFormData({ ...formData, content_fr: content })}
                      placeholder="Rédigez votre contenu en français..."
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <div className="space-y-2">
                <Label>Thumbnail</Label>
                <p className="text-xs text-muted-foreground">16:9 aspect ratio recommended</p>
                <ImageUpload
                  value={formData.image_url}
                  onChange={(url) => setFormData({ ...formData, image_url: url })}
                  folder="articles"
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
