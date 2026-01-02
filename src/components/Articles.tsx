import { Badge } from "@/components/ui/badge";
import { Clock, ArrowUpRight } from "iconoir-react";

const articles = [
  {
    title: "Building a Digital Twin: My Journey Creating DensAI",
    excerpt: "How I built an AI assistant that represents me online and handles queries in multiple languages.",
    date: "2024",
    category: "AI & Technology",
    readTime: "8 min read",
  },
  {
    title: "Web3 Social Platforms: The Future of User Data Ownership",
    excerpt: "Lessons learned from building Calileo and winning at MultiversX Hackathon.",
    date: "2023",
    category: "Blockchain",
    readTime: "6 min read",
  },
  {
    title: "From Freelancer to Product Leader: A Career Evolution",
    excerpt: "My journey from creating websites to leading product teams and marketing campaigns.",
    date: "2023",
    category: "Career",
    readTime: "5 min read",
  },
];

export const Articles = () => {
  return (
    <section id="articles" className="py-24">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="font-serif text-4xl md:text-5xl font-bold mb-4">
            Latest Thoughts
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Occasional writings on technology, design, and the creative journey.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {articles.map((article) => (
            <article
              key={article.title}
              className="group bg-card rounded-2xl p-6 border border-border hover:border-accent/50 transition-all duration-300 hover:shadow-lg cursor-pointer"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{article.date}</span>
                  <span>·</span>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" strokeWidth={2} />
                    {article.readTime}
                  </div>
                </div>
                
                <Badge variant="secondary" className="text-xs pointer-events-none">
                  {article.category}
                </Badge>
                
                <h3 className="font-serif text-xl font-bold leading-tight group-hover:text-accent transition-colors">
                  {article.title}
                </h3>
                
                <p className="text-muted-foreground leading-relaxed">
                  {article.excerpt}
                </p>
                
                <div className="flex items-center gap-1 text-sm font-medium text-accent">
                  Read More
                  <ArrowUpRight className="w-4 h-4" strokeWidth={2} />
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
