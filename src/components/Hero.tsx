import { MapPin, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Hero = () => {
  const scrollToProjects = () => {
    const element = document.querySelector("#projects");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="min-h-screen flex items-center justify-center pt-20 pb-16">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <div className="space-y-8 order-2 lg:order-1">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted text-muted-foreground text-sm">
                <MapPin className="h-3.5 w-3.5" />
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
                <ArrowDown className="ml-2 h-4 w-4 group-hover:translate-y-1 transition-transform" />
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
                <div className="text-3xl font-bold font-serif">2nd</div>
                <div className="text-sm text-muted-foreground">Hackathon Prize</div>
              </div>
            </div>
          </div>

          {/* Profile Image */}
          <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
            <div className="relative">
              <div className="w-72 h-72 md:w-96 md:h-96 rounded-3xl bg-muted overflow-hidden shadow-xl">
                <img
                  src="https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/6364ed24-d073-426f-9f7a-5f679c6b957f/dens-new-pfp/w=512,quality=90,fit=scale-down"
                  alt="Dens Akoka"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-4 -left-4 bg-card rounded-2xl p-4 shadow-lg border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm font-medium">Available for work</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
