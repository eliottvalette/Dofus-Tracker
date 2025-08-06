"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Package, DollarSign, TrendingUp, ShoppingCart, CheckCircle, XCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { collection, addDoc, getDocs, updateDoc, doc, deleteDoc, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/firebase-provider";

interface SaleItem {
  id: string;
  itemName: string;
  itemImage?: string;
  quantity: number;
  price: number;
  date: string;
  status: "pending" | "sold" | "cancelled";
  userId: string;
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
  const { user } = useAuth();
  const [sales, setSales] = useState<SaleItem[]>([]);
  const [allItems, setAllItems] = useState<Item[]>([]);
  const [selectedLotSize, setSelectedLotSize] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [itemsLoading, setItemsLoading] = useState(true);

  const [floatingNotifications, setFloatingNotifications] = useState<Array<{
    id: string;
    x: number;
    y: number;
    text: string;
  }>>([]);

  const lotSizes = [1, 10, 100];

  useEffect(() => {
    if (user) {
      loadSales();
      loadAllItems();
    }
  }, [user]);

  const loadSales = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const salesRef = collection(db, "sales");
      const q = query(
        salesRef,
        where("userId", "==", user.uid)
      );
      const querySnapshot = await getDocs(q);
      const salesData: SaleItem[] = [];
      querySnapshot.forEach((doc) => {
        salesData.push({ id: doc.id, ...doc.data() } as SaleItem);
      });
      // Trier côté client pour éviter le besoin d'index composite
      salesData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setSales(salesData);
    } catch (error) {
      console.error("Erreur lors du chargement des ventes:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadAllItems = async () => {
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
      
      setAllItems(parsedItems);
    } catch (error) {
      console.error('Erreur lors du chargement des items:', error);
    } finally {
      setItemsLoading(false);
    }
  };

  const addToSales = async (item: Item, event: React.MouseEvent, index: number) => {
    if (!user) return;

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
        quantity: selectedLotSize,
        price: 0, // Prix à définir par l'utilisateur
        date: new Date().toISOString(),
        status: "pending",
        userId: user.uid,
      };

      const docRef = await addDoc(collection(db, "sales"), newSale);
      

      
      await loadSales(); // Recharger les ventes
    } catch (error) {
      console.error("Erreur lors de l'ajout de la vente:", error);
    }
  };

  const markAsSold = async (saleId: string) => {
    try {
      const saleRef = doc(db, "sales", saleId);
      await updateDoc(saleRef, { status: "sold" });
      await loadSales(); // Recharger les ventes
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
    }
  };

  const cancelSale = async (saleId: string) => {
    try {
      const saleRef = doc(db, "sales", saleId);
      await updateDoc(saleRef, { status: "cancelled" });
      await loadSales(); // Recharger les ventes
    } catch (error) {
      console.error("Erreur lors de l'annulation:", error);
    }
  };

  const deleteSale = async (saleId: string) => {
    try {
      await deleteDoc(doc(db, "sales", saleId));
      await loadSales(); // Recharger les ventes
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
    }
  };

  const updateSalePrice = async (saleId: string, newPrice: number) => {
    try {
      const saleRef = doc(db, "sales", saleId);
      await updateDoc(saleRef, { price: newPrice });
      await loadSales(); // Recharger les ventes
    } catch (error) {
      console.error("Erreur lors de la mise à jour du prix:", error);
    }
  };

  const totalRevenue = sales
    .filter(sale => sale.status === "sold")
    .reduce((sum, sale) => sum + (sale.price * sale.quantity), 0);

  const pendingSales = sales.filter(sale => sale.status === "pending").length;
  const soldItems = sales.filter(sale => sale.status === "sold").length;

  const getStatusColor = (status: SaleItem["status"]) => {
    switch (status) {
      case "pending": return "bg-yellow-500";
      case "sold": return "bg-green-500";
      case "cancelled": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusText = (status: SaleItem["status"]) => {
    switch (status) {
      case "pending": return "En attente";
      case "sold": return "Vendu";
      case "cancelled": return "Annulé";
      default: return "Inconnu";
    }
  };

  if (!user) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <p className="text-muted-foreground">Veuillez vous connecter pour accéder aux ventes</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mes Ventes</h1>
          <p className="text-muted-foreground">
            Gérez vos ventes et suivez vos revenus
          </p>
        </div>
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
                Sélectionnez une taille de lot et cliquez sur un item pour l'ajouter à vos ventes
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
              ) : (
                <ScrollArea className="h-[500px]">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {allItems.slice(0, 200).map((item, index) => (
                      <Card 
                        key={index} 
                        className="hover:shadow-lg hover:bg-secondary transition-all cursor-pointer"
                        onClick={(e) => addToSales(item, e, index)}
                      >
                        <CardContent className="p-4 select-none">
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
          <Card>
            <CardHeader>
              <CardTitle>Mes ventes ({sales.length})</CardTitle>
              <CardDescription>
                Gérez vos ventes en cours et complétées
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground mt-2">Chargement...</p>
                </div>
              ) : sales.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Aucune vente enregistrée</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Allez dans "Mise en vente" pour ajouter des items
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[500px]">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {sales.map((sale) => (
                      <Card 
                        key={sale.id} 
                        className="hover:shadow-lg hover:bg-secondary transition-all cursor-pointer"
                        onClick={(e) => {
                          if (sale.status === "pending" && sale.price && sale.price > 0) {
                            markAsSold(sale.id);
                            // Créer une notification flottante "Vendu !"
                            const notificationId = Date.now().toString();
                            const newNotification = {
                              id: notificationId,
                              x: e.clientX,
                              y: e.clientY,
                              text: "Vendu !",
                            };
                            setFloatingNotifications(prev => [...prev, newNotification]);
                            setTimeout(() => {
                              setFloatingNotifications(prev => prev.filter(n => n.id !== notificationId));
                            }, 1000);
                          }
                        }}
                      >
                        <CardContent className="p-4 select-none">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center border border-popover-foreground">
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
                              {sale.status === "pending" && (
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="number"
                                    placeholder="Prix"
                                    value={sale.price || ""}
                                    onChange={(e) => {
                                      const newPrice = parseInt(e.target.value) || 0;
                                      updateSalePrice(sale.id, newPrice);
                                    }}
                                    className="w-16 h-7 text-xs"
                                  />
                                  <Button
                                    size="sm"
                                    className="h-7 px-2"
                                    onClick={(e) => {
                                      markAsSold(sale.id);
                                      // Créer une notification flottante "Vendu !"
                                      const notificationId = Date.now().toString();
                                      const newNotification = {
                                        id: notificationId,
                                        x: e.clientX,
                                        y: e.clientY,
                                        text: "Vendu !",
                                      };
                                      setFloatingNotifications(prev => [...prev, newNotification]);
                                      setTimeout(() => {
                                        setFloatingNotifications(prev => prev.filter(n => n.id !== notificationId));
                                      }, 1000);
                                    }}
                                    disabled={!sale.price || sale.price <= 0}
                                  >
                                    <CheckCircle className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 px-2"
                                    onClick={() => cancelSale(sale.id)}
                                  >
                                    <XCircle className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 px-2"
                                    onClick={() => deleteSale(sale.id)}
                                  >
                                    <span className="text-xs">×</span>
                                  </Button>
                                </div>
                              )}
                              {sale.status !== "pending" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 px-2"
                                  onClick={() => deleteSale(sale.id)}
                                >
                                  <span className="text-xs">×</span>
                                </Button>
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
     </div>
   );
 } 