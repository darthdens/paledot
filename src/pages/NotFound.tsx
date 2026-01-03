import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Home } from "iconoir-react";

const NotFound = () => {
  const location = useLocation();
  const { t } = useLanguage();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center px-6">
        <h1 className="mb-2 text-8xl font-bold font-serif text-primary">404</h1>
        <h2 className="mb-4 text-2xl font-semibold">{t.notFound.title}</h2>
        <p className="mb-8 text-lg text-muted-foreground max-w-md mx-auto">{t.notFound.message}</p>
        <Link to="/">
          <Button size="lg">
            <Home className="w-4 h-4 mr-2" />
            {t.notFound.backHome}
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
