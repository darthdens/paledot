import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpRight } from "iconoir-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Projects = () => {
  const { t, language } = useLanguage();

  const { data: projects, isLoading } = useQuery({
    queryKey: ["featured-projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("is_featured", true)
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <section id="projects" className="py-24 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="text-left md:text-center mb-16">
            <h2 className="font-serif text-4xl md:text-5xl font-bold mb-4">
              {t.projects.title}
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {[1, 2].map((i) => (
              <div key={i} className="bg-card/70 rounded-2xl overflow-hidden border border-border animate-pulse">
                <div className="aspect-video bg-muted" />
                <div className="p-6 space-y-4">
                  <div className="h-6 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!projects || projects.length === 0) {
    return null;
  }

  return (
    <section id="projects" className="py-24 bg-muted/30">
      <div className="container mx-auto px-6">
        <div className="text-left md:text-center mb-16">
          <h2 className="font-serif text-4xl md:text-5xl font-bold mb-4">
            {t.projects.title}
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl md:mx-auto">
            {t.projects.subtitle}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {projects.map((project) => {
            const title = language === "fr" ? project.title_fr : project.title_en;
            const description = language === "fr" ? project.description_fr : project.description_en;
            const award = language === "fr" ? project.award_fr : project.award_en;

            return (
              <Link
                key={project.id}
                to={`/projects/${project.slug}`}
                className="group bg-card/70 backdrop-blur-md rounded-2xl overflow-hidden border border-border relative z-10 hover:border-accent/50 transition-all duration-300"
              >
                <div className="aspect-video overflow-hidden bg-muted">
                  {project.image_url && (
                    <img
                      src={project.image_url}
                      alt={title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  )}
                </div>
                <div className="p-6 space-y-4">
                  {award && (
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/20 text-sm font-medium">
                      {award}
                    </div>
                  )}
                  <h3 className="font-serif text-2xl font-bold group-hover:text-accent transition-colors">
                    {title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {project.tags?.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs pointer-events-none">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <Link to="/projects">
            <Button variant="outline" size="lg">
              {t.projects.viewAll}
              <ArrowUpRight className="ml-2 w-4 h-4" strokeWidth={2} />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};
