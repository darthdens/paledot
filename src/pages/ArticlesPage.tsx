import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Clock, ArrowUpRight, ArrowLeft } from "iconoir-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Starfield } from "@/components/Starfield";

interface Article {
  id: string;
  slug: string;
  title_en: string;
  title_fr: string;
  excerpt_en: string;
  excerpt_fr: string;
  image_url: string | null;
  category_en: string | null;
  category_fr: string | null;
  read_time: number;
  published_at: string | null;
}

const ArticlesPage = () => {
  const { language, t } = useLanguage();
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    document.title = language === "fr" ? "Articles | Dens" : "Articles | Dens";
  }, [language]);

  useEffect(() => {
    const fetchArticles = async () => {
      const { data } = await supabase
        .from("articles")
        .select("*")
        .eq("is_published", true)
        .order("published_at", { ascending: false });
      
      setArticles(data || []);
      setIsLoading(false);
    };

    fetchArticles();
  }, []);

  const getTitle = (a: Article) => language === "fr" ? a.title_fr : a.title_en;
  const getExcerpt = (a: Article) => language === "fr" ? a.excerpt_fr : a.excerpt_en;
  const getCategory = (a: Article) => language === "fr" ? a.category_fr : a.category_en;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString(language === "fr" ? "fr-FR" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
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
            {language === "fr" ? "Tous les Articles" : "All Articles"}
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mb-12">
            {t.articles.subtitle}
          </p>

          {isLoading ? (
            <div className="text-muted-foreground">Loading...</div>
          ) : articles.length === 0 ? (
            <div className="text-muted-foreground">
              {language === "fr" ? "Aucun article pour l'instant." : "No articles yet."}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((article) => (
                <Link
                  key={article.id}
                  to={`/articles/${article.slug}`}
                  className="group block"
                >
                  <article className="rounded-2xl overflow-hidden bg-card border border-border hover:border-primary/50 transition-all duration-300 h-full flex flex-col">
                    {article.image_url && (
                      <div className="aspect-video overflow-hidden">
                        <img
                          src={article.image_url}
                          alt={getTitle(article)}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    )}
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="flex items-center gap-3 mb-3">
                        {getCategory(article) && (
                          <Badge variant="secondary">{getCategory(article)}</Badge>
                        )}
                        <span className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {article.read_time} {t.articles.minRead}
                        </span>
                      </div>
                      <h3 className="font-serif text-xl font-bold mb-2 group-hover:text-primary transition-colors flex items-center gap-2">
                        {getTitle(article)}
                        <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </h3>
                      <p className="text-muted-foreground line-clamp-3 flex-1">
                        {getExcerpt(article)}
                      </p>
                      {article.published_at && (
                        <p className="text-sm text-muted-foreground mt-4">
                          {formatDate(article.published_at)}
                        </p>
                      )}
                    </div>
                  </article>
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

export default ArticlesPage;
