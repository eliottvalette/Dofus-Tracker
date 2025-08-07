"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Heart } from "lucide-react"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

interface HelpDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function HelpDialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="help-dialog" {...props} />
}

function HelpDialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return (
    <DialogPrimitive.Trigger data-slot="help-dialog-trigger" {...props} />
  )
}

function HelpDialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return (
    <DialogPrimitive.Portal data-slot="help-dialog-portal" {...props} />
  )
}

function HelpDialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="help-dialog-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
        className
      )}
      {...props}
    />
  )
}

function HelpDialogContent({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <HelpDialogPortal>
      <HelpDialogOverlay />
      <DialogPrimitive.Content
        data-slot="help-dialog-content"
        className={cn(
          "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-2xl max-h-[90vh] overflow-y-auto",
          className
        )}
        {...props}
      />
    </HelpDialogPortal>
  )
}

function HelpDialogHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="help-dialog-header"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

function HelpDialogFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="help-dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    />
  )
}

function HelpDialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="help-dialog-title"
      className={cn("text-lg font-semibold", className)}
      {...props}
    />
  )
}

function HelpDialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="help-dialog-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

function HelpDialogAction({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return (
    <DialogPrimitive.Close
      className={cn(buttonVariants(), className)}
      {...props}
    />
  )
}

function HelpDialogCancel({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return (
    <DialogPrimitive.Close
      className={cn(buttonVariants({ variant: "outline" }), className)}
      {...props}
    />
  )
}

// Composant de démonstration interactive
function DemoItemCard() {
  const [isFavorite, setIsFavorite] = React.useState(false)

  React.useEffect(() => {
    const interval = setInterval(() => {
      setIsFavorite(prev => !prev)
    }, 1500)

    return () => clearInterval(interval)
  }, [])

  return (
    <Card className="hover:shadow-lg transition-all cursor-pointer relative group max-w-xs mx-auto">
      <CardContent className="px-3 py-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
            <img 
              alt="Blé" 
              className="w-8 h-8 md:w-10 md:h-10 object-contain" 
              src="images/34009.w40h40.png"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">Blé</p>
            <div className="flex items-center gap-1 mt-1">
              <Badge variant="secondary" className="text-xs">
                Céréale
              </Badge>
              <Badge variant="outline" className="text-xs">
                Niv. 1
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
      {/* Favorite Badge qui change toutes les 1,5 secondes */}
      {isFavorite && (
        <div className="absolute top-2 right-2">
          <Heart className="h-4 w-4 text-red-500 fill-current" />
        </div>
      )}
    </Card>
  )
}

export function HelpDialogComponent({ open, onOpenChange }: HelpDialogProps) {
  return (
    <HelpDialog open={open} onOpenChange={onOpenChange}>
      <HelpDialogContent>
        <HelpDialogHeader>
          <HelpDialogTitle>Fonctionnement de la page Items</HelpDialogTitle>
        </HelpDialogHeader>

        <div className="space-y-4">
          <div className="text-sm space-y-3">
            <p>Utilisez la <strong>barre de recherche</strong> et les <strong>filtres par catégorie</strong> pour trouver rapidement vos items.</p>
            
            <p>Cliquez sur un item pour l&apos;ajouter à vos <strong>favoris</strong>. Une icône de cœur rouge apparaît alors. Cliquez à nouveau pour le retirer des favoris.</p>
            
            <div className="flex justify-center my-3">
              <DemoItemCard />
            </div>
            
            <p>Cette page vous aide à <strong>préparer vos ventes</strong>. Vos favoris seront disponibles dans &quot;Mes Ventes&quot;, évitant de chercher parmi les 6000 items existants.</p>
          </div>
        </div>

        <HelpDialogFooter>
          <HelpDialogCancel>Fermer</HelpDialogCancel>
        </HelpDialogFooter>
      </HelpDialogContent>
    </HelpDialog>
  )
}

export {
  HelpDialog,
  HelpDialogPortal,
  HelpDialogOverlay,
  HelpDialogTrigger,
  HelpDialogContent,
  HelpDialogHeader,
  HelpDialogFooter,
  HelpDialogTitle,
  HelpDialogDescription,
  HelpDialogAction,
  HelpDialogCancel,
} 