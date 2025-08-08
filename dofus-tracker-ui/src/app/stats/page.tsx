"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BarChart3, Package, Activity, Loader2, Clock, Target, PieChart } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { collection, getDocs, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/firebase-provider";
import { GUEST_SOLD_SALES } from "@/lib/guest-data";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Cell,
  Pie
} from 'recharts';

// Palettes de couleurs
const GRADIENT_COLORS = [
  '#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe',
  '#43e97b', '#38f9d7', '#fccb90', '#d57eeb', '#74b9ff', '#fd79a8'
];

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
}

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
    salesTrend: []
  });
  const [loading, setLoading] = useState(true);

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
        .slice(0, 8);

      // Analyser les types les plus vendus par catégorie
      const typeMap = new Map<string, Map<string, { sales: number; items: number }>>();
      soldData.forEach(sale => {
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
        topTypesByCategory,
        recentActivity,
        saleTimeDistribution,
        salesTrend: []
      });
    } catch (error) {
      console.error("Erreur lors du chargement des statistiques:", error);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // Retrait de isGuest pour éviter les re-renders inutiles

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user, loadStats]);

  // Plus besoin de vérifier si user existe car l'auth anonyme est maintenant activée

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Statistiques</h1>
        <p className="text-muted-foreground">
          {isGuest 
            ? "Données de démonstration - Créez un compte pour voir vos vraies statistiques"
            : "Analysez vos performances de vente et vos meilleurs vendeurs"
          }
        </p>
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

          {/* Graphiques principaux */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Graphique en barres des catégories */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Ventes par catégorie
                </CardTitle>
                <CardDescription>
                  Performance de vos différentes catégories d&apos;items
                </CardDescription>
              </CardHeader>
              <CardContent>
                {stats.topCategories.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={stats.topCategories}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'var(--background)', 
                          border: '1px solid var(--border)',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar dataKey="sales" radius={[4, 4, 0, 0]}>
                        {stats.topCategories.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center">
                    <div className="text-center">
                      <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Aucune donnée disponible</p>
                    </div>
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

          {/* Top Items avec barres de progression */}
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

          {/* Catégories avec barres colorées */}
          <Card>
            <CardHeader>
              <CardTitle>Performance par catégorie</CardTitle>
              <CardDescription>
                Analyse détaillée de vos catégories d&apos;items
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats.topCategories.length > 0 ? (
                <div className="space-y-6">
                  {stats.topCategories.map((category, index) => {
                    const maxSales = Math.max(...stats.topCategories.map(c => c.sales));
                    const percentage = (category.sales / maxSales) * 100;
                    
                    return (
                      <div key={category.name} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium text-white"
                              style={{ backgroundColor: category.color }}
                            >
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-medium text-lg">{category.name}</p>
                              <p className="text-sm text-muted-foreground">{category.sales} ventes • {category.items} items</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-xl" style={{ color: category.color }}>
                              {stats.totalItems > 0 ? ((category.items / stats.totalItems) * 100).toFixed(1) : "0"}%
                            </p>
                            <p className="text-sm text-muted-foreground">du total</p>
                          </div>
                        </div>
                        <div className="w-full bg-muted rounded-full h-3">
                          <div 
                            className="h-3 rounded-full transition-all duration-700"
                            style={{ 
                              width: `${percentage}%`,
                              backgroundColor: category.color
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
                  <p className="text-muted-foreground">Aucune vente pour analyser les catégories</p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
} 