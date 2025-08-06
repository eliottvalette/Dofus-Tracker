"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TrendingUp, TrendingDown, DollarSign, Package, Users, Activity, Star, Calendar, AlertCircle, CheckCircle, Target, Zap, Award } from "lucide-react";

export default function DashboardPage() {
  // Données fictives pour le dashboard
  const dashboardData = {
    userStats: {
      totalEarnings: 450000,
      itemsSold: 23,
      bestSale: "Épée de l'Ancien",
      bestSalePrice: 50000,
      averagePrice: 19565,
      successRate: 94.5
    },
    marketTrends: [
      { item: "Épée de l'Ancien", trend: "up", change: "+15%", price: 50000 },
      { item: "Bottes de l'Ombre", trend: "up", change: "+8%", price: 25000 },
      { item: "Potion de Force", trend: "down", change: "-3%", price: 1500 },
      { item: "Anneau de Protection", trend: "stable", change: "0%", price: 35000 },
    ],
    quickActions: [
      { name: "Ajouter une vente", icon: Package, color: "bg-blue-500" },
      { name: "Voir mes items", icon: Target, color: "bg-green-500" },
      { name: "Prix du marché", icon: TrendingUp, color: "bg-purple-500" },
      { name: "Mes objectifs", icon: Award, color: "bg-orange-500" },
    ],
    recentAchievements: [
      { title: "Première vente", description: "Vous avez vendu votre premier item", date: "Aujourd'hui", icon: Star },
      { title: "Vendeur actif", description: "10 ventes cette semaine", date: "Hier", icon: Zap },
      { title: "Prix record", description: "Nouveau record de vente", date: "Il y a 2 jours", icon: Award },
    ],
    upcomingEvents: [
      { title: "Événement saisonnier", date: "Dans 3 jours", type: "event" },
      { title: "Maintenance serveur", date: "Demain 2h-4h", type: "maintenance" },
      { title: "Nouveau patch", date: "Cette semaine", type: "update" },
    ]
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up": return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "down": return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <div className="h-4 w-4" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case "event": return "bg-green-500";
      case "maintenance": return "bg-red-500";
      case "update": return "bg-blue-500";
      default: return "bg-gray-500";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Votre espace personnel et vos objectifs
        </p>
      </div>

      {/* User Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mes gains</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.userStats.totalEarnings.toLocaleString()} kamas</div>
            <p className="text-xs text-muted-foreground">
              Total des ventes
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Items vendus</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.userStats.itemsSold}</div>
            <p className="text-xs text-muted-foreground">
              Cette semaine
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meilleure vente</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{dashboardData.userStats.bestSale}</div>
            <p className="text-xs text-muted-foreground">
              {dashboardData.userStats.bestSalePrice.toLocaleString()} kamas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de réussite</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.userStats.successRate}%</div>
            <p className="text-xs text-muted-foreground">
              Ventes réussies
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions rapides</CardTitle>
            <CardDescription>
              Accès direct à vos fonctionnalités préférées
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {dashboardData.quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Card key={action.name} className="hover:shadow-lg transition-all cursor-pointer">
                    <CardContent className="p-4 text-center">
                      <div className={`w-12 h-12 rounded-full ${action.color} flex items-center justify-center mx-auto mb-3`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <p className="font-medium text-sm">{action.name}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Market Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Tendances du marché</CardTitle>
            <CardDescription>
              Évolution des prix de vos items favoris
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData.marketTrends.map((trend) => (
                <div key={trend.item} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    {getTrendIcon(trend.trend)}
                    <div>
                      <p className="font-medium">{trend.item}</p>
                      <p className="text-sm text-muted-foreground">{trend.price.toLocaleString()} kamas</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium ${
                      trend.trend === 'up' ? 'text-green-500' : 
                      trend.trend === 'down' ? 'text-red-500' : 'text-gray-500'
                    }`}>
                      {trend.change}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Achievements */}
        <Card>
          <CardHeader>
            <CardTitle>Récentes réussites</CardTitle>
            <CardDescription>
              Vos accomplissements récents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData.recentAchievements.map((achievement) => {
                const Icon = achievement.icon;
                return (
                  <div key={achievement.title} className="flex items-center gap-3 p-3 rounded-lg border">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{achievement.title}</p>
                      <p className="text-sm text-muted-foreground">{achievement.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">{achievement.date}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <CardHeader>
            <CardTitle>Événements à venir</CardTitle>
            <CardDescription>
              Restez informé des événements importants
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData.upcomingEvents.map((event) => (
                <div key={event.title} className="flex items-center gap-3 p-3 rounded-lg border">
                  <div className={`w-3 h-3 rounded-full ${getEventColor(event.type)}`} />
                  <div className="flex-1">
                    <p className="font-medium">{event.title}</p>
                    <p className="text-sm text-muted-foreground">{event.date}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {event.type === 'event' ? 'Événement' : 
                     event.type === 'maintenance' ? 'Maintenance' : 'Mise à jour'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Personal Goals */}
      <Card>
        <CardHeader>
          <CardTitle>Mes objectifs</CardTitle>
          <CardDescription>
            Suivez vos objectifs personnels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
              <CardContent className="p-4 text-center">
                <Target className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <p className="font-medium">Objectif ventes</p>
                <p className="text-2xl font-bold text-green-600">15/20</p>
                <p className="text-xs text-muted-foreground">Items ce mois</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
              <CardContent className="p-4 text-center">
                <DollarSign className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <p className="font-medium">Objectif revenus</p>
                <p className="text-2xl font-bold text-blue-600">75%</p>
                <p className="text-xs text-muted-foreground">500k kamas</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
              <CardContent className="p-4 text-center">
                <Award className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                <p className="font-medium">Niveau vendeur</p>
                <p className="text-2xl font-bold text-purple-600">Expert</p>
                <p className="text-xs text-muted-foreground">95% complété</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 