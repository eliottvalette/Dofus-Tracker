"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sidebar as SidebarPrimitive } from "@/components/ui/sidebar"
import { 
  Package, 
  ShoppingCart, 
  BarChart3, 
  Settings,
  Home
} from "lucide-react"

interface SidebarProps extends React.ComponentProps<typeof SidebarPrimitive> {}

export function Sidebar({ className, children, ...props }: SidebarProps) {
  return (
    <SidebarPrimitive
      className={cn("pb-12", className)}
      {...props}
    >
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Dofus Tracker
          </h2>
          <div className="space-y-1">
            <SidebarItem href="/" icon={Home} label="Accueil" />
            <SidebarItem href="/ventes" icon={Package} label="Mes Ventes" />
            <SidebarItem href="/historique" icon={ShoppingCart} label="Historique" />
            <SidebarItem href="/statistiques" icon={BarChart3} label="Statistiques" />
            <SidebarItem href="/parametres" icon={Settings} label="Paramètres" />
          </div>
        </div>
      </div>
    </SidebarPrimitive>
  )
}

interface SidebarItemProps {
  href: string
  icon: React.ComponentType<{ className?: string }>
  label: string
}

function SidebarItem({ href, icon: Icon, label }: SidebarItemProps) {
  const pathname = usePathname()
  const isActive = pathname === href

  return (
    <Button
      asChild
      variant={isActive ? "secondary" : "ghost"}
      className="w-full justify-start"
    >
      <Link href={href}>
        <Icon className="mr-2 h-4 w-4" />
        {label}
      </Link>
    </Button>
  )
} 