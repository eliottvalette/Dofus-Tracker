"use client"

import { useState } from "react"
import { Sidebar } from "./sidebar"
import { Navbar } from "./navbar"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu } from "lucide-react"

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen">
      {/* Sidebar pour desktop */}
      <div className="hidden md:block">
        <Sidebar className="w-64" />
      </div>

      {/* Sidebar mobile */}
      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetTrigger asChild className="md:hidden">
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-4 w-4" />
            <span className="sr-only">Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <Sidebar />
        </SheetContent>
      </Sheet>

      {/* Contenu principal */}
      <div className="flex-1 flex flex-col">
        <Navbar />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
} 