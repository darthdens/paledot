import { Heart } from "iconoir-react";

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-8 border-t border-border">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
            <span>Made with</span>
            <Heart className="w-4 h-4 text-accent" strokeWidth={2} fill="currentColor" />
            <span>by</span>
            <a 
              href="/" 
              className="font-medium text-foreground hover:text-accent transition-colors"
            >
              Dens Akoka
            </a>
          </div>
          
          <div className="text-sm text-muted-foreground">
            © {currentYear} Dens Akoka. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};
