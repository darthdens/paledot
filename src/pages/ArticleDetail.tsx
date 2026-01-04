import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock } from "iconoir-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { sanitizeRichTextHtml } from "@/lib/richText";

interface Article {
  id: string;
  slug: string;
  title_en: string;
  title_fr: string;
  excerpt_en: string;
  excerpt_fr: string;
  content_en: string;
  content_fr: string;
  image_url: string | null;
  category_en: string | null;
  category_fr: string | null;
  read_time: number;
  published_at: string | null;
}

const ArticleDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { language, t } = useLanguage();
  const [article, setArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchArticle = async () => {
      const { data } = await supabase
        .from("articles")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();
      
      setArticle(data);
      setIsLoading(false);
    };

    if (slug) {
      fetchArticle();
    }
  }, [slug]);

  // Update document title when article is loaded
  useEffect(() => {
    if (article) {
      const title = language === "fr" ? article.title_fr : article.title_en;
      document.title = `${title} | Articles | Dens`;
    }
  }, [article, language]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString(language === "fr" ? "fr-FR" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

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

  if (!article) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-24 container mx-auto px-6 text-center">
          <h1 className="font-serif text-3xl font-bold mb-4">
            {language === "fr" ? "Article non trouvé" : "Article not found"}
          </h1>
          <Link to="/articles">
            <Button variant="secondary">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {language === "fr" ? "Retour aux articles" : "Back to Articles"}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const title = language === "fr" ? article.title_fr : article.title_en;
  const content = (language === "fr" && article.content_fr) ? article.content_fr : article.content_en;
  const sanitizedContent = content ? sanitizeRichTextHtml(content) : null;
  const category = language === "fr" ? article.category_fr : article.category_en;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      
      <main className="flex-1 pt-24 pb-16">
        <article className="container mx-auto px-6 max-w-3xl">
          <Link 
            to="/articles" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            {language === "fr" ? "Tous les articles" : "All Articles"}
          </Link>

          <div className="flex items-center gap-4 mb-6">
            {category && <Badge variant="static">{category}</Badge>}
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              {article.read_time} {t.articles.minRead}
            </span>
            {article.published_at && (
              <span className="text-sm text-muted-foreground">
                {formatDate(article.published_at)}
              </span>
            )}
          </div>

          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-8 leading-tight">
            {title}
          </h1>

          {article.image_url && (
            <div className="rounded-2xl overflow-hidden mb-8">
              <img
                src={article.image_url}
                alt={title}
                className="w-full"
              />
            </div>
          )}

          {sanitizedContent && (
            <div
              className="prose prose-lg max-w-none text-muted-foreground prose-headings:text-foreground prose-headings:font-serif prose-h1:text-4xl prose-h1:font-bold prose-h2:text-3xl prose-h2:font-bold prose-h3:text-2xl prose-h3:font-semibold prose-h4:text-xl prose-h4:font-semibold prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground prose-a:text-primary prose-blockquote:text-muted-foreground prose-blockquote:border-l-primary prose-code:text-foreground"
              dangerouslySetInnerHTML={{ __html: sanitizedContent }}
            />
          )}
        </article>
      </main>

      <Footer />
    </div>
  );
};

export default ArticleDetail;
