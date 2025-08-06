"use client";
import * as React from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { usePathname } from "next/navigation";
import { useSidebarContext } from "@/components/sidebar-context";

interface SidebarWrapperProps {
  children: React.ReactNode;
}

export function SidebarWrapper({ children }: SidebarWrapperProps) {
  const [authChecked, setAuthChecked] = React.useState(false);
  const pathname = usePathname();
  const {
    searchTerm,
    setSearchTerm,
    selectedCategories,
    setSelectedCategories,
    selectedItems,
    setSelectedItems,
    categories,
    items
  } = useSidebarContext();

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, () => {
      setAuthChecked(true);
    });
    return unsubscribe;
  }, []);

  // While checking auth, render nothing or a loader if needed
  if (!authChecked) {
    return null;
  }

  // Don't show sidebar on login page
  if (pathname === '/login') {
    console.log("Login page");
    return <>{children}</>;
  } else {
    console.log("Not login page", pathname);
  }

  // Always wrap children with sidebar layout
  return (
    <SidebarProvider>
      <AppSidebar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedCategories={selectedCategories}
        setSelectedCategories={setSelectedCategories}
        selectedItems={selectedItems}
        setSelectedItems={setSelectedItems}
        categories={categories}
        items={items}
      />
      <SidebarInset>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
} 