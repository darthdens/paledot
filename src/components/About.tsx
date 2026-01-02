import { Badge } from "@/components/ui/badge";

const skills = [
  "Product Design",
  "Web Development",
  "Brand Strategy",
  "Blockchain",
  "Marketing",
  "AI/ML",
  "Team Leadership",
  "Community Building",
];

const languages = [
  { name: "French", level: "Native", flag: "🇫🇷" },
  { name: "English", level: "Fluent", flag: "🇬🇧" },
  { name: "Italian", level: "Conversational", flag: "🇮🇹" },
];

export const About = () => {
  return (
    <section id="about" className="py-24 bg-muted/30">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div>
              <h2 className="font-serif text-4xl md:text-5xl font-bold mb-6">
                🧔🏻 About Me
              </h2>
              <div className="space-y-4 text-lg text-muted-foreground leading-relaxed">
                <p>
                  Hi! I'm <strong className="text-foreground">Dénis (or Dens) Akoka</strong>, a multidisciplinary creative professional based in Dundee, Scotland. I've spent the past 5+ years working at the intersection of design, technology, and marketing.
                </p>
                <p>
                  My journey has taken me through the worlds of blockchain technology, startup ecosystems, and digital product development. I love building things that matter and helping others bring their visions to life.
                </p>
                <p>
                  When I'm not working, you'll find me exploring new technologies, learning languages, or contributing to open-source projects. I believe in continuous learning and staying curious.
                </p>
              </div>
            </div>

            <div>
              <h3 className="font-serif text-xl font-bold mb-4">Core Skills</h3>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="text-sm py-1.5 px-3">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-card rounded-2xl p-8 border border-border">
              <h3 className="font-serif text-xl font-bold mb-6">Languages</h3>
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

            <div className="bg-card rounded-2xl p-8 border border-border">
              <h3 className="font-serif text-xl font-bold mb-4">Recognition</h3>
              <div className="flex items-start gap-4">
                <div className="text-3xl">🏆</div>
                <div>
                  <div className="font-semibold">2nd Prize - xDay Hackathon 2023</div>
                  <div className="text-muted-foreground text-sm">
                    MultiversX · Infrastructure and Dev Tooling Track
                  </div>
                </div>
              </div>
            </div>

            <blockquote className="bg-card rounded-2xl p-8 border border-border">
              <p className="text-lg italic text-muted-foreground mb-4">
                "Working with Dénis was a pleasure. His deep understanding of blockchain technology and marketing expertise helped Calileo secure funding and build a strong community."
              </p>
              <footer className="font-medium">
                — Florian Vagner, Calileo
              </footer>
            </blockquote>
          </div>
        </div>
      </div>
    </section>
  );
};
