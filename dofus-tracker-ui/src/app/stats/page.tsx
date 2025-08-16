"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Package, Activity, Loader2, Clock, Target, PieChart, Calendar, TrendingUp } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { collection, getDocs, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/firebase-provider";
import { GUEST_SOLD_SALES } from "@/lib/guest-data";
import { Button } from "@/components/ui/button";
import { 
  Tooltip, 
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Cell,
  Pie
} from 'recharts';

// Palettes de couleurs
const GRADIENT_COLORS = ["#d9ed92","#b5e48c","#99d98c","#76c893","#52b69a","#34a0a4","#168aad","#1a759f","#1e6091","#184e77"];
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

interface StatsData {
  totalSales: number;
  totalItems: number;
  averageSaleTime: number;
  topCategories: Array<{
    name: string;
    sales: number;
    items: number;
    color: string;
  }>;
  topItems: Array<{
    name: string;
    sales: number;
    quantity: number;
  }>;
  topTypesByCategory: Array<{
    category: string;
    types: Array<{
      name: string;
      sales: number;
      items: number;
    }>;
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
    color: string;
  }>;
  salesTrend: Array<{
    date: string;
    sales: number;
    items: number;
  }>;
  fastestSellers: Array<{
    name: string;
    averageSaleTime: number;
    sales: number;
  }>;
  bestDaysByItem: Array<{
    item: string;
    bestDay: string;
    salesOnBestDay: number;
    dayOfWeek: string;
    dayOfWeekNumber: number;
  }>;
}

type PeriodFilter = "1week" | "1month" | "3months" | "1year" | "all";

