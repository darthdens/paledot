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
}

interface FormData {
  slug: string;
  title: string;
  description: string;
  content: string;
  image_url: string;
  tags: string[];
  external_url: string;
  award: string;
  is_featured: boolean;
  display_order: number;
}

const emptyFormData: FormData = {
  slug: "",
  title: "",
  description: "",
  content: "",
  image_url: "",
  tags: [],
  external_url: "",
  award: "",
  is_featured: false,
  display_order: 0,
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
        title: project.title_en,
        description: project.description_en,
        content: project.content_en || "",
        image_url: project.image_url || "",
        tags: project.tags,
        external_url: project.external_url || "",
        award: project.award_en || "",
        is_featured: project.is_featured,
        display_order: project.display_order,
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

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      slug: prev.slug || generateSlug(title),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const tags = tagsInput.split(",").map(t => t.trim()).filter(Boolean);
    
    // Map to database fields (EN/FR both get same value for now)
    const projectData = {
      slug: formData.slug,
      title_en: formData.title,
      title_fr: formData.title, // Same as EN, auto-translated later
      description_en: formData.description,
      description_fr: formData.description, // Same as EN
      content_en: formData.content || null,
      content_fr: formData.content || null, // Same as EN
      image_url: formData.image_url || null,
      tags,
      external_url: formData.external_url || null,
      award_en: formData.award || null,
      award_fr: formData.award || null, // Same as EN
      is_featured: formData.is_featured,
      display_order: formData.display_order,
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
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto mx-4">
            <DialogHeader>
              <DialogTitle>{editingProject ? "Edit Project" : "Create Project"}</DialogTitle>
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
                  <Label htmlFor="tags">Tags (comma separated)</Label>
                  <Input
                    id="tags"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="Branding, Website, Graphics"
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="external_url">External URL</Label>
                  <Input
                    id="external_url"
                    value={formData.external_url}
                    onChange={(e) => setFormData({ ...formData, external_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="award">Award</Label>
                  <Input
                    id="award"
                    value={formData.award}
                    onChange={(e) => setFormData({ ...formData, award: e.target.value })}
                    placeholder="🏆 Award Winner"
                  />
                </div>
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
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded whitespace-nowrap">Featured</span>
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