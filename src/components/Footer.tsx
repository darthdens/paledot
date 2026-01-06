import { Heart } from "iconoir-react";
import { useLanguage } from "@/i18n/LanguageContext";

export const Footer = () => {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-8 border-t border-border">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
            <span>{t.footer.madeWith}</span>
            <Heart className="w-4 h-4 text-accent" strokeWidth={2} fill="currentColor" />
            <span>{t.footer.by}</span>
            <a 
              href="https://dens.so" 
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground hover:text-accent transition-colors"
            >
              Dens Akoka
            </a>
          </div>
          
          <div className="text-sm text-muted-foreground">
            © {currentYear} Dens Akoka. {t.footer.allRights}
          </div>
        </div>
      </div>
    </footer>
  );
};
