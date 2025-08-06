import { Button } from "@/components/ui/button";
import { Package, ShoppingCart, Home as HomeIcon, Settings, BarChart3, Users } from "lucide-react";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-blur]:bg-background/60">
        <div className="flex h-16 items-center px-4">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold">Dofus Tracker</h1>
          </div>
          <div className="ml-auto flex items-center space-x-4">
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 border-r bg-background/95 backdrop-blur supports-[backdrop-blur]:bg-background/60">
          <div className="p-4">
            <nav className="space-y-2">
              <Button variant="ghost" className="w-full justify-start">
                <HomeIcon className="h-4 w-4 mr-2" /> {/* Most interesting stats on users best sellers, news, revenues... */}
                Dashboard
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <Package className="h-4 w-4 mr-2" /> {/* Table of all items */}
                Items
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <ShoppingCart className="h-4 w-4 mr-2" /> {/* Page where user updates his sales */}
                Mes Ventes
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <BarChart3 className="h-4 w-4 mr-2" /> {/* Deep Stats on users best sellers, revenues... */}
                Statistiques
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <Users className="h-4 w-4 mr-2" /> {/* Place where users can contribute to the website. */}
                Communauté
              </Button>
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
} 