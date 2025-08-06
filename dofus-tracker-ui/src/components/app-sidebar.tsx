"use client";
import * as React from "react"
import { useRouter } from "next/navigation";
import { signOut, onAuthStateChanged, type User } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarSeparator,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Home, ArrowUpRight, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { SearchForm } from "@/components/search-form";

export function AppSidebar({
  searchTerm,
  setSearchTerm,
  selectedCategories,
  setSelectedCategories,
  selectedItems,
  setSelectedItems,
  categories,
  items,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  selectedCategories: string[];
  setSelectedCategories: (v: string[]) => void;
  selectedItems: string[];
  setSelectedItems: (v: string[]) => void;
  categories: { id: string; name: string }[];
  items: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [user, setUser] = React.useState<User | null>(null);
  const [userId, setUserId] = React.useState<number | null>(null);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        const userRef = doc(db, "users", u.uid);
        getDoc(userRef)
          .then(snap => {
            if (snap.exists()) {
              const data = snap.data() as { userId: number };
              setUserId(data.userId);
            }
          })
          .catch(error => console.error("Failed to fetch userId:", error));
      } else {
        setUserId(null);
      }
    });
    return unsubscribe;
  }, []);
  const userName = user ? (user.displayName || (user.email ? user.email.split("@")[0] : "")) : "Guest";
  const handleLogout = async () => {
    await signOut(auth);
    router.replace("/login");
  };
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <div className="px-2 py-3 flex items-center justify-center">
          <span className="text-lg font-bold">Mémos EDN/ECOS</span>
        </div>
      </SidebarHeader>

      <Separator className="mb-[20px]" />

      <SidebarContent>
        <SidebarMenu className="px-4">
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg">
              <Link href="/" className="border border-dashed border-gray-600 rounded-xl flex items-center justify-center">
                <Home className="w-8 h-8"/>
                <span className="text-lg">Accueil</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <Separator className="mt-[10px] mb-[15px]" />

        <div className="px-2 py-1 flex items-center justify-center">
          <span className="text-lg font-bold">Filtres</span>
        </div>

        <SearchForm
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedCategories={selectedCategories}
          setSelectedCategories={setSelectedCategories}
          selectedItems={selectedItems}
          setSelectedItems={setSelectedItems}
          categories={categories}
          items={items}
        />
      </SidebarContent>

      <Separator className="mt-[10px]" />

      <SidebarFooter>
        <SidebarSeparator />
        <SidebarGroup>
          <SidebarGroupLabel>Recent</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="px-3 py-2 text-sm text-muted-foreground">
              Aucun item récent
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator />

        <div className="px-4 py-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center justify-between px-2 py-1 rounded-md hover:bg-muted">
                <span>{userName}</span>
                <ChevronDown className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {user ? (
                <>
                  <DropdownMenuItem disabled>
                    Votre ID Unique : {userId ?? 0}
                  </DropdownMenuItem>                  
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={handleLogout} className="text-destructive">
                    Déconnexion
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem onSelect={() => router.push('/login')}>
                  <ArrowUpRight className="mr-2" />
                  Connexion
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}