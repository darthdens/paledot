import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpRight } from "iconoir-react";
import { useLanguage } from "@/i18n/LanguageContext";
export const Projects = () => {
  const { t } = useLanguage();

  const projects = [
    {
      key: "calileo",
      title: t.projects.items.calileo.title,
      description: t.projects.items.calileo.description,
      tags: [t.projects.tags.web3, t.projects.tags.blockchain, t.projects.tags.socialPlatform, t.projects.tags.multiversx],
      image: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&auto=format&fit=crop",
      award: t.projects.items.calileo.award,
      featured: true,
    },
    {
      key: "densai",
      title: t.projects.items.densai.title,
      description: t.projects.items.densai.description,
      tags: [t.projects.tags.ai, t.projects.tags.nlp, t.projects.tags.personalBranding, t.projects.tags.multilingual],
      image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&auto=format&fit=crop",
      featured: true,
    },
    {
      key: "brandWeb",
      title: t.projects.items.brandWeb.title,
      description: t.projects.items.brandWeb.description,
      tags: [t.projects.tags.branding, t.projects.tags.webDesign, t.projects.tags.uiux, t.projects.tags.development],
      image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&auto=format&fit=crop",
    },
    {
      key: "marketing",
      title: t.projects.items.marketing.title,
      description: t.projects.items.marketing.description,
      tags: [t.projects.tags.marketing, t.projects.tags.growth, t.projects.tags.community, t.projects.tags.strategy],
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop",
    },
  ];

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
          {projects.map((project) => (
            <div
              key={project.key}
              className={`bg-card/70 backdrop-blur-md rounded-2xl overflow-hidden border border-border relative z-10 ${
                project.featured ? "md:col-span-1" : ""
              }`}
            >
              <div className="aspect-video overflow-hidden bg-muted">
                <img
                  src={project.image}
                  alt={project.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6 space-y-4">
                {project.award && (
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/20 text-sm font-medium">
                    {project.award}
                  </div>
                )}
                <h3 className="font-serif text-2xl font-bold">
                  {project.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {project.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {project.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs pointer-events-none">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          ))}
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
