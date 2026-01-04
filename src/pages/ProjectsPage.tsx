import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowUpRight, ArrowLeft, Search } from "iconoir-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Starfield } from "@/components/Starfield";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  display_order: number | null;
}

type SortOption = "default" | "alphabetical-asc" | "alphabetical-desc";

const ProjectsPage = () => {
  const { language } = useLanguage();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("default");
  const [selectedTag, setSelectedTag] = useState<string>("all");

  useEffect(() => {
    document.title = language === "fr" ? "Projets | Dens" : "Projects | Dens";
  }, [language]);

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

  // Get all unique tags from projects
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    projects.forEach(p => p.tags?.forEach(tag => tags.add(tag)));
    return Array.from(tags).sort();
  }, [projects]);

  // Filter and sort projects
  const filteredProjects = useMemo(() => {
    let result = [...projects];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p => 
        getTitle(p).toLowerCase().includes(query) ||
        getDescription(p).toLowerCase().includes(query) ||
        p.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Filter by tag
    if (selectedTag !== "all") {
      result = result.filter(p => p.tags?.includes(selectedTag));
    }

    // Sort
    switch (sortBy) {
      case "alphabetical-asc":
        result.sort((a, b) => getTitle(a).localeCompare(getTitle(b)));
        break;
      case "alphabetical-desc":
        result.sort((a, b) => getTitle(b).localeCompare(getTitle(a)));
        break;
      default:
        result.sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
    }

    return result;
  }, [projects, searchQuery, selectedTag, sortBy, language]);

  const labels = {
    searchPlaceholder: language === "fr" ? "Rechercher des projets..." : "Search projects...",
    sortBy: language === "fr" ? "Trier par" : "Sort by",
    default: language === "fr" ? "Par défaut" : "Default",
    aToZ: language === "fr" ? "A à Z" : "A to Z",
    zToA: language === "fr" ? "Z à A" : "Z to A",
    allCategories: language === "fr" ? "Toutes les catégories" : "All categories",
    noResults: language === "fr" ? "Aucun projet trouvé." : "No projects found.",
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      <Starfield />
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
          <p className="text-muted-foreground text-lg max-w-2xl mb-8">
            {language === "fr" 
              ? "Une collection de projets que j'ai construits, dirigés ou auxquels j'ai contribué."
              : "A collection of projects I've built, led, or contributed to."
            }
          </p>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={labels.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedTag} onValueChange={setSelectedTag}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder={labels.allCategories} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{labels.allCategories}</SelectItem>
                {allTags.map(tag => (
                  <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder={labels.sortBy} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">{labels.default}</SelectItem>
                <SelectItem value="alphabetical-asc">{labels.aToZ}</SelectItem>
                <SelectItem value="alphabetical-desc">{labels.zToA}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="text-muted-foreground">Loading...</div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-muted-foreground">
              {labels.noResults}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {filteredProjects.map((project) => (
                <Link
                  key={project.id}
                  to={`/projects/${project.slug}`}
                  className="group block"
                >
                  <div className="rounded-2xl overflow-hidden bg-card/70 backdrop-blur-md border border-border hover:border-accent/50 transition-all duration-300">
                    {project.image_url && (
                      <div className="aspect-video overflow-hidden">
                        <img
                          src={project.image_url}
                          alt={getTitle(project)}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <div className="p-6">
                      {getAward(project) && (
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/20 text-sm font-medium mb-2">
                          {getAward(project)}
                        </div>
                      )}
                      <h3 className="font-serif text-xl font-bold mb-2 group-hover:text-accent transition-colors flex items-center gap-2">
                        {getTitle(project)}
                        <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </h3>
                      <p className="text-muted-foreground mb-4 line-clamp-2">
                        {getDescription(project)}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {project.tags.slice(0, 4).map((tag) => (
                          <Badge key={tag} variant="secondary" className="pointer-events-none">
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
