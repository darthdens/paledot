import { useEffect, useState } from "react";
import { useNavigate, Link, Outlet, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { LogOut, Folder, Page, Home, Menu } from "iconoir-react";
import { ThemeToggle } from "@/components/ThemeToggle";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin, isLoading, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    document.title = "Admin Dashboard | Dens";
  }, []);

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) {
      navigate("/admin");
    }
  }, [user, isAdmin, isLoading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/admin");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  const isActive = (path: string) => location.pathname === path;

  const NavLinks = ({ onNavigate }: { onNavigate?: () => void }) => (
    <>
      <Link to="/admin/dashboard/projects" onClick={onNavigate}>
        <Button
          variant={isActive("/admin/dashboard/projects") ? "secondary" : "ghost"}
          className="w-full justify-start"
        >
          <Folder className="w-4 h-4 mr-2" />
          Projects
        </Button>
      </Link>
      <Link to="/admin/dashboard/articles" onClick={onNavigate}>
        <Button
          variant={isActive("/admin/dashboard/articles") ? "secondary" : "ghost"}
          className="w-full justify-start"
        >
          <Page className="w-4 h-4 mr-2" />
          Articles
        </Button>
      </Link>
    </>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile menu trigger */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <div className="p-4 border-b border-border">
                  <h2 className="font-serif text-lg font-bold">Menu</h2>
                </div>
                <nav className="p-4 space-y-2">
                  <NavLinks onNavigate={() => setIsMobileMenuOpen(false)} />
                </nav>
              </SheetContent>
            </Sheet>
            <h1 className="font-serif text-lg md:text-xl font-bold">Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <ThemeToggle />
            <Link to="/">
              <Button variant="ghost" size="sm" className="hidden sm:flex">
                <Home className="w-4 h-4 mr-2" />
                View Site
              </Button>
              <Button variant="ghost" size="icon" className="sm:hidden">
                <Home className="w-4 h-4" />
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="hidden sm:flex">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
            <Button variant="ghost" size="icon" onClick={handleSignOut} className="sm:hidden">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar - Desktop only */}
        <aside className="hidden md:block w-64 border-r border-border min-h-[calc(100vh-73px)] bg-card/50">
          <nav className="p-4 space-y-2">
            <NavLinks />
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
