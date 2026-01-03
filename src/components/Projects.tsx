import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpRight } from "iconoir-react";

const projects = [
  {
    title: "Calileo",
    description: "A social platform for verifiable assets and user data autonomy. Won 2nd prize at MultiversX xDay Hackathon 2023.",
    tags: ["Web3", "Blockchain", "Social Platform", "MultiversX"],
    image: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&auto=format&fit=crop",
    award: "🏆 Award Winner - xDay Hackathon 2023",
    featured: true,
  },
  {
    title: "DensAI",
    description: "My personal AI assistant - a digital twin that can answer questions about me in multiple languages including French.",
    tags: ["AI", "NLP", "Personal Branding", "Multilingual"],
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&auto=format&fit=crop",
    featured: true,
  },
  {
    title: "Brand & Web Projects",
    description: "Collection of brand identities, websites, and digital experiences created for startups and established businesses.",
    tags: ["Branding", "Web Design", "UI/UX", "Development"],
    image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&auto=format&fit=crop",
  },
  {
    title: "Marketing Campaigns",
    description: "Strategic marketing campaigns for blockchain and tech startups, helping build communities and drive user acquisition.",
    tags: ["Marketing", "Growth", "Community", "Strategy"],
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop",
  },
];

export const Projects = () => {
  return (
    <section id="projects" className="py-24 bg-muted/30">
      <div className="container mx-auto px-6">
        <div className="text-left md:text-center mb-16">
          <h2 className="font-serif text-4xl md:text-5xl font-bold mb-4">
            Featured Projects
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl md:mx-auto">
            A selection of projects I've built, led, or contributed to over the years.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {projects.map((project) => (
            <div
              key={project.title}
              className={`bg-card rounded-2xl overflow-hidden border border-border ${
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
          <Button variant="outline" size="lg">
            View All Projects
            <ArrowUpRight className="ml-2 w-4 h-4" strokeWidth={2} />
          </Button>
        </div>
      </div>
    </section>
  );
};
