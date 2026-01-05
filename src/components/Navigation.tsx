import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Logo } from "@/components/Logo";
import { useLanguage } from "@/i18n/LanguageContext";
import { ExternalLink } from "lucide-react";

export const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useLanguage();

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 border-b border-border transition-colors duration-300 ${isOpen ? "bg-background" : "bg-background/80 backdrop-blur-md"}`}>
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <Logo className="w-8 h-8" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            <ThemeToggle />
            <LanguageSwitcher />
            
            <div className="w-px h-4 bg-border" />
            
            <Button
              variant="secondary"
              size="sm"
              asChild
            >
              <a href="https://dens.so" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                {t.nav.visitDens}
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </Button>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2 relative w-10 h-10 flex items-center justify-center"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            <span
              className={`absolute h-0.5 w-6 bg-foreground transition-all duration-300 ${
                isOpen ? "rotate-45" : "-translate-y-2"
              }`}
            />
            <span
              className={`absolute h-0.5 w-6 bg-foreground transition-all duration-300 ${
                isOpen ? "opacity-0" : "opacity-100"
              }`}
            />
            <span
              className={`absolute h-0.5 w-6 bg-foreground transition-all duration-300 ${
                isOpen ? "-rotate-45" : "translate-y-2"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div
        className={`md:hidden fixed inset-0 top-[65px] bg-background z-40 transition-all duration-300 ${
          isOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
      >
        <div className="container mx-auto px-6 py-8 flex flex-col h-full">
          <div className="flex-1" />
          <div className="flex items-center gap-4 pb-8">
            <ThemeToggle />
            <LanguageSwitcher />
            <div className="w-px h-4 bg-border" />
            <Button
              variant="secondary"
              size="lg"
              className="flex-1"
              asChild
            >
              <a href="https://dens.so" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2">
                {t.nav.visitDens}
                <ExternalLink className="w-4 h-4" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};
