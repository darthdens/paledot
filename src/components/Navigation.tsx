import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Logo } from "@/components/Logo";
import { useLanguage } from "@/i18n/LanguageContext";
import { ExternalLink } from "lucide-react";

export const Navigation = () => {
  const { t } = useLanguage();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <Logo className="w-8 h-8" />
          </Link>

          {/* Navigation - same on all screen sizes */}
          <div className="flex items-center gap-2 sm:gap-4">
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
        </div>
      </div>
    </nav>
  );
};
