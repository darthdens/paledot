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
import RichTextEditor from "@/components/admin/RichTextEditor";
import ImageUpload from "@/components/admin/ImageUpload";
import GalleryUpload from "@/components/admin/GalleryUpload";

interface Project {
  id: string;
  slug: string;
  title_en: string;
  title_fr: string;
  description_en: string;
  description_fr: string;
  content_en: string | null;
  content_fr: string | null;
  image_url: string | null;
  tags: string[];
  external_url: string | null;
  award_en: string | null;
  award_fr: string | null;
  is_featured: boolean;
  display_order: number;
  gallery_images: string[];
}

interface FormData {
  slug: string;
  title_en: string;
  title_fr: string;
  description_en: string;
  description_fr: string;
  content_en: string;
  content_fr: string;
  image_url: string;
  tags: string[];
  external_url: string;
  award_en: string;
  award_fr: string;
  is_featured: boolean;
  display_order: number;
  gallery_images: string[];
}

const emptyFormData: FormData = {
  slug: "",
  title_en: "",
  title_fr: "",
  description_en: "",
  description_fr: "",
  content_en: "",
  content_fr: "",
  image_url: "",
  tags: [],
  external_url: "",
  award_en: "",
  award_fr: "",
  is_featured: false,
  display_order: 0,
  gallery_images: [],
};

const AdminProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyFormData);
  const [tagsInput, setTagsInput] = useState("");

  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("display_order", { ascending: true });

    if (error) {
      toast.error("Failed to load projects");
      return;
    }
    setProjects(data || []);
    setIsLoading(false);
  };

  useEffect(() => {
    document.title = "Projects | Admin | Dens";
  }, []);

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleOpenDialog = (project?: Project) => {
    if (project) {
      setEditingProject(project);
      setFormData({
        slug: project.slug,
        title_en: project.title_en,
        title_fr: project.title_fr,
        description_en: project.description_en,
        description_fr: project.description_fr,
        content_en: project.content_en || "",
        content_fr: project.content_fr || "",
        image_url: project.image_url || "",
        tags: project.tags,
        external_url: project.external_url || "",
        award_en: project.award_en || "",
        award_fr: project.award_fr || "",
        is_featured: project.is_featured,
        display_order: project.display_order,
        gallery_images: project.gallery_images || [],
      });
      setTagsInput(project.tags.join(", "));
    } else {
      setEditingProject(null);
      setFormData(emptyFormData);
      setTagsInput("");
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

  const translateToFrench = async (texts: { key: string; value: string }[]) => {
    try {
      // Get the current session for authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/translate-content`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ texts }),
        }
      );
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Translation failed");
      }
      
      const data = await response.json();
      return data.translations as Record<string, string>;
    } catch (error) {
      console.error("Translation error:", error);
      toast.error("Auto-translation failed. Using English as fallback.");
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const tags = tagsInput.split(",").map(t => t.trim()).filter(Boolean);
    
    // Auto-translate English content to French (except titles)
    const textsToTranslate: { key: string; value: string }[] = [];
    if (formData.description_en) textsToTranslate.push({ key: "description_fr", value: formData.description_en });
    if (formData.content_en) textsToTranslate.push({ key: "content_fr", value: formData.content_en });
    if (formData.award_en) textsToTranslate.push({ key: "award_fr", value: formData.award_en });
    
    let frenchTranslations: Record<string, string> | null = null;
    if (textsToTranslate.length > 0) {
      toast.info("Translating to French...");
      frenchTranslations = await translateToFrench(textsToTranslate);
    }
    
    const projectData = {
      slug: formData.slug,
      title_en: formData.title_en,
      title_fr: formData.title_en, // Keep same title for both languages
      description_en: formData.description_en,
      description_fr: frenchTranslations?.description_fr || formData.description_en,
      content_en: formData.content_en || null,
      content_fr: frenchTranslations?.content_fr || formData.content_en || null,
      image_url: formData.image_url || null,
      tags,
      external_url: formData.external_url || null,
      award_en: formData.award_en || null,
      award_fr: frenchTranslations?.award_fr || formData.award_en || null,
      is_featured: formData.is_featured,
      display_order: formData.display_order,
      gallery_images: formData.gallery_images,
    };

    if (editingProject) {
      const { error } = await supabase
        .from("projects")
        .update(projectData)
        .eq("id", editingProject.id);

      if (error) {
        toast.error("Failed to update project");
        return;
      }
      toast.success("Project updated!");
    } else {
      const { error } = await supabase.from("projects").insert(projectData);

      if (error) {
        toast.error("Failed to create project");
        return;
      }
      toast.success("Project created!");
    }

    setIsDialogOpen(false);
    fetchProjects();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return;

    const { error } = await supabase.from("projects").delete().eq("id", id);

    if (error) {
      toast.error("Failed to delete project");
      return;
    }
    toast.success("Project deleted!");
    fetchProjects();
  };

  if (isLoading) {
    return <div className="text-muted-foreground">Loading projects...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="font-serif text-xl md:text-2xl font-bold">Projects</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Add Project
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[calc(100vw-2rem)] max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProject ? "Edit Project" : "Create Project"}</DialogTitle>
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
                  <Label htmlFor="display_order">Display Order</Label>
                  <Input
                    id="display_order"
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Enter content in English. French translations are generated automatically.
                </p>
                
                <div className="space-y-2">
                  <Label htmlFor="title_en">Title <span className="text-destructive">*</span></Label>
                  <Input
                    id="title_en"
                    value={formData.title_en}
                    onChange={(e) => handleTitleChange(e.target.value, 'en')}
                    placeholder="Enter title"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description_en">Description <span className="text-destructive">*</span></Label>
                  <Textarea
                    id="description_en"
                    value={formData.description_en}
                    onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                    placeholder="Brief description"
                    required
                    className="text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="award_en">Award</Label>
                  <Input
                    id="award_en"
                    value={formData.award_en}
                    onChange={(e) => setFormData({ ...formData, award_en: e.target.value })}
                    placeholder="🏆 Award Winner"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Content</Label>
                  <RichTextEditor
                    key={editingProject?.id ?? "new-project"}
                    content={formData.content_en}
                    onChange={(content) => setFormData({ ...formData, content_en: content })}
                    placeholder="Write your content..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma separated)</Label>
                <Input
                  id="tags"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="Branding, Website, Graphics"
                />
              </div>

              <div className="space-y-2">
                <Label>Thumbnail</Label>
                <p className="text-xs text-muted-foreground">16:9 aspect ratio recommended</p>
                <ImageUpload
                  value={formData.image_url}
                  onChange={(url) => setFormData({ ...formData, image_url: url })}
                  folder="projects"
                />
              </div>

              <div className="space-y-2">
                <Label>Gallery Images</Label>
                <p className="text-xs text-muted-foreground">These images appear on the right side of the project page</p>
                <GalleryUpload
                  value={formData.gallery_images}
                  onChange={(urls) => setFormData({ ...formData, gallery_images: urls })}
                  folder="projects/gallery"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="external_url">External URL</Label>
                <Input
                  id="external_url"
                  value={formData.external_url}
                  onChange={(e) => setFormData({ ...formData, external_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="is_featured"
                  checked={formData.is_featured}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                />
                <Label htmlFor="is_featured">Featured on homepage</Label>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  {editingProject ? "Update Project" : "Create Project"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {projects.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No projects yet. Create your first one!
            </CardContent>
          </Card>
        ) : (
          projects.map((project) => (
            <Card key={project.id}>
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4">
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-base md:text-lg truncate">{project.title_en}</CardTitle>
                  <p className="text-sm text-muted-foreground truncate">/{project.slug}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {project.is_featured && (
                    <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded font-medium whitespace-nowrap">Featured</span>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(project)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(project.id)}>
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

export default AdminProjects;
