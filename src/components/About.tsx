import { Badge } from "@/components/ui/badge";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Testimonial {
  id: string;
  quote_en: string;
  quote_fr: string;
  author: string;
  company: string;
}

export const About = () => {
  const { t, language } = useLanguage();

  const skills = [
    t.about.skills.productDesign,
    t.about.skills.webDevelopment,
    t.about.skills.brandStrategy,
    t.about.skills.blockchain,
    t.about.skills.marketing,
    t.about.skills.aiMl,
    t.about.skills.teamLeadership,
    t.about.skills.communityBuilding,
  ];

  const languages = [
    { name: t.about.languagesList.french.name, level: t.about.languagesList.french.level, flag: "🇫🇷" },
    { name: t.about.languagesList.english.name, level: t.about.languagesList.english.level, flag: "🇬🇧" },
    { name: t.about.languagesList.italian.name, level: t.about.languagesList.italian.level, flag: "🇮🇹" },
  ];

  const { data: dbTestimonials } = useQuery({
    queryKey: ["testimonials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("testimonials")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      
      if (error) throw error;
      return data as Testimonial[];
    },
  });

  // Use database testimonials if available, otherwise fall back to translations
  const testimonials = dbTestimonials && dbTestimonials.length > 0
    ? dbTestimonials.map(t => ({
        quote: language === "fr" ? t.quote_fr : t.quote_en,
        author: t.author,
        company: t.company,
      }))
    : t.about.testimonialsList;

  return (
    <section id="about" className="py-24 bg-muted/30">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8 min-w-0">
            <div>
              <h2 className="font-serif text-4xl md:text-5xl font-bold mb-6">
                {t.about.title}
              </h2>
              <div className="space-y-4 text-lg text-muted-foreground leading-relaxed">
                <p>
                  {t.about.intro1} <strong className="text-foreground">{t.about.name}</strong>{t.about.intro2}
                </p>
                <p>
                  {t.about.paragraph2}
                </p>
                <p>
                  {t.about.paragraph3}
                </p>
              </div>
            </div>

            <div>
              <h3 className="font-serif text-xl font-bold mb-4">{t.about.coreSkills}</h3>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="text-sm py-1.5 px-3 pointer-events-none">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-8 min-w-0">
            <div className="bg-card/70 backdrop-blur-md rounded-2xl p-5 sm:p-8 border border-border relative z-10">
              <h3 className="font-serif text-xl font-bold mb-6">{t.about.languages}</h3>
              <div className="space-y-4">
                {languages.map((lang) => (
                  <div key={lang.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{lang.flag}</span>
                      <span className="font-medium">{lang.name}</span>
                    </div>
                    <span className="text-muted-foreground text-sm">{lang.level}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card/70 backdrop-blur-md rounded-2xl p-5 sm:p-8 border border-border relative z-10">
              <h3 className="font-serif text-xl font-bold mb-4">{t.about.recognition}</h3>
              <div className="flex items-start gap-4">
                <div className="text-3xl">🏆</div>
                <div>
                  <div className="font-semibold">{t.about.award}</div>
                  <div className="text-muted-foreground text-sm">
                    {t.about.awardDesc}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card/70 backdrop-blur-md rounded-2xl p-5 sm:p-8 border border-border relative z-10">
              <h3 className="font-serif text-xl font-bold mb-6">{t.about.testimonials}</h3>
              <Carousel className="w-full">
                <CarouselContent>
                    {testimonials.map((testimonial, index) => (
                      <CarouselItem key={index}>
                        <blockquote className="break-words px-4">
                          <p className="text-lg italic text-muted-foreground mb-4 break-words">
                            "{testimonial.quote}"
                          </p>
                          <footer className="font-medium">
                            — {testimonial.author}, {testimonial.company}
                          </footer>
                        </blockquote>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <div className="flex justify-center gap-2 mt-4">
                    <CarouselPrevious className="static translate-y-0" />
                    <CarouselNext className="static translate-y-0" />
                  </div>
                </Carousel>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
