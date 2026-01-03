import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, ArrowUpRight } from "iconoir-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export const Articles = () => {
  const { t, language } = useLanguage();

  const { data: articles, isLoading } = useQuery({
    queryKey: ["latest-articles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .eq("is_published", true)
        .order("published_at", { ascending: false })
        .limit(3);

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <section id="articles" className="py-24">
        <div className="container mx-auto px-6">
          <div className="text-left md:text-center mb-16">
            <h2 className="font-serif text-4xl md:text-5xl font-bold mb-4">
              {t.articles.title}
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card rounded-2xl p-6 border border-border animate-pulse">
                <div className="space-y-4">
                  <div className="h-4 bg-muted rounded w-1/2" />
                  <div className="h-6 bg-muted rounded w-full" />
                  <div className="h-4 bg-muted rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!articles || articles.length === 0) {
    return null;
  }

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
          {articles.map((article) => {
            const title = language === "fr" ? article.title_fr : article.title_en;
            const excerpt = language === "fr" ? article.excerpt_fr : article.excerpt_en;
            const category = language === "fr" ? article.category_fr : article.category_en;
            const publishedDate = article.published_at 
              ? format(new Date(article.published_at), "PPP", { locale: language === "fr" ? fr : undefined })
              : "";

            return (
              <Link
                key={article.id}
                to={`/articles/${article.slug}`}
                className="group bg-card rounded-2xl p-6 border border-border hover:border-accent/50 transition-all duration-300 hover:shadow-lg"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{publishedDate}</span>
                    <span>·</span>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" strokeWidth={2} />
                      {article.read_time || 5} {t.articles.minRead}
                    </div>
                  </div>
                  
                  {category && (
                    <Badge variant="secondary" className="text-xs pointer-events-none">
                      {category}
                    </Badge>
                  )}
                  
                  <h3 className="font-serif text-xl font-bold leading-tight group-hover:text-accent transition-colors">
                    {title}
                  </h3>
                  
                  <p className="text-muted-foreground leading-relaxed line-clamp-3">
                    {excerpt}
                  </p>
                  
                  <div className="flex items-center gap-1 text-sm font-medium text-accent">
                    {t.articles.readMore}
                    <ArrowUpRight className="w-4 h-4" strokeWidth={2} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <Link to="/articles">
            <Button variant="outline" size="lg">
              {t.articles.readMore}
              <ArrowUpRight className="ml-2 w-4 h-4" strokeWidth={2} />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};
