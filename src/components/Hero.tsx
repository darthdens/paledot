import { Button } from "@/components/ui/button";
import { MapPin, NavArrowDown } from "iconoir-react";

export const Hero = () => {
  const scrollToProjects = () => {
    const element = document.querySelector("#projects");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="min-h-screen flex items-center justify-center pt-24 md:pt-20 pb-16">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-10 md:gap-8 lg:gap-12 items-center">
          {/* Text Content */}
          <div className="space-y-5 md:space-y-6 lg:space-y-8 order-2 lg:order-1">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/70 backdrop-blur-md text-muted-foreground text-sm relative z-10">
                <MapPin className="w-3.5 h-3.5" strokeWidth={2} />
                <span>Dundee, Scotland</span>
              </div>
              
              <h1 className="font-serif text-5xl md:text-7xl font-bold leading-tight">
                Hi, I'm{" "}
                <span className="text-accent">Dens</span>
              </h1>
              
              <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed">
                Passionate <em className="font-serif">thinker</em>, <em className="font-serif">do-er</em>, and <em className="font-serif">leader</em>
              </p>
            </div>

            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
              <span>Co-Founder at</span>
              <a 
                href="https://echoai.so" 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-medium text-foreground hover:text-accent transition-colors underline underline-offset-2"
              >
                Echo AI
              </a>
              <span>·</span>
              <span>Senior Social Media Manager at</span>
              <a 
                href="https://lunapr.io" 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-medium text-foreground hover:text-accent transition-colors underline underline-offset-2"
              >
                Luna PR
              </a>
            </div>

            <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
              I create brands, websites, apps, social profiles, and lead teams of marketers and engineers. Welcome to my personal space where I showcase my work and tell you more about myself.
            </p>

            <div className="flex flex-wrap gap-4">
              <Button
                variant="secondary"
                size="lg"
                onClick={scrollToProjects}
                className="group"
              >
                View My Work
                <NavArrowDown className="ml-2 w-4 h-4 group-hover:translate-y-1 transition-transform" strokeWidth={2} />
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => document.querySelector("#contact")?.scrollIntoView({ behavior: "smooth" })}
              >
                Let's Talk
              </Button>
            </div>

            <div className="flex items-center gap-6 pt-4">
              <div className="text-center">
                <div className="text-3xl font-bold font-serif">7+</div>
                <div className="text-sm text-muted-foreground">Years Experience</div>
              </div>
              <div className="w-px h-12 bg-border" />
              <div className="text-center">
                <div className="text-3xl font-bold font-serif">50+</div>
                <div className="text-sm text-muted-foreground">Projects Completed</div>
              </div>
              <div className="w-px h-12 bg-border" />
              <div className="text-center">
                <div className="text-3xl font-bold font-serif">🏆</div>
                <div className="text-sm text-muted-foreground">Hackathon Winner</div>
              </div>
            </div>
          </div>

          {/* Profile Image */}
          <div className="order-1 lg:order-2 flex justify-start lg:justify-end mb-4 md:mb-2 lg:mb-0">
            <div className="relative">
              <div className="w-40 h-40 md:w-56 md:h-56 lg:w-96 lg:h-96 rounded-3xl bg-muted/70 backdrop-blur-md overflow-hidden shadow-xl relative z-10">
                <img
                  src="https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/6364ed24-d073-426f-9f7a-5f679c6b957f/dens-new-pfp/w=512,quality=90,fit=scale-down"
                  alt="Dens Akoka"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-4 -right-4 md:-right-4 lg:-left-4 lg:right-auto bg-card/70 backdrop-blur-md rounded-2xl p-3 lg:p-4 shadow-lg border border-border z-20">
                <div className="flex items-center gap-2 lg:gap-3">
                  <div className="w-2.5 h-2.5 lg:w-3 lg:h-3 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs lg:text-sm font-medium">Available for work</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