export default function StatsPage() {
  const { user, isGuest } = useAuth();
  const [stats, setStats] = useState<StatsData>({
    totalSales: 0,
    totalItems: 0,
    averageSaleTime: 0,
    topCategories: [],
    topItems: [],
    topTypesByCategory: [],
    recentActivity: [],
    saleTimeDistribution: [],
    salesTrend: [],
    fastestSellers: [],
    bestDaysByItem: []
  });
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>("all");

  const filterSalesByPeriod = (sales: SaleItem[], period: PeriodFilter): SaleItem[] => {
    if (period === "all") return sales;
    
    const now = new Date();
    let cutoffDate: Date;
    
    switch (period) {
      case "1week":
        cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "1month":
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "3months":
        cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case "1year":
        cutoffDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        return sales;
    }
    
    return sales.filter(sale => {
      // Utiliser les timestamps Firebase si disponibles, sinon fallback sur les dates string
      let saleDate: Date;
      if (sale.soldAt) {
        saleDate = sale.soldAt.toDate();
      } else if (sale.soldDate) {
        saleDate = new Date(sale.soldDate);
      } else {
        saleDate = new Date(sale.date);
      }
      
      return saleDate >= cutoffDate;
    });
  };

  const loadStats = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      let soldData: SaleItem[] = [];

      if (isGuest) {
        // Pour les invités, utiliser les données prédéfinies
        soldData = GUEST_SOLD_SALES.map(sale => ({
          ...sale,
          createdAt: Timestamp.fromDate(sale.createdAt),
          soldAt: sale.soldAt ? Timestamp.fromDate(sale.soldAt) : undefined
        }));
      } else {
        // Charger les ventes vendues (sold)
        const soldRef = collection(db, "users", user.uid, "sold");
        const soldSnapshot = await getDocs(soldRef);
        soldSnapshot.forEach((doc) => {
          soldData.push({ id: doc.id, ...doc.data() } as SaleItem);
        });
      }

      // Appliquer le filtre de période
      const filteredSoldData = filterSalesByPeriod(soldData, selectedPeriod);

      // Calculer les statistiques
      const totalSales = filteredSoldData.length;
      const totalItems = filteredSoldData.reduce((sum, sale) => sum + sale.quantity, 0);

      // Calculer le délai de vente moyen
      let totalSaleTime = 0;
      let validSales = 0;
      filteredSoldData.forEach(sale => {
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
      filteredSoldData.forEach(sale => {
        // Déterminer la catégorie basée sur le nom de l'item
        const current = categoryMap.get(sale.category) || { sales: 0, items: 0 };
        categoryMap.set(sale.category, {
          sales: current.sales + 1,
          items: current.items + sale.quantity
        });
      });

      const topCategories = Array.from(categoryMap.entries())
        .map(([name, data], index) => ({ 
          name, 
          ...data, 
          color: GRADIENT_COLORS[index % GRADIENT_COLORS.length] 
        }))
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 6);

      // Analyser les items les plus vendus
      const itemMap = new Map<string, { sales: number; quantity: number }>();
      filteredSoldData.forEach(sale => {
        const current = itemMap.get(sale.itemName) || { sales: 0, quantity: 0 };
        itemMap.set(sale.itemName, {
          sales: current.sales + 1,
          quantity: current.quantity + sale.quantity
        });
      });

      const topItems = Array.from(itemMap.entries())
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 8);

      // Analyser les types les plus vendus par catégorie
      const typeMap = new Map<string, Map<string, { sales: number; items: number }>>();
      filteredSoldData.forEach(sale => {
        const categoryTypes = typeMap.get(sale.category) || new Map<string, { sales: number; items: number }>();
        const currentType = categoryTypes.get(sale.type) || { sales: 0, items: 0 };
        categoryTypes.set(sale.type, {
          sales: currentType.sales + 1,
          items: currentType.items + sale.quantity
        });
        typeMap.set(sale.category, categoryTypes);
      });

      const topTypesByCategory: Array<{ category: string; types: Array<{ name: string; sales: number; items: number }> }> = [];
      topCategories.forEach(category => {
        const categoryTypes = typeMap.get(category.name) || new Map<string, { sales: number; items: number }>();
        const sortedTypes = Array.from(categoryTypes.entries())
          .map(([name, data]) => ({ name, ...data }))
          .sort((a, b) => b.sales - a.sales);
        
        topTypesByCategory.push({
          category: category.name,
          types: sortedTypes.slice(0, 3) // Prendre les 3 meilleurs types par catégorie
        });
      });

      // Activité récente (dernières 10 ventes)
      const recentActivity = filteredSoldData
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
          if (diffHours < 1) timeString = "À l&apos;instant";
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

      // Distribution des délais de vente avec couleurs
      const saleTimeDistribution = [
        { range: "< 1h", count: 0, color: '#22c55e' },
        { range: "1-6h", count: 0, color: '#3b82f6' },
        { range: "6-24h", count: 0, color: '#f59e0b' },
        { range: "1-7j", count: 0, color: '#ef4444' },
        { range: "> 7j", count: 0, color: '#8b5cf6' }
      ];

      filteredSoldData.forEach(sale => {
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

      // Calculer les items qui se vendent le plus rapidement
      const itemSaleTimeMap = new Map<string, { totalTime: number; sales: number }>();
      filteredSoldData.forEach(sale => {
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
        if (timeDiff > 0) {
          const current = itemSaleTimeMap.get(sale.itemName) || { totalTime: 0, sales: 0 };
          itemSaleTimeMap.set(sale.itemName, {
            totalTime: current.totalTime + timeDiff,
            sales: current.sales + 1
          });
        }
      });

      const fastestSellers = Array.from(itemSaleTimeMap.entries())
        .filter(([, data]) => data.sales >= 2) // Au moins 2 ventes pour être considéré
        .map(([name, data]) => ({
          name,
          averageSaleTime: data.totalTime / data.sales / (1000 * 60 * 60), // en heures
          sales: data.sales
        }))
        .sort((a, b) => a.averageSaleTime - b.averageSaleTime)
        .slice(0, 10);

      // Analyser les meilleurs jours de vente par item
      const itemDayMap = new Map<string, Map<string, number>>();
      filteredSoldData.forEach(sale => {
        // Utiliser les timestamps Firebase si disponibles
        let saleDate: Date;
        if (sale.soldAt) {
          saleDate = sale.soldAt.toDate();
        } else if (sale.soldDate) {
          saleDate = new Date(sale.soldDate);
        } else {
          saleDate = new Date(sale.date);
        }
        
        const dateStr = saleDate.toDateString();
        
        const itemDays = itemDayMap.get(sale.itemName) || new Map<string, number>();
        const currentCount = itemDays.get(dateStr) || 0;
        itemDays.set(dateStr, currentCount + 1);
        itemDayMap.set(sale.itemName, itemDays);
      });

      const bestDaysByItem = Array.from(itemDayMap.entries())
        .filter(([, dayMap]) => dayMap.size > 0)
        .map(([item, dayMap]) => {
          const bestEntry = Array.from(dayMap.entries())
            .sort((a, b) => b[1] - a[1])[0];
          
          if (!bestEntry) return null;
          
          const bestDate = new Date(bestEntry[0]);
          const dayOfWeek = bestDate.toLocaleDateString('fr-FR', { weekday: 'long' });
          
          return {
            item,
            bestDay: bestDate.toLocaleDateString('fr-FR'),
            salesOnBestDay: bestEntry[1],
            dayOfWeek: dayOfWeek,
            dayOfWeekNumber: bestDate.getDay() // 0 = Dimanche, 1 = Lundi, etc.
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null)
        .sort((a, b) => {
          // Convertir dimanche (0) en 7 pour avoir lundi = 1, dimanche = 7
          const dayA = a.dayOfWeekNumber === 0 ? 7 : a.dayOfWeekNumber;
          const dayB = b.dayOfWeekNumber === 0 ? 7 : b.dayOfWeekNumber;
          return dayA - dayB;
        })
        .slice(0, 50); // Augmenter la limite pour voir plus d'items

      setStats({
        totalSales,
        totalItems,
        averageSaleTime,
        topCategories,
        topItems,
        topTypesByCategory,
        recentActivity,
        saleTimeDistribution,
        salesTrend: [],
        fastestSellers,
        bestDaysByItem
      });
    } catch (error) {
      console.error("Erreur lors du chargement des statistiques:", error);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, selectedPeriod]); // Ajouter selectedPeriod aux dépendances

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user, loadStats]);

  // Plus besoin de vérifier si user existe car l'auth anonyme est maintenant activée

  const periodLabels = {
    "1week": "1 semaine",
    "1month": "1 mois", 
    "3months": "3 mois",
    "1year": "1 an",
    "all": "Toutes"
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Statistiques</h1>
        <p className="text-muted-foreground">
          {isGuest 
            ? "Données de démonstration - Créez un compte pour voir vos vraies statistiques"
            : "Analysez vos performances de vente et vos meilleurs vendeurs"
          }
        </p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Période:</span>
          <div className="flex gap-1">
            {(Object.keys(periodLabels) as PeriodFilter[]).map((period) => (
              <Button
                key={period}
                variant={selectedPeriod === period ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedPeriod(period)}
                className="h-8"
              >
                {periodLabels[period]}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Chargement des statistiques...</span>
        </div>
      ) : (
        <>
          {/* Key Metrics avec couleurs */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ventes totales</CardTitle>
                <Package className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.totalSales}</div>
                <p className="text-xs text-muted-foreground">
                  Transactions complétées
                </p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-primary">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Items vendus</CardTitle>
                <Target className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.totalItems}</div>
                <p className="text-xs text-muted-foreground">
                  Nombre total d&apos;items
                </p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-orange-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Délai moyen</CardTitle>
                <Clock className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{stats.averageSaleTime.toFixed(2)}h</div>
                <p className="text-xs text-muted-foreground">
                  Temps de vente moyen
                </p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Activité</CardTitle>
                <Activity className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{stats.recentActivity.length}</div>
                <p className="text-xs text-muted-foreground">
                  Ventes récentes
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Items qui se vendent le plus rapidement */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Items les plus rapides à vendre
              </CardTitle>
              <CardDescription>
                Items avec le délai de vente moyen le plus court (minimum 2 ventes)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats.fastestSellers.length > 0 ? (
                <div className="space-y-4">
                  {stats.fastestSellers.map((item, index) => {
                    const color = GRADIENT_COLORS[index % GRADIENT_COLORS.length];
                    const maxTime = Math.max(...stats.fastestSellers.map(i => i.averageSaleTime));
                    const percentage = maxTime > 0 ? (item.averageSaleTime / maxTime) * 100 : 0;
                    
                    return (
                      <div key={item.name} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium text-white"
                              style={{ backgroundColor: color }}
                            >
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-medium">{item.name}</p>
                              <p className="text-sm text-muted-foreground">{item.sales} ventes</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-green-600">
                              {item.averageSaleTime < 1 
                                ? `${(item.averageSaleTime * 60).toFixed(0)}min`
                                : item.averageSaleTime < 24
                                  ? `${item.averageSaleTime.toFixed(1)}h`
                                  : `${(item.averageSaleTime / 24).toFixed(1)}j`
                              }
                            </p>
                            <p className="text-sm text-muted-foreground">temps moyen</p>
                          </div>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="h-2 rounded-full transition-all duration-500"
                            style={{ 
                              width: `${percentage}%`,
                              backgroundColor: color
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Pas assez de données pour analyser la vitesse de vente</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Il faut au moins 2 ventes par item pour calculer le temps moyen
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Graphiques */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Meilleurs jours de vente par item */}
            <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Meilleurs jours de vente par item
              </CardTitle>
              <CardDescription>
                Jours où chaque item a le plus vendu
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats.bestDaysByItem.length > 0 ? (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-6">
                    {(() => {
                      // Grouper les items par jour de la semaine
                      const groupedByDay = stats.bestDaysByItem.reduce((acc, item) => {
                        const day = item.dayOfWeek;
                        if (!acc[day]) acc[day] = [];
                        acc[day].push(item);
                        return acc;
                      }, {} as Record<string, typeof stats.bestDaysByItem>);

                      const daysOrder = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
                      const maxSales = Math.max(...stats.bestDaysByItem.map(i => i.salesOnBestDay));

                      return daysOrder.map((dayName) => {
                        const items = groupedByDay[dayName] || [];
                        if (items.length === 0) return null;

                        return (
                          <div key={dayName} className="space-y-3">
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-semibold capitalize text-primary">{dayName}</h3>
                              <Badge variant="secondary" className="text-xs">
                                {items.length} item{items.length > 1 ? 's' : ''}
                              </Badge>
                            </div>
                            <div className="space-y-2 pl-4 border-l-2 border-primary/20">
                              {items.map((item, index) => {
                                const color = GRADIENT_COLORS[(dayName.charCodeAt(0) + index) % GRADIENT_COLORS.length];
                                const percentage = maxSales > 0 ? (item.salesOnBestDay / maxSales) * 100 : 0;
                                
                                return (
                                  <div key={item.item} className="space-y-2 p-3 rounded-lg border bg-card">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                        <div 
                                          className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium text-white"
                                          style={{ backgroundColor: color }}
                                        >
                                          {item.salesOnBestDay}
                                        </div>
                                        <div>
                                          <p className="font-medium text-sm">{item.item}</p>
                                          <p className="text-xs text-muted-foreground">
                                            {item.bestDay}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-sm text-muted-foreground">
                                          {item.salesOnBestDay} vente{item.salesOnBestDay > 1 ? 's' : ''}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="w-full bg-muted rounded-full h-1.5">
                                      <div 
                                        className="h-1.5 rounded-full transition-all duration-500"
                                        style={{ 
                                          width: `${percentage}%`,
                                          backgroundColor: color
                                        }}
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      }).filter(Boolean);
                    })()}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Aucune donnée pour analyser les meilleurs jours</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Vendez des items pour voir les tendances par jour
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

            {/* Graphique en secteurs des délais de vente */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-primary" />
                  Délais de vente
                </CardTitle>
                <CardDescription>
                  Répartition des temps de vente
                </CardDescription>
              </CardHeader>
              <CardContent>
                {stats.saleTimeDistribution.some(d => d.count > 0) ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={stats.saleTimeDistribution.filter(d => d.count > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="count"
                        label={({ range, percent }) => `${range} (${((percent || 0) * 100).toFixed(0)}%)`}
                      >
                        {stats.saleTimeDistribution.filter(d => d.count > 0).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'var(--background)', 
                          border: '1px solid var(--border)',
                          borderRadius: '8px'
                        }}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center">
                    <div className="text-center">
                      <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Aucune donnée disponible</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>


          {/* Top Items avec barres de progression */}
          <Card>
            <CardHeader>
              <CardTitle>Items les plus vendus </CardTitle>
              <CardDescription>
                En quantité et en pourcentage du total
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats.topItems.length > 0 ? (
                <div className="space-y-4">
                  {stats.topItems.map((item, index) => {
                    const maxQuantity = Math.max(...stats.topItems.map(i => i.quantity));
                    const percentage = (item.quantity / maxQuantity) * 100;
                    const color = GRADIENT_COLORS[index % GRADIENT_COLORS.length];
                    
                    return (
                      <div key={item.name} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium text-white"
                              style={{ backgroundColor: color }}
                            >
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
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="h-2 rounded-full transition-all duration-500"
                            style={{ 
                              width: `${percentage}%`,
                              backgroundColor: color
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Aucune vente pour analyser les items</p>
                </div>
              )}
            </CardContent>
          </Card>
          {/* Recent Activity avec couleurs */}
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
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg border-l-4 border-l-primary bg-accent">
                          <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full bg-primary" />
                            <div>
                            <p className="font-medium">{activity.item}</p>
                            <p className="text-sm text-muted-foreground">
                              Vente • {activity.time}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{activity.quantity} items</p>
                          <Badge variant="default" className="bg-primary hover:bg-green-600">
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
        </>
      )}
    </div>
  );
} 