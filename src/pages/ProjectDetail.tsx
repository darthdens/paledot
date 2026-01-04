import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowUpRight, NavArrowLeft, NavArrowRight } from "iconoir-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { sanitizeRichTextHtml } from "@/lib/richText";
import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface Project {
  id: string;
  slug: string;
  title_en: string;
  title_fr: string;
  description_en: string;
  description_fr: string;
  content_en: string | null;
  content_fr: string | null;
  image_url: string | null;
  gallery_images: string[] | null;
  tags: string[];
  external_url: string | null;
  award_en: string | null;
  award_fr: string | null;
}

// Extract image URLs from HTML content
const extractImagesFromContent = (html: string): string[] => {
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/g;
  const images: string[] = [];
  let match;
  while ((match = imgRegex.exec(html)) !== null) {
    images.push(match[1]);
  }
  return images;
};

// Remove images from HTML content
const removeImagesFromContent = (html: string): string => {
  return html.replace(/<img[^>]*>/g, '');
};

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

  useEffect(() => {
    if (project) {
      const title = language === "fr" ? project.title_fr : project.title_en;
      const parentPage = language === "fr" ? "Projets" : "Projects";
      document.title = `${title} | ${parentPage} | Dens`;
    }
  }, [project, language]);

  const { allImages, textContent } = useMemo(() => {
    if (!project) return { allImages: [], textContent: null };
    
    const content = (language === "fr" && project.content_fr) ? project.content_fr : project.content_en;
    const images: string[] = [];
    
    // Add main image first (thumbnail)
    if (project.image_url) {
      images.push(project.image_url);
    }
    
    // Add gallery images
    if (project.gallery_images && project.gallery_images.length > 0) {
      images.push(...project.gallery_images);
    }
    
    // Extract images from content and add them too
    if (content) {
      const contentImages = extractImagesFromContent(content);
      images.push(...contentImages);
    }
    
    // Remove images from content for text column
    const cleanContent = content ? sanitizeRichTextHtml(removeImagesFromContent(content)) : null;
    
    return { allImages: images, textContent: cleanContent };
  }, [project, language]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navigation />
        <div className="flex-1 pt-24 container mx-auto px-6">
          <div className="text-muted-foreground">{language === "fr" ? "Chargement..." : "Loading..."}</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navigation />
        <div className="flex-1 pt-24 container mx-auto px-6 text-center">
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
        <Footer />
      </div>
    );
  }

  const title = language === "fr" ? project.title_fr : project.title_en;
  const description = language === "fr" ? project.description_fr : project.description_en;
  const award = language === "fr" ? project.award_fr : project.award_en;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-6">
          <Link 
            to="/projects" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            {language === "fr" ? "Tous les projets" : "All Projects"}
          </Link>

          {/* Mobile: Sticky Carousel + scrollable content */}
          <div className="md:hidden -mx-6">
            {/* Sticky Image Carousel */}
            {allImages.length > 0 && (
              <div className="sticky top-16 z-10 bg-background pb-3">
                <Carousel 
                  className="w-full"
                  opts={{
                    loop: true,
                  }}
                  plugins={[
                    Autoplay({
                      delay: 4000,
                      stopOnInteraction: false,
                      stopOnMouseEnter: true,
                    }),
                  ]}
                >
                  <CarouselContent>
                    {allImages.map((imageUrl, index) => (
                      <CarouselItem key={index}>
                        <div className="aspect-[4/3] overflow-hidden">
                          <img
                            src={imageUrl}
                            alt={`${title} - ${language === "fr" ? "Image" : "Image"} ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  {/* Arrows hidden on mobile - swipe to navigate */}
                </Carousel>
                {/* Dots indicator */}
                {allImages.length > 1 && (
                  <div className="flex justify-center gap-1.5 mt-3">
                    {allImages.map((_, index) => (
                      <div
                        key={index}
                        className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30"
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Text content */}
            <div className="space-y-5 px-6 pt-4">
              {award && (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/20 text-sm font-medium">
                  {award}
                </div>
              )}

              <h1 className="font-serif text-3xl font-bold">
                {title}
              </h1>

              <div className="flex flex-wrap gap-2">
                {project.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="pointer-events-none">
                    {tag}
                  </Badge>
                ))}
              </div>

              <p className="text-base text-muted-foreground leading-relaxed">
                {description}
              </p>

              {project.external_url && (
                <a href={project.external_url} target="_blank" rel="noopener noreferrer" className="inline-block">
                  <Button>
                    {language === "fr" ? "Voir le projet" : "View Project"}
                    <ArrowUpRight className="w-4 h-4 ml-2" />
                  </Button>
                </a>
              )}

              {textContent && (
                <div
                  className="prose prose-base max-w-none text-muted-foreground prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground prose-blockquote:text-muted-foreground prose-code:text-foreground [&_a]:text-foreground [&_a]:font-medium [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:opacity-70 [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:list-outside [&_ol]:list-outside [&_li]:list-item [&_li]:marker:text-muted-foreground prose-blockquote:border-l-border prose-blockquote:border-l-2 prose-blockquote:pl-4 [&_h1]:text-3xl [&_h1]:font-semibold [&_h1]:mt-8 [&_h1]:mb-4 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:mt-6 [&_h2]:mb-3 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mt-5 [&_h3]:mb-2 [&_ul]:pl-6 [&_ol]:pl-6 [&_blockquote]:italic [&_p]:mb-4"
                  dangerouslySetInnerHTML={{ __html: textContent }}
                />
              )}
            </div>
          </div>

          {/* Tablet & Desktop: Two-column layout */}
          <div className="hidden md:grid md:grid-cols-2 gap-8 lg:gap-12">
            {/* Left Column - Text Content */}
            <div className="md:max-h-[calc(100vh-12rem)] md:overflow-y-auto md:pr-4 space-y-6">
              {award && (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/20 text-sm font-medium">
                  {award}
                </div>
              )}

              <h1 className="font-serif text-4xl lg:text-5xl font-bold">
                {title}
              </h1>

              <div className="flex flex-wrap gap-2">
                {project.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="pointer-events-none">
                    {tag}
                  </Badge>
                ))}
              </div>

              <p className="text-lg text-muted-foreground leading-relaxed">
                {description}
              </p>

              {project.external_url && (
                <a href={project.external_url} target="_blank" rel="noopener noreferrer" className="inline-block">
                  <Button>
                    {language === "fr" ? "Voir le projet" : "View Project"}
                    <ArrowUpRight className="w-4 h-4 ml-2" />
                  </Button>
                </a>
              )}

              {textContent && (
                <div
                  className="prose prose-lg max-w-none text-muted-foreground prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground prose-blockquote:text-muted-foreground prose-code:text-foreground [&_a]:text-foreground [&_a]:font-medium [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:opacity-70 [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:list-outside [&_ol]:list-outside [&_li]:list-item [&_li]:marker:text-muted-foreground prose-blockquote:border-l-border prose-blockquote:border-l-2 prose-blockquote:pl-4 [&_h1]:text-4xl [&_h1]:font-semibold [&_h1]:mt-10 [&_h1]:mb-4 [&_h2]:text-3xl [&_h2]:font-semibold [&_h2]:mt-8 [&_h2]:mb-3 [&_h3]:text-2xl [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-2 [&_ul]:pl-6 [&_ol]:pl-6 [&_blockquote]:italic [&_p]:mb-5"
                  dangerouslySetInnerHTML={{ __html: textContent }}
                />
              )}
            </div>

            {/* Right Column - Vertical Auto-Scrolling Images */}
            {allImages.length > 0 && (
              <div className="md:sticky md:top-24 md:h-[calc(100vh-8rem)] overflow-hidden relative">
                {/* Top fade gradient */}
                <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-background to-transparent z-10 pointer-events-none" />
                {/* Bottom fade gradient */}
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none" />
                <div 
                  className="flex flex-col gap-4 animate-[scroll-vertical_30s_linear_infinite] hover:[animation-play-state:paused]"
                  style={{
                    animationDuration: `${allImages.length * 8}s`,
                  }}
                >
                  {/* Original images */}
                  {allImages.map((imageUrl, index) => (
                    <div key={index} className="rounded-2xl overflow-hidden flex-shrink-0">
                      <img
                        src={imageUrl}
                        alt={`${title} - ${language === "fr" ? "Image" : "Image"} ${index + 1}`}
                        className="w-full"
                      />
                    </div>
                  ))}
                  {/* Duplicate for seamless loop */}
                  {allImages.map((imageUrl, index) => (
                    <div key={`dup-${index}`} className="rounded-2xl overflow-hidden flex-shrink-0">
                      <img
                        src={imageUrl}
                        alt={`${title} - ${language === "fr" ? "Image" : "Image"} ${index + 1}`}
                        className="w-full"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProjectDetail;
