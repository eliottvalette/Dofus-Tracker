"use client";
import * as React from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { usePathname } from "next/navigation";
import { MainLayout } from "@/components/layout/main-layout";

interface SidebarWrapperProps {
  children: React.ReactNode;
}

export function SidebarWrapper({ children }: SidebarWrapperProps) {
  const [authChecked, setAuthChecked] = React.useState(false);
  const pathname = usePathname();

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, () => {
      setAuthChecked(true);
    });
    return unsubscribe;
  }, []);

  // While checking auth, render nothing or a loader if needed
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Don't show sidebar on login page
  if (pathname === '/login') {
    return <>{children}</>;
  }

  // Wrap children with MainLayout for authenticated pages
  return <MainLayout>{children}</MainLayout>;
} 