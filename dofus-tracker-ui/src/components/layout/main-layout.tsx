"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut, onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Package, ShoppingCart, BarChart3, Users, LogOut, User as UserIcon, Menu, Play, HelpCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [activePage, setActivePage] = useState("items");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      // Ne plus rediriger vers login - Firebase auth anonyme gère maintenant les utilisateurs non connectés
    });
    return unsubscribe;
  }, [router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.replace("/login");
  };

  const userName = user 
    ? user.isAnonymous 
      ? "Invité" 
      : (user.displayName || (user.email ? user.email.split("@")[0] : "Utilisateur"))
    : "Invité";

  const navigationItems = [
    {
      id: "items",
      name: "Items",
      icon: Package,
      description: "Tableau de tous les items",
      href: "/items"
    },
    {
      id: "sales",
      name: "Mes Ventes",
      icon: ShoppingCart,
      description: "Page où l'utilisateur met à jour ses ventes",
      href: "/sales"
    },
    {
      id: "stats",
      name: "Statistiques",
      icon: BarChart3,
      description: "Statistiques détaillées sur les meilleurs vendeurs, revenus...",
      href: "/stats"
    },
    {
      id: "community",
      name: "Communauté",
      icon: Users,
      description: "Espace où les utilisateurs peuvent contribuer au site",
      href: "/community"
    },
    {
      id: "tutorials",
      name: "Tutoriels",
      icon: Play,
      description: "Vidéos tutoriels pour apprendre à utiliser l'application",
      href: "/tutorials"
    },
    {
      id: "faq",
      name: "FAQ",
      icon: HelpCircle,
      description: "Foire aux questions",
      href: "/faq"
    }
  ];

  const handleNavigation = (pageId: string, href: string) => {
    setActivePage(pageId);
    router.push(href);
    if (isMobile) {
      setIsMobileMenuOpen(false);
    }
  };

  const NavigationContent = () => (
    <nav className="space-y-4">
      {navigationItems.map((item) => {
        const Icon = item.icon;
        return (
          <Button
            key={item.id}
            variant={activePage === item.id ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => handleNavigation(item.id, item.href)}
          >
            <Icon className="h-4 w-4 mr-2" />
            {item.name}
          </Button>
        );
      })}
    </nav>
  );

  const UserMenu = () => (
    <div className="p-4 border-t">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="w-full">
            <UserIcon className="h-4 w-4 mr-2" />
            {userName}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {user ? (
            user.isAnonymous ? (
              <>
                <DropdownMenuItem disabled>
                  Mode invité actif
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => router.push('/login?mode=signup')}>
                  <UserIcon className="mr-2 h-4 w-4" />
                  Créer un compte
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => router.push('/login?mode=signin')}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Se connecter
                </DropdownMenuItem>
              </>
            ) : (
              <>
                <DropdownMenuItem disabled>
                  Connecté en tant que : {user.email}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={handleLogout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Déconnexion
                </DropdownMenuItem>
              </>
            )
          ) : (
            <DropdownMenuItem onSelect={() => router.push('/login')}>
              Connexion
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="min-h-screen bg-background">
        {/* Mobile Header/Navbar */}
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <img src="/dofus-logo.svg" alt="Dofus Tracker" className="h-8 w-8" />
              <h1 className="text-lg font-bold">Dofus Tracker</h1>
            </div>
            
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <SheetTitle className="sr-only">Menu de navigation</SheetTitle>
                <SheetDescription className="sr-only">
                  Menu de navigation principal avec accès aux différentes sections de l&apos;application
                </SheetDescription>
                <div className="flex flex-col h-full">
                  {/* Header in mobile menu */}
                  <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-lg font-semibold">Menu</h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                    </Button>
                  </div>
                  
                  {/* Navigation */}
                  <div className="flex-1 p-4">
                    <NavigationContent />
                  </div>
                  
                  {/* User Menu */}
                  <UserMenu />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </header>

        {/* Main Content */}
        <main className="container px-4 py-6">
          {children}
        </main>
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 border-r bg-sidebar ml-6 mt-6 mr-6 rounded-2xl sticky top-6 h-[96vh]">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex flex-row items-center p-4 border-b">
              <h1 className="text-xl font-bold">Dofus Tracker</h1>
              <img src="/dofus-logo.svg" alt="Dofus Tracker" className="w-8 h-8 ml-2" />
            </div>
            
            {/* Navigation */}
            <div className="flex-1 p-4 mt-4">
              <NavigationContent />
            </div>
            
            {/* User Menu */}
            <UserMenu />
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 mt-6 mb-2 mr-4">
          {children}
        </main>
      </div>
    </div>
  );
} 