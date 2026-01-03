import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowUpRight } from "iconoir-react";
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

const ProjectDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { language } = useLanguage();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProject = async () => {
      const { data } = await supabase
        .from("projects")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      
      setProject(data);
      setIsLoading(false);
    };

    if (slug) {
      fetchProject();
    }
  }, [slug]);

  // Update document title when project is loaded
  useEffect(() => {
    if (project) {
      const title = language === "fr" ? project.title_fr : project.title_en;
      const parentPage = language === "fr" ? "Projets" : "Projects";
      document.title = `${title} | ${parentPage} | Dens`;
    }
  }, [project, language]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-24 container mx-auto px-6">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-24 container mx-auto px-6 text-center">
          <h1 className="font-serif text-3xl font-bold mb-4">
            {language === "fr" ? "Projet non trouvé" : "Project not found"}
          </h1>
          <Link to="/projects">
            <Button variant="secondary">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {language === "fr" ? "Retour aux projets" : "Back to Projects"}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const title = language === "fr" ? project.title_fr : project.title_en;
  const description = language === "fr" ? project.description_fr : project.description_en;
  const award = language === "fr" ? project.award_fr : project.award_en;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-6 max-w-4xl">
          <Link 
            to="/projects" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            {language === "fr" ? "Tous les projets" : "All Projects"}
          </Link>

          {award && (
            <p className="text-primary mb-4">{award}</p>
          )}

          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-6">
            {title}
          </h1>

          <div className="flex flex-wrap gap-2 mb-8">
            {project.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>

          {project.image_url && (
            <div className="rounded-2xl overflow-hidden mb-8">
              <img
                src={project.image_url}
                alt={title}
                className="w-full"
              />
            </div>
          )}

          <div className="prose prose-lg dark:prose-invert max-w-none mb-8">
            <p className="text-lg text-muted-foreground leading-relaxed">
              {description}
            </p>
          </div>

          {project.external_url && (
            <a href={project.external_url} target="_blank" rel="noopener noreferrer">
              <Button>
                {language === "fr" ? "Voir le projet" : "View Project"}
                <ArrowUpRight className="w-4 h-4 ml-2" />
              </Button>
            </a>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProjectDetail;
