"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TrendingUp, TrendingDown, DollarSign, Package, Users, Activity, Star, Calendar, AlertCircle, CheckCircle } from "lucide-react";

export default function Home() {
  // Données fictives pour les statistiques
  const stats = {
    totalRevenue: 1250000,
    monthlyGrowth: 15.3,
    totalSales: 342,
    averagePrice: 3655,
    bestSellingItem: "Épée de l'Ancien",
    bestSellingRevenue: 750000,
    activeUsers: 1247,
    newUsers: 89,
    topCategories: [
      { name: "Armes", revenue: 450000, sales: 120, growth: 12.5 },
      { name: "Équipements", revenue: 380000, sales: 95, growth: 8.2 },
      { name: "Consommables", revenue: 280000, sales: 80, growth: 15.7 },
      { name: "Ressources", revenue: 140000, sales: 47, growth: -2.1 },
    ],
    recentActivity: [
      { type: "sale", item: "Épée de l'Ancien", price: 50000, time: "2h", user: "DragonSlayer" },
      { type: "purchase", item: "Potion de Force", price: 1500, time: "4h", user: "MagePro" },
      { type: "sale", item: "Bottes de l'Ombre", price: 25000, time: "6h", user: "CraftMaster" },
      { type: "sale", item: "Anneau de Protection", price: 35000, time: "8h", user: "TradeKing" },
    ],
    news: [
      {
        id: 1,
        title: "Nouveau patch 2.73 disponible",
        content: "Nouveaux items et équilibrage des prix",
        date: "2024-01-15",
        priority: "high"
      },
      {
        id: 2,
        title: "Événement saisonnier en cours",
        content: "Prix des ressources en hausse de 25%",
        date: "2024-01-14",
        priority: "medium"
      },
      {
        id: 3,
        title: "Maintenance prévue",
        content: "Serveur en maintenance le 20 janvier",
        date: "2024-01-13",
        priority: "low"
      }
    ]
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-500";
      case "medium": return "bg-yellow-500";
      case "low": return "bg-blue-500";
      default: return "bg-gray-500";
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case "high": return "Important";
      case "medium": return "Info";
      case "low": return "Maintenance";
      default: return "Info";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Vue d'ensemble de vos performances et actualités
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
            <CardTitle className="text-sm font-medium">Meilleur vendeur</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{stats.bestSellingItem}</div>
            <p className="text-xs text-muted-foreground">
              {stats.bestSellingRevenue.toLocaleString()} kamas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilisateurs actifs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.newUsers} nouveaux
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Categories Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Performance par catégorie</CardTitle>
            <CardDescription>
              Revenus et croissance par catégorie d'items
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.topCategories.map((category) => (
                <div key={category.name} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                      {category.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium">{category.name}</p>
                      <p className="text-sm text-muted-foreground">{category.sales} ventes</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{category.revenue.toLocaleString()} kamas</p>
                    <p className={`text-xs flex items-center ${
                      category.growth >= 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {category.growth >= 0 ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      )}
                      {Math.abs(category.growth)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Activité récente</CardTitle>
            <CardDescription>
              Dernières transactions sur la plateforme
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
                          {activity.type === 'sale' ? 'Vente' : 'Achat'} par {activity.user}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{activity.price.toLocaleString()} kamas</p>
                      <p className="text-sm text-muted-foreground">Il y a {activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* News and Updates */}
      <Card>
        <CardHeader>
          <CardTitle>Actualités et mises à jour</CardTitle>
          <CardDescription>
            Dernières nouvelles du jeu et de la plateforme
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {stats.news.map((news) => (
              <Card key={news.id} className="hover:shadow-lg transition-all">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-3 h-3 rounded-full mt-2 ${getPriorityColor(news.priority)}`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          {getPriorityText(news.priority)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(news.date).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="font-medium mb-2">{news.title}</h3>
                      <p className="text-sm text-muted-foreground">{news.content}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions rapides</CardTitle>
          <CardDescription>
            Accès rapide aux fonctionnalités principales
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="hover:shadow-lg transition-all cursor-pointer">
              <CardContent className="p-4 text-center">
                <Package className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="font-medium">Voir tous les items</p>
                <p className="text-xs text-muted-foreground">Explorer la base de données</p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-all cursor-pointer">
              <CardContent className="p-4 text-center">
                <DollarSign className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="font-medium">Mes ventes</p>
                <p className="text-xs text-muted-foreground">Gérer vos transactions</p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-all cursor-pointer">
              <CardContent className="p-4 text-center">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="font-medium">Statistiques</p>
                <p className="text-xs text-muted-foreground">Analyser vos performances</p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-all cursor-pointer">
              <CardContent className="p-4 text-center">
                <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="font-medium">Communauté</p>
                <p className="text-xs text-muted-foreground">Proposer des améliorations</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
