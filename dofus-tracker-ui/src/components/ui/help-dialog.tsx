"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Heart } from "lucide-react"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

interface HelpDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  page?: "items" | "sales"
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
          "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-4xl max-h-[90vh] overflow-y-auto",
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

// Composant de démonstration interactive pour Items
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
      <CardContent className="px-3 py-1">
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

// Composant de démonstration interactive pour Sales
function DemoSalesCard() {
  const [status, setStatus] = React.useState<"pending" | "local_sold" | "sold">("pending")
  const [showNotification, setShowNotification] = React.useState(false)
  const [notificationPosition, setNotificationPosition] = React.useState({ x: 0, y: 0 })

  React.useEffect(() => {
    const interval = setInterval(() => {
      if (status === "pending") {
        setStatus("local_sold")
        setShowNotification(true)
        // Position au centre de la carte (environ 150px de large)
        setNotificationPosition({ x: 75, y: 25 })
        setTimeout(() => setShowNotification(false), 1000)
      } else if (status === "local_sold") {
        setStatus("sold")
      } else {
        setStatus("pending")
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [status])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-500"
      case "sold": return "bg-green-500"
      case "local_sold": return "bg-primary"
      default: return "bg-muted"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending": return "En Vente"
      case "sold": return "Vendu"
      case "local_sold": return "Vendu (à valider)"
      default: return "Inconnu"
    }
  }

  return (
    <div className="relative">
      <Card className="hover:shadow-lg transition-all cursor-pointer relative group max-w-xs mx-auto w-50">
        <CardContent className="px-3 py-1">
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
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-medium truncate">Blé</p>
                <Badge variant="outline" className="text-xs">x10</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(status)}>
                  {getStatusText(status)}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Composant de démonstration pour la mise en vente
function DemoMiseEnVente() {
  const [selectedLotSize, setSelectedLotSize] = React.useState(10)
  const [showNotification, setShowNotification] = React.useState(false)

  React.useEffect(() => {
    const interval = setInterval(() => {
      setShowNotification(true)
      setTimeout(() => setShowNotification(false), 600)
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-4">
      {/* Sélecteur de taille de lot */}
      <div className="flex gap-2 justify-center">
        {[1, 10, 100, 1000].map((size) => (
          <Button
            key={size}
            variant={selectedLotSize === size ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedLotSize(size)}
          >
            {size}
          </Button>
        ))}
      </div>

      {/* Carte d'item cliquable */}
      <div className="relative">
        <Card className="hover:shadow-lg transition-all cursor-pointer relative group max-w-xs mx-auto w-50">
          <CardContent className="px-3 py-1">
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
          <div className="absolute top-2 right-2">
            <Heart className="h-4 w-4 text-red-500 fill-current" />
          </div>
        </Card>
        
        {/* Notification flottante - positionnée au centre de la carte */}
        {showNotification && (
          <div
            className="floating-notification absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-26 pointer-events-none"
          >
            <div className="bg-primary text-primary-foreground px-2 py-1 rounded-md text-sm font-medium">
              +{selectedLotSize}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function HelpDialogComponent({ open, onOpenChange, page = "items" }: HelpDialogProps) {
  const isItemsPage = page === "items";
  
  return (
    <HelpDialog open={open} onOpenChange={onOpenChange}>
      <HelpDialogContent>
        <HelpDialogHeader>
          <HelpDialogTitle>
            {isItemsPage ? "Fonctionnement de la page Items" : "Fonctionnement de la page Mes Ventes"}
          </HelpDialogTitle>
        </HelpDialogHeader>

        <div className="space-y-6">
          {isItemsPage ? (
            <div className="text-sm space-y-4">
              <p>Utilisez la <strong>barre de recherche</strong> et les <strong>filtres par catégorie</strong> pour trouver rapidement vos items.</p>
              
              <p>Cliquez sur un item pour l&apos;ajouter à vos <strong>favoris</strong>. Une icône de cœur rouge apparaît alors. Cliquez à nouveau pour le retirer des favoris.</p>
              
              <div className="flex justify-center my-4">
                <DemoItemCard />
              </div>
              
              <p>Cette page vous aide à <strong>préparer vos ventes</strong>. Vos favoris seront disponibles dans &quot;Mes Ventes&quot;, évitant de chercher parmi les 5936 items existants.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-sm space-y-4">
                <p>Cette page vous permet de <strong>gérer vos ventes</strong> avec vos items favoris de la page Items.</p>
                
                <p>Dans l&apos;onglet <strong>Mise en vente</strong>, sélectionnez une taille de lot et cliquez sur un item pour l&apos;ajouter à vos ventes en cours. Une notification flottante apparaît pour confirmer l&apos;ajout.</p>
                
                <div className="flex justify-center my-4">
                  <DemoMiseEnVente />
                </div>
                
                <p>Le processus de vente suit ce cycle : <strong>En vente</strong> → <strong>Vendu (à valider)</strong> → <strong>Vendu</strong></p>
                
                <div className="flex justify-center my-4">
                  <DemoSalesCard />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-yellow-500">En Vente</Badge>
                    <span className="text-sm">→ Cliquez pour marquer comme vendu</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-primary">Vendu (à valider)</Badge>
                    <span className="text-sm">→ En attente de validation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-500">Vendu</Badge>
                    <span className="text-sm">→ Vente confirmée et archivée</span>
                  </div>
                </div>
                
                <p>Dans l&apos;onglet <strong>Ventes</strong>, vous pouvez marquer vos ventes comme vendues localement ou les annuler. Les ventes validées sont automatiquement déplacées vers l&apos;historique.</p>
                
                <p>Les <strong>statistiques</strong> en haut vous donnent un aperçu de vos ventes en attente et vendues.</p>
              </div>
            </div>
          )}
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