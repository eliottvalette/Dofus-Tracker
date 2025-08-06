"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut, onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Package, ShoppingCart, Home as HomeIcon, Settings, BarChart3, Users, LogOut, User as UserIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [activePage, setActivePage] = useState("items");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        router.push('/login');
      }
    });
    return unsubscribe;
  }, [router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.replace("/login");
  };

  const userName = user ? (user.displayName || (user.email ? user.email.split("@")[0] : "")) : "Guest";

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
    }
  ];

  const handleNavigation = (pageId: string, href: string) => {
    setActivePage(pageId);
    router.push(href);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 border-r bg-sidebar m-6 rounded-2xl sticky top-6 h-[96vh]">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex flex-row items-center p-4 border-b">
              <h1 className="text-xl font-bold">Dofus Tracker</h1>
              <img src="logo_text.webp" alt="Dofus Tracker" className="w-13 h-13" />
            </div>
            
            {/* Navigation */}
            <div className="flex-1 p-4 mt-4">
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
            </div>
            
            {/* User Menu */}
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
                  ) : (
                    <DropdownMenuItem onSelect={() => router.push('/login')}>
                      Connexion
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 mt-4">
          {children}
        </main>
      </div>
    </div>
  );
} 