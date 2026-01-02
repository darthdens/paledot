import { IconSparkle } from "@/components/icons/CustomIcons";

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-8 border-t border-border">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="font-serif text-xl font-bold">Dens</div>
          
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <span>Made with</span>
            <IconSparkle className="w-4 h-4 text-accent" />
            <span>in Scotland</span>
          </div>
          
          <div className="text-sm text-muted-foreground">
            © {currentYear} Dens Akoka. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};
