"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BarChart3, TrendingUp, TrendingDown, Package, Users, Activity, Loader2, Clock, Target, Zap } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/firebase-provider";

interface SaleItem {
  id: string;
  itemName: string;
  itemImage?: string;
  quantity: number;
  price: number;
  date: string;
  createdAt: any; // Firebase timestamp
  status: "pending" | "sold" | "local_sold";
  soldDate?: string;
  soldAt?: any; // Firebase timestamp
}

interface StatsData {
  totalSales: number;
  totalItems: number;
  averageSaleTime: number;
  topCategories: Array<{
    name: string;
    sales: number;
    items: number;
  }>;
  topItems: Array<{
    name: string;
    sales: number;
    quantity: number;
  }>;
  recentActivity: Array<{
    type: "sale" | "purchase";
    item: string;
    quantity: number;
    time: string;
  }>;
  saleTimeDistribution: Array<{
    range: string;
    count: number;
  }>;
}

export default function StatsPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<StatsData>({
    totalSales: 0,
    totalItems: 0,
    averageSaleTime: 0,
    topCategories: [],
    topItems: [],
    recentActivity: [],
    saleTimeDistribution: []
  });
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Charger les ventes vendues (sold)
      const soldRef = collection(db, "users", user.uid, "sold");
      const soldSnapshot = await getDocs(soldRef);
      const soldData: SaleItem[] = [];
      soldSnapshot.forEach((doc) => {
        soldData.push({ id: doc.id, ...doc.data() } as SaleItem);
      });

      // Calculer les statistiques
      const totalSales = soldData.length;
      const totalItems = soldData.reduce((sum, sale) => sum + sale.quantity, 0);

      // Calculer le délai de vente moyen
      let totalSaleTime = 0;
      let validSales = 0;
      soldData.forEach(sale => {
        // Utiliser les timestamps Firebase si disponibles, sinon fallback sur les dates string
        let saleDate: Date;
        let listDate: Date;
        
        if (sale.soldAt && sale.createdAt) {
          // Utiliser les timestamps Firebase (plus précis)
          saleDate = sale.soldAt.toDate();
          listDate = sale.createdAt.toDate();
        } else if (sale.soldDate && sale.date) {
          // Fallback sur les dates string
          saleDate = new Date(sale.soldDate);
          listDate = new Date(sale.date);
        } else {
          return; // Ignorer si pas de dates valides
        }
        
        const timeDiff = saleDate.getTime() - listDate.getTime();
        if (timeDiff > 0) {
          totalSaleTime += timeDiff;
          validSales++;
        }
      });
      const averageSaleTime = validSales > 0 ? totalSaleTime / validSales / (1000 * 60 * 60) : 0; // en heures

      // Analyser les catégories (basé sur le nom de l'item)
      const categoryMap = new Map<string, { sales: number; items: number }>();
      soldData.forEach(sale => {
        // Déterminer la catégorie basée sur le nom de l'item
        let category = "Autres";
        const itemName = sale.itemName.toLowerCase();
        
        if (itemName.includes("épée") || itemName.includes("hache") || itemName.includes("arc") || itemName.includes("bâton")) {
          category = "Armes";
        } else if (itemName.includes("botte") || itemName.includes("casque") || itemName.includes("cape") || itemName.includes("anneau")) {
          category = "Équipements";
        } else if (itemName.includes("potion") || itemName.includes("pancarte") || itemName.includes("dofus")) {
          category = "Consommables";
        } else if (itemName.includes("fer") || itemName.includes("bois") || itemName.includes("pierre") || itemName.includes("cuir")) {
          category = "Ressources";
        }

        const current = categoryMap.get(category) || { sales: 0, items: 0 };
        categoryMap.set(category, {
          sales: current.sales + 1,
          items: current.items + sale.quantity
        });
      });

      const topCategories = Array.from(categoryMap.entries())
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 4);

      // Analyser les items les plus vendus
      const itemMap = new Map<string, { sales: number; quantity: number }>();
      soldData.forEach(sale => {
        const current = itemMap.get(sale.itemName) || { sales: 0, quantity: 0 };
        itemMap.set(sale.itemName, {
          sales: current.sales + 1,
          quantity: current.quantity + sale.quantity
        });
      });

      const topItems = Array.from(itemMap.entries())
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 4);

      // Activité récente (dernières 10 ventes)
      const recentActivity = soldData
        .sort((a, b) => {
          // Utiliser les timestamps Firebase pour le tri si disponibles
          let dateA: Date, dateB: Date;
          
          if (a.soldAt && b.soldAt) {
            dateA = a.soldAt.toDate();
            dateB = b.soldAt.toDate();
          } else {
            dateA = new Date(a.soldDate || a.date);
            dateB = new Date(b.soldDate || b.date);
          }
          
          return dateB.getTime() - dateA.getTime();
        })
        .slice(0, 10)
        .map(sale => {
          // Utiliser les timestamps Firebase si disponibles
          let saleDate: Date;
          if (sale.soldAt) {
            saleDate = sale.soldAt.toDate();
          } else {
            saleDate = new Date(sale.soldDate || sale.date);
          }
          
          const now = new Date();
          const diffHours = Math.floor((now.getTime() - saleDate.getTime()) / (1000 * 60 * 60));
          
          let timeString = "";
          if (diffHours < 1) timeString = "À l'instant";
          else if (diffHours < 24) timeString = `Il y a ${diffHours}h`;
          else {
            const diffDays = Math.floor(diffHours / 24);
            timeString = `Il y a ${diffDays}j`;
          }

          return {
            type: "sale" as const,
            item: sale.itemName,
            quantity: sale.quantity,
            time: timeString
          };
        });

      // Distribution des délais de vente
      const saleTimeDistribution = [
        { range: "< 1h", count: 0 },
        { range: "1-6h", count: 0 },
        { range: "6-24h", count: 0 },
        { range: "1-7j", count: 0 },
        { range: "> 7j", count: 0 }
      ];

      soldData.forEach(sale => {
        // Utiliser les timestamps Firebase si disponibles, sinon fallback sur les dates string
        let saleDate: Date, listDate: Date;
        
        if (sale.soldAt && sale.createdAt) {
          saleDate = sale.soldAt.toDate();
          listDate = sale.createdAt.toDate();
        } else if (sale.soldDate && sale.date) {
          saleDate = new Date(sale.soldDate);
          listDate = new Date(sale.date);
        } else {
          return; // Ignorer si pas de dates valides
        }
        
        const timeDiff = saleDate.getTime() - listDate.getTime();
        const hoursDiff = timeDiff / (1000 * 60 * 60);
        
        if (hoursDiff < 1) saleTimeDistribution[0].count++;
        else if (hoursDiff < 6) saleTimeDistribution[1].count++;
        else if (hoursDiff < 24) saleTimeDistribution[2].count++;
        else if (hoursDiff < 168) saleTimeDistribution[3].count++; // 7 jours
        else saleTimeDistribution[4].count++;
      });

      setStats({
        totalSales,
        totalItems,
        averageSaleTime,
        topCategories,
        topItems,
        recentActivity,
        saleTimeDistribution
      });
    } catch (error) {
      console.error("Erreur lors du chargement des statistiques:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user, loadStats]);

  if (!user) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <p className="text-muted-foreground">Veuillez vous connecter pour voir vos statistiques</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Statistiques</h1>
        <p className="text-muted-foreground">
          Analysez vos performances de vente et vos meilleurs vendeurs
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Chargement des statistiques...</span>
        </div>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ventes totales</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalSales}</div>
                <p className="text-xs text-muted-foreground">
                  Transactions complétées
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Items vendus</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalItems}</div>
                <p className="text-xs text-muted-foreground">
                  Nombre total d'items
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Délai moyen</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.averageSaleTime.toFixed(1)}h</div>
                <p className="text-xs text-muted-foreground">
                  Temps de vente moyen
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Activité</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.recentActivity.length}</div>
                <p className="text-xs text-muted-foreground">
                  Ventes récentes
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Top Categories */}
            <Card>
              <CardHeader>
                <CardTitle>Meilleures catégories</CardTitle>
                <CardDescription>
                  Nombre de ventes par catégorie d'items
                </CardDescription>
              </CardHeader>
              <CardContent>
                {stats.topCategories.length > 0 ? (
                  <div className="space-y-4">
                    {stats.topCategories.map((category, index) => (
                      <div key={category.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{category.name}</p>
                            <p className="text-sm text-muted-foreground">{category.sales} ventes</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{category.items} items</p>
                          <p className="text-sm text-muted-foreground">
                            {stats.totalItems > 0 ? ((category.items / stats.totalItems) * 100).toFixed(1) : "0"}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Aucune vente pour analyser les catégories</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Items */}
            <Card>
              <CardHeader>
                <CardTitle>Meilleurs vendeurs</CardTitle>
                <CardDescription>
                  Items les plus vendus en quantité
                </CardDescription>
              </CardHeader>
              <CardContent>
                {stats.topItems.length > 0 ? (
                  <div className="space-y-4">
                    {stats.topItems.map((item, index) => (
                      <div key={item.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-muted-foreground">{item.sales} ventes</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{item.quantity} items</p>
                          <p className="text-sm text-muted-foreground">
                            {stats.totalItems > 0 ? ((item.quantity / stats.totalItems) * 100).toFixed(1) : "0"}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Aucune vente pour analyser les items</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sale Time Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Distribution des délais de vente</CardTitle>
              <CardDescription>
                Répartition du temps de vente de vos items
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats.saleTimeDistribution.some(d => d.count > 0) ? (
                <div className="space-y-4">
                  {stats.saleTimeDistribution.map((distribution, index) => (
                    <div key={distribution.range} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{distribution.range}</p>
                          <p className="text-sm text-muted-foreground">{distribution.count} ventes</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{distribution.count}</p>
                        <p className="text-sm text-muted-foreground">
                          {stats.totalSales > 0 ? ((distribution.count / stats.totalSales) * 100).toFixed(1) : "0"}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Aucune donnée de délai de vente</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Activité récente</CardTitle>
              <CardDescription>
                Vos dernières transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats.recentActivity.length > 0 ? (
                <ScrollArea className="h-[300px]">
                  <div className="space-y-4">
                    {stats.recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-primary" />
                          <div>
                            <p className="font-medium">{activity.item}</p>
                            <p className="text-sm text-muted-foreground">
                              Vente • {activity.time}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{activity.quantity} items</p>
                          <Badge variant="default">
                            Vente
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Aucune activité récente</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Vendez des items pour voir votre activité
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Performance Chart Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle>Évolution des ventes</CardTitle>
              <CardDescription>
                Graphique des ventes sur les 30 derniers jours
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Graphique en cours de développement</p>
                  <p className="text-sm text-muted-foreground">
                    Intégration d'une bibliothèque de graphiques prévue
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
} 