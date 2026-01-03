import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, GripVertical, Quote } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface Testimonial {
  id: string;
  quote_en: string;
  quote_fr: string;
  author: string;
  company: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface FormData {
  quote_en: string;
  quote_fr: string;
  author: string;
  company: string;
  is_active: boolean;
}

const initialFormData: FormData = {
  quote_en: "",
  quote_fr: "",
  author: "",
  company: "",
  is_active: true,
};

const AdminTestimonials = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isTranslating, setIsTranslating] = useState(false);

  const { data: testimonials, isLoading } = useQuery({
    queryKey: ["admin-testimonials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("testimonials")
        .select("*")
        .order("display_order", { ascending: true });
      
      if (error) throw error;
      return data as Testimonial[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: FormData & { id?: string }) => {
      if (data.id) {
        const { error } = await supabase
          .from("testimonials")
          .update({
            quote_en: data.quote_en,
            quote_fr: data.quote_fr,
            author: data.author,
            company: data.company,
            is_active: data.is_active,
          })
          .eq("id", data.id);
        if (error) throw error;
      } else {
        const maxOrder = testimonials?.reduce((max, t) => Math.max(max, t.display_order), -1) ?? -1;
        const { error } = await supabase
          .from("testimonials")
          .insert({
            quote_en: data.quote_en,
            quote_fr: data.quote_fr,
            author: data.author,
            company: data.company,
            is_active: data.is_active,
            display_order: maxOrder + 1,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-testimonials"] });
      toast.success(editingTestimonial ? "Testimonial updated!" : "Testimonial created!");
      handleCloseDialog();
    },
    onError: (error) => {
      toast.error("Error saving testimonial: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("testimonials")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-testimonials"] });
      toast.success("Testimonial deleted!");
    },
    onError: (error) => {
      toast.error("Error deleting testimonial: " + error.message);
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("testimonials")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-testimonials"] });
    },
    onError: (error) => {
      toast.error("Error updating testimonial: " + error.message);
    },
  });

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingTestimonial(null);
    setFormData(initialFormData);
  };

  const handleEdit = (testimonial: Testimonial) => {
    setEditingTestimonial(testimonial);
    setFormData({
      quote_en: testimonial.quote_en,
      quote_fr: testimonial.quote_fr,
      author: testimonial.author,
      company: testimonial.company,
      is_active: testimonial.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.quote_en || !formData.author || !formData.company) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Auto-translate if French quote is empty
    let finalFormData = { ...formData };
    if (!formData.quote_fr && formData.quote_en) {
      setIsTranslating(true);
      try {
        const { data, error } = await supabase.functions.invoke("translate-content", {
          body: { texts: [{ key: "quote_fr", value: formData.quote_en }] },
        });
        if (!error && data?.translations) {
          finalFormData.quote_fr = data.translations.quote_fr || formData.quote_en;
        } else {
          finalFormData.quote_fr = formData.quote_en;
        }
      } catch {
        finalFormData.quote_fr = formData.quote_en;
      }
      setIsTranslating(false);
    }

    saveMutation.mutate({
      ...finalFormData,
      id: editingTestimonial?.id,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Testimonials</h1>
          <p className="text-muted-foreground">Manage "What People Say" section</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setFormData(initialFormData)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Testimonial
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTestimonial ? "Edit Testimonial" : "Add Testimonial"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="author">Author *</Label>
                  <Input
                    id="author"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Company *</Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="Acme Inc."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quote_en">Quote (English) *</Label>
                <Textarea
                  id="quote_en"
                  value={formData.quote_en}
                  onChange={(e) => setFormData({ ...formData, quote_en: e.target.value })}
                  placeholder="Enter the testimonial quote..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quote_fr">Quote (French) - Auto-translated if empty</Label>
                <Textarea
                  id="quote_fr"
                  value={formData.quote_fr}
                  onChange={(e) => setFormData({ ...formData, quote_fr: e.target.value })}
                  placeholder="Leave empty for auto-translation..."
                  rows={4}
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Active (visible on homepage)</Label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={saveMutation.isPending || isTranslating}>
                  {saveMutation.isPending || isTranslating
                    ? isTranslating ? "Translating..." : "Saving..."
                    : editingTestimonial ? "Update" : "Create"}
                </Button>
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {testimonials?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Quote className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No testimonials yet. Add your first one!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {testimonials?.map((testimonial) => (
            <Card key={testimonial.id} className={!testimonial.is_active ? "opacity-60" : ""}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                    <div>
                      <CardTitle className="text-lg">{testimonial.author}</CardTitle>
                      <p className="text-sm text-muted-foreground">{testimonial.company}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={testimonial.is_active}
                      onCheckedChange={(checked) =>
                        toggleActiveMutation.mutate({ id: testimonial.id, is_active: checked })
                      }
                    />
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(testimonial)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete testimonial?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete the testimonial from {testimonial.author}.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteMutation.mutate(testimonial.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <blockquote className="italic text-muted-foreground border-l-2 border-primary pl-4">
                  "{testimonial.quote_en}"
                </blockquote>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminTestimonials;
