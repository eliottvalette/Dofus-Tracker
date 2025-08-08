"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, TrendingUp, ShoppingCart, CheckCircle, XCircle, Check, Heart, HelpCircle } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { collection, addDoc, getDocs, doc, deleteDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/firebase-provider";
import { HelpDialogComponent } from "@/components/ui/help-dialog";
import { GuestAuthDialog } from "@/components/ui/guest-auth-dialog";
import { GUEST_PENDING_SALES, GUEST_SOLD_SALES, GUEST_FAVORITES } from "@/lib/guest-data";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

interface SaleItem {
  id: string;
  itemName: string;
  itemImage?: string;
  category: string;
  type: string;
  quantity: number;
  price: number;
  date: string;
  createdAt: Timestamp; // Firebase timestamp
  status: "pending" | "sold" | "local_sold";
  soldDate?: string;
  soldAt?: Timestamp; // Firebase timestamp
}

interface Item {
  category: string;
  nom: string;
  type: string;
  niveau: string;
  web_image_url: string;
  image_url: string;
}

export default function SalesPage() {
  const { user, isGuest } = useAuth();
  const [sales, setSales] = useState<SaleItem[]>([]);
  const [allItems, setAllItems] = useState<Item[]>([]);
  const [favoriteItems, setFavoriteItems] = useState<Set<string>>(new Set());
  const [selectedLotSize, setSelectedLotSize] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [localSoldItems, setLocalSoldItems] = useState<SaleItem[]>([]);
  const [validatingSales, setValidatingSales] = useState(false);

  const [floatingNotifications, setFloatingNotifications] = useState<Array<{
    id: string;
    x: number;
    y: number;
    text: string;
  }>>([]);
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  const [guestDialogOpen, setGuestDialogOpen] = useState(false);

  const lotSizes = [1, 10, 100, 1000];

  const loadSales = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      if (isGuest) {
        // Pour les invités, charger les données prédéfinies
        const allSales = [...GUEST_PENDING_SALES, ...GUEST_SOLD_SALES].map(sale => ({
          ...sale,
          createdAt: Timestamp.fromDate(sale.createdAt),
          soldAt: sale.soldAt ? Timestamp.fromDate(sale.soldAt) : undefined
        }));
        allSales.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setSales(allSales);
      } else {
        // Charger les ventes en cours (selling)
        const sellingRef = collection(db, "users", user.uid, "selling");
        const sellingSnapshot = await getDocs(sellingRef);
        const sellingData: SaleItem[] = [];
        sellingSnapshot.forEach((doc) => {
          sellingData.push({ id: doc.id, ...doc.data() } as SaleItem);
        });

        // Charger les ventes complétées (sold)
        const soldRef = collection(db, "users", user.uid, "sold");
        const soldSnapshot = await getDocs(soldRef);
        const soldData: SaleItem[] = [];
        soldSnapshot.forEach((doc) => {
          soldData.push({ id: doc.id, ...doc.data() } as SaleItem);
        });

        // Combiner et trier toutes les ventes
        const allSales = [...sellingData, ...soldData];
        allSales.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setSales(allSales);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des ventes:", error);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // Retrait de isGuest pour éviter les re-renders inutiles

  const loadFavorites = useCallback(async () => {
    if (!user) return;

    if (isGuest) {
      // Pour les invités, charger les favoris prédéfinis
      const guestFavoritesSet = new Set<string>();
      GUEST_FAVORITES.forEach(fav => {
        guestFavoritesSet.add(fav.itemName);
      });
      setFavoriteItems(guestFavoritesSet);
      return;
    }

    try {
      const favoritesRef = collection(db, "users", user.uid, "favorites");
      const favoritesSnapshot = await getDocs(favoritesRef);
      const favoritesSet = new Set<string>();
      
      favoritesSnapshot.forEach((doc) => {
        const data = doc.data();
        favoritesSet.add(data.itemName);
      });
      
      setFavoriteItems(favoritesSet);
    } catch (error) {
      console.error("Erreur lors du chargement des favoris:", error);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // Retrait de isGuest pour éviter les re-renders inutiles

  const loadAllItems = useCallback(async () => {
    setItemsLoading(true);
    try {
      const response = await fetch('/data/merged_with_local_images.csv');
      const csvText = await response.text();
      const lines = csvText.split('\n').slice(1);
      
      const parsedItems: Item[] = lines
        .filter(line => line.trim())
        .map(line => {
          const [category, nom, type, niveau, web_image_url, image_url] = line.split(',').map(field => 
            field.replace(/^"|"$/g, '')
          );
          return { category, nom, type, niveau, web_image_url, image_url};
        });
      
      // Filtrer pour ne garder que les favoris
      const favoriteItemsList = parsedItems.filter(item => favoriteItems.has(item.nom));
      
      // Trier par nom
      const sortedItems = favoriteItemsList.sort((a, b) => a.nom.localeCompare(b.nom));
      
      setAllItems(sortedItems);
    } catch (error) {
      console.error('Erreur lors du chargement des items:', error);
    } finally {
      setItemsLoading(false);
    }
  }, [favoriteItems]);

  // Recharger les items quand les favoris changent
  useEffect(() => {
    if (favoriteItems.size > 0) {
      loadAllItems();
    } else {
      setAllItems([]); // Vider la liste si pas de favoris
    }
  }, [favoriteItems, loadAllItems]);

  const addToSales = async (item: Item, event: React.MouseEvent) => {
    if (!user) return;

    // Si l'utilisateur est invité, afficher le dialog d'authentification
    if (isGuest) {
      setGuestDialogOpen(true);
      return;
    }

    // Créer une notification flottante
    const notificationId = Date.now().toString();
    const newNotification = {
      id: notificationId,
      x: event.clientX,
      y: event.clientY,
      text: `+${selectedLotSize}`,
    };
    
    setFloatingNotifications(prev => [...prev, newNotification]);
    
    // Supprimer la notification après l'animation
    setTimeout(() => {
      setFloatingNotifications(prev => prev.filter(n => n.id !== notificationId));
    }, 1000);

    try {
      const newSale: Omit<SaleItem, 'id'> = {
        itemName: item.nom,
        itemImage: item.image_url,
        category: item.category,
        type: item.type,
        quantity: selectedLotSize,
        price: 0, // Prix à définir par l'utilisateur
        date: new Date().toISOString(),
        createdAt: Timestamp.now(),
        status: "pending",
      };

      await addDoc(collection(db, "users", user.uid, "selling"), newSale);
      
      await loadSales(); // Recharger les ventes
    } catch (error) {
      console.error("Erreur lors de l'ajout de la vente:", error);
    }
  };

  const toggleLocalSold = (saleId: string) => {
    // Si l'utilisateur est invité, afficher le dialog d'authentification
    if (isGuest) {
      setGuestDialogOpen(true);
      return;
    }

    const sale = sales.find(s => s.id === saleId);
    if (!sale) return;

    if (sale.status === "pending") {
      // Marquer comme vendu localement
      const updatedSale = { ...sale, status: "local_sold" as const };
      setSales(prev => prev.map(s => s.id === saleId ? updatedSale : s));
      setLocalSoldItems(prev => [updatedSale, ...prev]);
    } else if (sale.status === "local_sold") {
      // Remettre en vente
      const updatedSale = { ...sale, status: "pending" as const };
      setSales(prev => prev.map(s => s.id === saleId ? updatedSale : s));
      setLocalSoldItems(prev => prev.filter(s => s.id !== saleId));
    }
  };

  const validateAllSales = async () => {
    if (!user || localSoldItems.length === 0) return;

    // Si l'utilisateur est invité, afficher le dialog d'authentification
    if (isGuest) {
      setGuestDialogOpen(true);
      return;
    }

    setValidatingSales(true);
    try {
      // Ajouter toutes les ventes locales à Firebase
      for (const sale of localSoldItems) {
        const saleData = {
          ...sale,
          status: "sold" as const,
          soldDate: new Date().toISOString(),
          soldAt: serverTimestamp(),
        };
        
        await addDoc(collection(db, "users", user.uid, "sold"), saleData);
        
        // Supprimer de la collection selling
        await deleteDoc(doc(db, "users", user.uid, "selling", sale.id));
      }

      // Vider la liste locale
      setLocalSoldItems([]);
      
      // Recharger les ventes
      await loadSales();
      
      // Notification de succès
      const notificationId = Date.now().toString();
      setFloatingNotifications(prev => [...prev, {
        id: notificationId,
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        text: `${localSoldItems.length} ventes validées !`,
      }]);
      setTimeout(() => {
        setFloatingNotifications(prev => prev.filter(n => n.id !== notificationId));
      }, 2000);
    } catch (error) {
      console.error("Erreur lors de la validation des ventes:", error);
    } finally {
      setValidatingSales(false);
    }
  };

  const cancelSale = async (saleId: string) => {
    // Si l'utilisateur est invité, afficher le dialog d'authentification
    if (isGuest) {
      setGuestDialogOpen(true);
      return;
    }

    try {
      const saleRef = doc(db, "users", user!.uid, "selling", saleId);
      await deleteDoc(saleRef);
      await loadSales(); // Recharger les ventes
    } catch (error) {
      console.error("Erreur lors de l'annulation:", error);
    }
  };

  const pendingSales = sales.filter(sale => sale.status === "pending").length;
  const soldItems = sales.filter(sale => sale.status === "sold").length;
  const localSoldCount = localSoldItems.length;

  const getStatusColor = (status: SaleItem["status"]) => {
    switch (status) {
      case "pending": return "bg-yellow-500";
      case "sold": return "bg-green-500";
      case "local_sold": return "bg-primary";
      default: return "bg-muted";
    }
  };

  const getStatusText = (status: SaleItem["status"]) => {
    switch (status) {
      case "pending": return "En Vente";
      case "sold": return "Vendu";
      case "local_sold": return "Vendu (à valider)";
      default: return "Inconnu";
    }
  };

  useEffect(() => {
    if (user) {
      loadSales();
      loadAllItems();
      loadFavorites();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // Retrait des fonctions des dépendances pour éviter la boucle infinie

  // Plus besoin de vérifier si user existe car l'auth anonyme est maintenant activée

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mes Ventes</h1>
          <p className="text-muted-foreground">
            Gérez vos ventes et suivez vos revenus
          </p>
        </div>
        <button
          onClick={() => setHelpDialogOpen(true)}
          className="h-16 w-16 p-0 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
          title="Aide"
        >
          <HelpCircle className="h-8 w-8 bg-primary text-primary-foreground rounded-full" />
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventes en attente</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingSales}</div>
            <p className="text-xs text-muted-foreground">
              Items mis en vente
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Items vendus</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{soldItems}</div>
            <p className="text-xs text-muted-foreground">
              Total des ventes complétées
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="mise-en-vente" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="mise-en-vente">Mise en vente</TabsTrigger>
          <TabsTrigger value="ventes">Ventes</TabsTrigger>
        </TabsList>

        {/* Mise en vente */}
        <TabsContent value="mise-en-vente" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                Mise en vente
              </CardTitle>
              <CardDescription>
                Sélectionnez une taille de lot et cliquez sur un item pour l&apos;ajouter à vos ventes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Lot size selector */}
              <div className="mb-6">
                <label className="text-sm font-medium mb-2 block">Taille du lot</label>
                <div className="flex gap-2">
                  {lotSizes.map((size) => (
                    <Button
                      key={size}
                      variant={selectedLotSize === size ? "default" : "outline"}
                      onClick={() => setSelectedLotSize(size)}
                    >
                      {size}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Items grid */}
              {itemsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground mt-2">Chargement des items...</p>
                </div>
              ) : allItems.length === 0 ? (
                <div className="text-center py-8">
                  <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Aucun favori trouvé</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Allez dans la page &quot;Items&quot; pour ajouter des favoris
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[500px]">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {allItems.slice(0, 200).map((item, index) => (
                      <Card 
                        key={index} 
                        className="hover:shadow-lg hover:bg-secondary transition-all cursor-pointer relative"
                        onClick={(e) => addToSales(item, e)}
                      >
                        <CardContent className="px-4 select-none">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center border border-popover-foreground">
                              {item.image_url ? (
                                <img 
                                  src={item.image_url} 
                                  alt={item.nom}
                                  className="w-10 h-10 object-contain"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              ) : (
                                <div className="w-10 h-10 bg-muted-foreground/20 rounded" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{item.nom}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="secondary" className="text-xs border border-popover">
                                  {item.type}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {item.niveau}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                        {/* Favorite Badge */}
                        {favoriteItems.has(item.nom) && (
                          <div className="absolute top-2 right-2">
                            <Heart className="h-4 w-4 text-red-500 fill-current" />
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ventes */}
        <TabsContent value="ventes" className="space-y-6">
          {/* Ventes en cours */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Ventes en cours ({pendingSales + localSoldCount})
                {localSoldCount > 0 && (
                  <Button 
                    onClick={validateAllSales}
                    disabled={validatingSales}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    size="sm"
                  >
                    {validatingSales ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                        Validation en cours...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Valider ({localSoldCount})
                      </>
                    )}
                  </Button>
                )}
              </CardTitle>
              <CardDescription>
                Cliquez sur une carte pour la marquer comme vendue
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground mt-2">Chargement...</p>
                </div>
              ) : (pendingSales + localSoldCount) === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Aucune vente en cours</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Allez dans &ldquo;Mise en vente&rdquo; pour ajouter des items
                  </p>
                </div>
              ) : (
                <div className="relative">
                  <ScrollArea>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {/* Ventes vendues localement (en haut) */}
                      {localSoldItems.map((sale) => (
                        <Card 
                          key={sale.id} 
                          className="hover:shadow-lg hover:bg-accent transition-all cursor-pointer border-primary/20"
                          onClick={() => toggleLocalSold(sale.id)}
                        >
                          <CardContent className="px-4 select-none">
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center border border-border">
                                {sale.itemImage ? (
                                  <img 
                                    src={sale.itemImage} 
                                    alt={sale.itemName}
                                    className="w-10 h-10 object-contain"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                    }}
                                  />
                                ) : (
                                  <div className="w-10 h-10 bg-muted-foreground/20 rounded" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="text-sm font-medium truncate">{sale.itemName}</p>
                                  <Badge variant="outline" className="text-xs">x{sale.quantity}</Badge>
                                </div>
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge className={getStatusColor(sale.status)}>
                                    {getStatusText(sale.status)}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      
                      {/* Ventes en cours */}
                      {sales.filter(sale => sale.status === "pending").map((sale) => (
                        <ContextMenu key={sale.id}>
                          <ContextMenuTrigger>
                            <Card 
                              className="hover:shadow-lg hover:bg-secondary transition-all cursor-pointer"
                              onClick={() => toggleLocalSold(sale.id)}
                            >
                              <CardContent className="px-4 select-none">
                                <div className="flex items-center space-x-3">
                                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center border border-border">
                                    {sale.itemImage ? (
                                      <img 
                                        src={sale.itemImage} 
                                        alt={sale.itemName}
                                        className="w-10 h-10 object-contain"
                                        onError={(e) => {
                                          e.currentTarget.style.display = 'none';
                                        }}
                                      />
                                    ) : (
                                      <div className="w-10 h-10 bg-muted-foreground/20 rounded" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <p className="text-sm font-medium truncate">{sale.itemName}</p>
                                      <Badge variant="outline" className="text-xs">x{sale.quantity}</Badge>
                                    </div>
                                    <div className="flex items-center gap-2 mb-2">
                                      <Badge className={getStatusColor(sale.status)}>
                                        {getStatusText(sale.status)}
                                      </Badge>
                                      <p className="text-xs text-muted-foreground">
                                        {new Date(sale.date).toLocaleDateString()}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </ContextMenuTrigger>
                          <ContextMenuContent>
                            <ContextMenuItem onClick={() => toggleLocalSold(sale.id)}>
                              Marquer comme vendu
                            </ContextMenuItem>
                            <ContextMenuSeparator />
                                                         <ContextMenuItem 
                               onClick={(e: React.MouseEvent) => {
                                 e.stopPropagation();
                                 cancelSale(sale.id);
                               }}
                               className="text-destructive focus:text-destructive"
                             >
                              <XCircle className="h-4 w-4 mr-2" />
                              Annuler la vente
                            </ContextMenuItem>
                          </ContextMenuContent>
                        </ContextMenu>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ventes vendues */}
          <Card>
            <CardHeader>
              <CardTitle>Ventes vendues ({soldItems})</CardTitle>
              <CardDescription>
                Historique de vos ventes complétées
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground mt-2">Chargement...</p>
                </div>
              ) : soldItems === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Aucune vente vendue</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Vendez des items pour voir votre historique
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[300px]">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {sales.filter(sale => sale.status === "sold").map((sale) => (
                      <Card 
                        key={sale.id} 
                        className="hover:shadow-lg hover:bg-secondary transition-all"
                      >
                        <CardContent className="px-4 select-none">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center border border-border">
                              {sale.itemImage ? (
                                <img 
                                  src={sale.itemImage} 
                                  alt={sale.itemName}
                                  className="w-10 h-10 object-contain"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              ) : (
                                <div className="w-10 h-10 bg-muted-foreground/20 rounded" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-sm font-medium truncate">{sale.itemName}</p>
                                <Badge variant="outline" className="text-xs">x{sale.quantity}</Badge>
                              </div>
                              <div className="flex items-center gap-2 mb-2">
                                <Badge className={getStatusColor(sale.status)}>
                                  {getStatusText(sale.status)}
                                </Badge>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(sale.date).toLocaleDateString()}
                                </p>
                              </div>
                              {sale.soldDate && (
                                <p className="text-xs text-muted-foreground">
                                  Vendue le {new Date(sale.soldDate).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
       </Tabs>
       
       {/* Notifications flottantes */}
       {floatingNotifications.map((notification) => (
         <div
           key={notification.id}
           className="floating-notification"
           style={{
             left: notification.x,
             top: notification.y,
           }}
         >
           <div className="bg-primary text-accent-foreground px-2 py-1 rounded-md text-lg font-medium">
             {notification.text}
           </div>
         </div>
       ))}

             {/* Help Dialog */}
      <HelpDialogComponent 
        open={helpDialogOpen} 
        onOpenChange={setHelpDialogOpen} 
        page="sales"
      />

      {/* Guest Auth Dialog */}
      <GuestAuthDialog
        open={guestDialogOpen}
        onOpenChange={setGuestDialogOpen}
        title="Ventes - Compte requis"
        description="La gestion des ventes nécessite un compte utilisateur. Créez un compte 100% gratuit pour sauvegarder vos ventes personnalisées ou continuez en mode invité avec les données prédéfinies en lecture seule."
      />
    </div>
  );
} 