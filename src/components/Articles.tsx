import { Badge } from "@/components/ui/badge";
import { Clock, ArrowUpRight } from "iconoir-react";
import { useLanguage } from "@/i18n/LanguageContext";

export const Articles = () => {
  const { t } = useLanguage();

  return (
    <section id="articles" className="py-24">
      <div className="container mx-auto px-6">
        <div className="text-left md:text-center mb-16">
          <h2 className="font-serif text-4xl md:text-5xl font-bold mb-4">
            {t.articles.title}
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl md:mx-auto">
            {t.articles.subtitle}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {t.articles.items.map((article, index) => (
            <article
              key={index}
              className="group bg-card rounded-2xl p-6 border border-border hover:border-accent/50 transition-all duration-300 hover:shadow-lg cursor-pointer"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{article.date}</span>
                  <span>·</span>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" strokeWidth={2} />
                    {article.readTime} {t.articles.minRead}
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
                  {t.articles.readMore}
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
