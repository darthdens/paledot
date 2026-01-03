import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, ArrowLeft } from "iconoir-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";

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
}

const ProjectsPage = () => {
  const { language } = useLanguage();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      const { data } = await supabase
        .from("projects")
        .select("*")
        .order("display_order", { ascending: true });
      
      setProjects(data || []);
      setIsLoading(false);
    };

    fetchProjects();
  }, []);

  const getTitle = (p: Project) => language === "fr" ? p.title_fr : p.title_en;
  const getDescription = (p: Project) => language === "fr" ? p.description_fr : p.description_en;
  const getAward = (p: Project) => language === "fr" ? p.award_fr : p.award_en;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-6">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            {language === "fr" ? "Retour" : "Back"}
          </Link>

          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">
            {language === "fr" ? "Tous les Projets" : "All Projects"}
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mb-12">
            {language === "fr" 
              ? "Une collection de projets que j'ai construits, dirigés ou auxquels j'ai contribué."
              : "A collection of projects I've built, led, or contributed to."
            }
          </p>

          {isLoading ? (
            <div className="text-muted-foreground">Loading...</div>
          ) : projects.length === 0 ? (
            <div className="text-muted-foreground">
              {language === "fr" ? "Aucun projet pour l'instant." : "No projects yet."}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  to={`/projects/${project.slug}`}
                  className="group block"
                >
                  <div className="rounded-2xl overflow-hidden bg-card border border-border hover:border-primary/50 transition-all duration-300">
                    {project.image_url && (
                      <div className="aspect-video overflow-hidden">
                        <img
                          src={project.image_url}
                          alt={getTitle(project)}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    )}
                    <div className="p-6">
                      {getAward(project) && (
                        <p className="text-sm text-primary mb-2">{getAward(project)}</p>
                      )}
                      <h3 className="font-serif text-xl font-bold mb-2 group-hover:text-primary transition-colors flex items-center gap-2">
                        {getTitle(project)}
                        <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </h3>
                      <p className="text-muted-foreground mb-4 line-clamp-2">
                        {getDescription(project)}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {project.tags.slice(0, 4).map((tag) => (
                          <Badge key={tag} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProjectsPage;
