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

interface Project {
  id: string;
  slug: string;
  title_en: string;
  title_fr: string;
  description_en: string;
  description_fr: string;
  image_url: string | null;
  tags: string[];
  external_url: string | null;
  award_en: string | null;
  award_fr: string | null;
  is_featured: boolean;
  display_order: number;
}

const emptyProject: Omit<Project, "id"> = {
  slug: "",
  title_en: "",
  title_fr: "",
  description_en: "",
  description_fr: "",
  image_url: "",
  tags: [],
  external_url: "",
  award_en: "",
  award_fr: "",
  is_featured: false,
  display_order: 0,
};

const AdminProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState<Omit<Project, "id">>(emptyProject);
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
    fetchProjects();
  }, []);

  const handleOpenDialog = (project?: Project) => {
    if (project) {
      setEditingProject(project);
      setFormData(project);
      setTagsInput(project.tags.join(", "));
    } else {
      setEditingProject(null);
      setFormData(emptyProject);
      setTagsInput("");
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const projectData = {
      ...formData,
      tags: tagsInput.split(",").map(t => t.trim()).filter(Boolean),
      image_url: formData.image_url || null,
      external_url: formData.external_url || null,
      award_en: formData.award_en || null,
      award_fr: formData.award_fr || null,
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
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
            <DialogHeader>
              <DialogTitle>{editingProject ? "Edit Project" : "Add Project"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="my-project"
                    required
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
                  <Label htmlFor="description_en">Description (English)</Label>
                  <Textarea
                    id="description_en"
                    value={formData.description_en}
                    onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description_fr">Description (French)</Label>
                  <Textarea
                    id="description_fr"
                    value={formData.description_fr}
                    onChange={(e) => setFormData({ ...formData, description_fr: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="image_url">Image URL</Label>
                <Input
                  id="image_url"
                  value={formData.image_url || ""}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma separated)</Label>
                <Input
                  id="tags"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="Web3, Blockchain, React"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="external_url">External URL</Label>
                <Input
                  id="external_url"
                  value={formData.external_url || ""}
                  onChange={(e) => setFormData({ ...formData, external_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="award_en">Award (English)</Label>
                  <Input
                    id="award_en"
                    value={formData.award_en || ""}
                    onChange={(e) => setFormData({ ...formData, award_en: e.target.value })}
                    placeholder="🏆 Award Winner"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="award_fr">Award (French)</Label>
                  <Input
                    id="award_fr"
                    value={formData.award_fr || ""}
                    onChange={(e) => setFormData({ ...formData, award_fr: e.target.value })}
                    placeholder="🏆 Lauréat"
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

              <Button type="submit" className="w-full">
                {editingProject ? "Update Project" : "Create Project"}
              </Button>
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
