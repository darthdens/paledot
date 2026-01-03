import { Navigation } from "@/components/Navigation";
import { Hero } from "@/components/Hero";
import { Projects } from "@/components/Projects";
import { Services } from "@/components/Services";
import { About } from "@/components/About";
import { Articles } from "@/components/Articles";
import { Contact } from "@/components/Contact";
import { Footer } from "@/components/Footer";
import { Starfield } from "@/components/Starfield";
import { ChatWidget } from "@/components/ChatWidget";

const Index = () => {
  return (
    <div className="min-h-screen bg-background relative">
      <Starfield />
      <Navigation />
      <main>
        <Hero />
        <Projects />
        <Services />
        <About />
        <Articles />
        <Contact />
      </main>
      <Footer />
      <ChatWidget />
    </div>
  );
};

export default Index;
