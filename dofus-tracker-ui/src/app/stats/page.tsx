"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Package, Users, Activity } from "lucide-react";

export default function StatsPage() {
  // Données fictives pour les statistiques
  const stats = {
    totalRevenue: 1250000,
    monthlyGrowth: 15.3,
    totalSales: 342,
    averagePrice: 3655,
    topCategories: [
      { name: "Armes", revenue: 450000, sales: 120 },
      { name: "Équipements", revenue: 380000, sales: 95 },
      { name: "Consommables", revenue: 280000, sales: 80 },
      { name: "Ressources", revenue: 140000, sales: 47 },
    ],
    recentActivity: [
      { type: "sale", item: "Épée de l'Ancien", price: 50000, time: "2h" },
      { type: "purchase", item: "Potion de Force", price: 1500, time: "4h" },
      { type: "sale", item: "Bottes de l'Ombre", price: 25000, time: "6h" },
      { type: "sale", item: "Anneau de Protection", price: 35000, time: "8h" },
    ],
    topItems: [
      { name: "Épée de l'Ancien", sales: 15, revenue: 750000 },
      { name: "Bottes de l'Ombre", sales: 12, revenue: 300000 },
      { name: "Anneau de Protection", sales: 10, revenue: 350000 },
      { name: "Potion de Force", sales: 25, revenue: 37500 },
    ]
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Statistiques</h1>
        <p className="text-muted-foreground">
          Analysez vos performances et vos meilleurs vendeurs
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus totaux</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRevenue.toLocaleString()} kamas</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              +{stats.monthlyGrowth}% ce mois
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventes totales</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSales}</div>
            <p className="text-xs text-muted-foreground">
              Items vendus
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prix moyen</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averagePrice.toLocaleString()} kamas</div>
            <p className="text-xs text-muted-foreground">
              Par vente
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activité</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">
              Ventes cette semaine
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
              Revenus par catégorie d'items
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                    <p className="font-medium">{category.revenue.toLocaleString()} kamas</p>
                    <p className="text-sm text-muted-foreground">
                      {((category.revenue / stats.totalRevenue) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Items */}
        <Card>
          <CardHeader>
            <CardTitle>Meilleurs vendeurs</CardTitle>
            <CardDescription>
              Items les plus vendus
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                    <p className="font-medium">{item.revenue.toLocaleString()} kamas</p>
                    <p className="text-sm text-muted-foreground">
                      {((item.revenue / stats.totalRevenue) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Activité récente</CardTitle>
          <CardDescription>
            Vos dernières transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <div className="space-y-4">
              {stats.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      activity.type === 'sale' ? 'bg-green-500' : 'bg-blue-500'
                    }`} />
                    <div>
                      <p className="font-medium">{activity.item}</p>
                      <p className="text-sm text-muted-foreground">
                        {activity.type === 'sale' ? 'Vente' : 'Achat'} • Il y a {activity.time}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{activity.price.toLocaleString()} kamas</p>
                    <Badge variant={activity.type === 'sale' ? 'default' : 'secondary'}>
                      {activity.type === 'sale' ? 'Vente' : 'Achat'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Performance Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Évolution des revenus</CardTitle>
          <CardDescription>
            Graphique des revenus sur les 30 derniers jours
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
    </div>
  );
} 