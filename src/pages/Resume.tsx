import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Starfield } from "@/components/Starfield";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/i18n/LanguageContext";
import { Download, Mail, Phone, MapPin, Linkedin, Globe } from "lucide-react";

export default function Resume() {
  const { t, language } = useLanguage();
  const r = t.resume;

  const handleDownloadPDF = () => {
    const link = document.createElement('a');
    link.href = '/Denis_Akoka_Resume.pdf';
    link.download = 'Denis_Akoka_Resume.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative">
      <Starfield />
      <Navigation />
      
      <main className="relative z-10 pt-24 pb-16">
        <div className="container mx-auto px-6 max-w-4xl">
          {/* Header */}
          <header className="text-center mb-12">
            <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">{r.title}</h1>
            <p className="text-xl text-muted-foreground italic mb-6">{r.subtitle}</p>
            
            <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground mb-6">
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {r.location}
              </span>
              <a href="mailto:denis.akoka@gmail.com" className="flex items-center gap-1 text-accent hover:underline transition-colors">
                <Mail className="w-4 h-4" />
                {r.email}
              </a>
              <a href="tel:+447552800685" className="flex items-center gap-1 text-accent hover:underline transition-colors">
                <Phone className="w-4 h-4" />
                {r.phone}
              </a>
              <a href="https://www.linkedin.com/in/denisakoka/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-accent hover:underline transition-colors">
                <Linkedin className="w-4 h-4" />
                LinkedIn
              </a>
              <a href="https://dens.so" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-accent hover:underline transition-colors">
                <Globe className="w-4 h-4" />
                {r.website}
              </a>
            </div>
            
            <Button onClick={handleDownloadPDF} className="gap-2">
              <Download className="w-4 h-4" />
              {r.downloadPdf}
            </Button>
          </header>

          {/* Career Profile */}
          <section className="mb-12">
            <h2 className="font-serif text-2xl font-bold mb-4 text-accent">{r.careerProfile.title}</h2>
            <p className="text-muted-foreground leading-relaxed">{r.careerProfile.content}</p>
          </section>

          {/* Core Competencies */}
          <section className="mb-12">
            <h2 className="font-serif text-2xl font-bold mb-4 text-accent">{r.coreCompetencies.title}</h2>
            <div className="flex flex-wrap gap-2">
              {r.coreCompetencies.skills.map((skill, index) => (
                <Badge key={index} variant="secondary" className="text-sm">
                  {skill}
                </Badge>
              ))}
            </div>
          </section>

          {/* Career Highlights */}
          <section className="mb-12">
            <h2 className="font-serif text-2xl font-bold mb-4 text-accent">{r.careerHighlights.title}</h2>
            <ul className="space-y-3">
              {r.careerHighlights.items.map((item, index) => (
                <li key={index} className="flex gap-2">
                  <span className="text-accent">•</span>
                  <span className="text-muted-foreground">
                    <strong className="text-foreground">{item.title}:</strong> {item.description}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* Work Experience */}
          <section className="mb-12">
            <h2 className="font-serif text-2xl font-bold mb-6 text-accent">{r.workExperience.title}</h2>
            <div className="space-y-8">
              {r.workExperience.jobs.map((job, index) => (
                <div key={index} className="border-l-2 border-accent/30 pl-6 relative">
                  <div className="absolute w-3 h-3 bg-accent rounded-full -left-[7px] top-1" />
                  <div className="mb-2">
                    <h3 className="font-serif text-xl font-bold">{job.company}</h3>
                    <p className="text-sm text-muted-foreground">{job.location}</p>
                    <p className="text-sm text-accent font-medium">{job.period}</p>
                  </div>
                  <p className="text-sm text-muted-foreground italic mb-3">{job.description}</p>
                  <p className="font-medium mb-2">{job.role}</p>
                  <ul className="space-y-1">
                    {job.responsibilities.map((resp, respIndex) => (
                      <li key={respIndex} className="flex gap-2 text-sm text-muted-foreground">
                        <span className="text-accent">•</span>
                        <span>{resp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* Education */}
          <section className="mb-12">
            <h2 className="font-serif text-2xl font-bold mb-6 text-accent">{r.education.title}</h2>
            <div className="space-y-6">
              {r.education.degrees.map((degree, index) => (
                <div key={index} className="border-l-2 border-accent/30 pl-6 relative">
                  <div className="absolute w-3 h-3 bg-accent rounded-full -left-[7px] top-1" />
                  <h3 className="font-serif text-lg font-bold">{degree.title}</h3>
                  <p className="text-muted-foreground">{degree.institution}</p>
                  <p className="text-sm text-accent">{degree.year}</p>
                  {"note" in degree && degree.note && <p className="text-sm text-muted-foreground italic mt-1">{degree.note}</p>}
                </div>
              ))}
            </div>
          </section>

          {/* Certifications */}
          <section className="mb-12">
            <h2 className="font-serif text-2xl font-bold mb-4 text-accent">{r.certifications.title}</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {r.certifications.items.map((cert, index) => (
                <div key={index} className="p-4 rounded-lg bg-card border border-border">
                  <p className="font-medium">{cert.name}</p>
                  <p className="text-sm text-muted-foreground">{cert.issuer}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Immigration Status */}
          <section className="text-center text-sm text-muted-foreground">
            <p>{r.immigrationStatus}</p>
          </section>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}