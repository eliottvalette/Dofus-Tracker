"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, MessageSquare, ThumbsUp, Share2, TrendingUp, Award, Heart } from "lucide-react";

export default function CommunityPage() {
  // Données fictives pour la communauté
  const communityData = {
    totalUsers: 1247,
    activeUsers: 89,
    totalPosts: 342,
    topContributors: [
      { name: "DragonSlayer", contributions: 45, level: "Expert", avatar: "🐉" },
      { name: "MagePro", contributions: 38, level: "Expert", avatar: "🧙‍♂️" },
      { name: "CraftMaster", contributions: 32, level: "Vétéran", avatar: "⚒️" },
      { name: "TradeKing", contributions: 28, level: "Vétéran", avatar: "💰" },
    ],
    recentPosts: [
      {
        id: 1,
        author: "DragonSlayer",
        title: "Guide complet pour les armes de niveau 200",
        content: "Voici un guide détaillé pour optimiser vos ventes d'armes de haut niveau...",
        likes: 24,
        comments: 8,
        time: "2h",
        category: "Guide"
      },
      {
        id: 2,
        author: "MagePro",
        title: "Nouvelle stratégie de pricing pour les consommables",
        content: "J'ai découvert une méthode efficace pour maximiser les profits sur les potions...",
        likes: 18,
        comments: 12,
        time: "4h",
        category: "Stratégie"
      },
      {
        id: 3,
        author: "CraftMaster",
        title: "Les meilleurs moments pour vendre les ressources",
        content: "Analyse des tendances de prix selon les événements du jeu...",
        likes: 15,
        comments: 6,
        time: "6h",
        category: "Analyse"
      }
    ],
    trendingTopics: [
      { name: "Événements saisonniers", posts: 23, trend: "up" },
      { name: "Nouveaux items", posts: 18, trend: "up" },
      { name: "Stratégies de pricing", posts: 15, trend: "up" },
      { name: "Guides de vente", posts: 12, trend: "stable" },
    ]
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Communauté</h1>
        <p className="text-muted-foreground">
          Rejoignez la communauté et partagez vos connaissances
        </p>
      </div>

      {/* Community Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Membres totaux</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{communityData.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +12% ce mois
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilisateurs actifs</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{communityData.activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              En ligne maintenant
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Posts totaux</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{communityData.totalPosts}</div>
            <p className="text-xs text-muted-foreground">
              Contributions partagées
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94%</div>
            <p className="text-xs text-muted-foreground">
              Taux de satisfaction
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Contributors */}
        <Card>
          <CardHeader>
            <CardTitle>Top contributeurs</CardTitle>
            <CardDescription>
              Les membres les plus actifs de la communauté
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {communityData.topContributors.map((contributor, index) => (
                <div key={contributor.name} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg">
                      {contributor.avatar}
                    </div>
                    <div>
                      <p className="font-medium">{contributor.name}</p>
                      <p className="text-sm text-muted-foreground">{contributor.level}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{contributor.contributions} posts</p>
                    <Badge variant="secondary">
                      {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "🏅"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Trending Topics */}
        <Card>
          <CardHeader>
            <CardTitle>Sujets tendance</CardTitle>
            <CardDescription>
              Les sujets les plus discutés actuellement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {communityData.trendingTopics.map((topic) => (
                <div key={topic.name} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      topic.trend === 'up' ? 'bg-green-500' : 'bg-blue-500'
                    }`} />
                    <div>
                      <p className="font-medium">{topic.name}</p>
                      <p className="text-sm text-muted-foreground">{topic.posts} discussions</p>
                    </div>
                  </div>
                  <Badge variant={topic.trend === 'up' ? 'default' : 'secondary'}>
                    {topic.trend === 'up' ? '🔥' : '📊'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Posts */}
      <Card>
        <CardHeader>
          <CardTitle>Posts récents</CardTitle>
          <CardDescription>
            Les dernières contributions de la communauté
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              {communityData.recentPosts.map((post) => (
                <Card key={post.id} className="hover:shadow-lg transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{post.category}</Badge>
                          <span className="text-sm text-muted-foreground">par {post.author}</span>
                          <span className="text-sm text-muted-foreground">• {post.time}</span>
                        </div>
                        <h3 className="font-medium mb-2">{post.title}</h3>
                        <p className="text-sm text-muted-foreground mb-3">{post.content}</p>
                        <div className="flex items-center gap-4">
                          <Button variant="ghost" size="sm" className="flex items-center gap-1">
                            <ThumbsUp className="h-4 w-4" />
                            {post.likes}
                          </Button>
                          <Button variant="ghost" size="sm" className="flex items-center gap-1">
                            <MessageSquare className="h-4 w-4" />
                            {post.comments}
                          </Button>
                          <Button variant="ghost" size="sm" className="flex items-center gap-1">
                            <Share2 className="h-4 w-4" />
                            Partager
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Community Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle>Guidelines de la communauté</CardTitle>
          <CardDescription>
            Règles et bonnes pratiques pour contribuer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <h4 className="font-medium">✅ Ce qui est encouragé</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Partager des stratégies de vente éprouvées</li>
                <li>• Créer des guides détaillés et utiles</li>
                <li>• Aider les nouveaux membres</li>
                <li>• Respecter les autres membres</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-medium">❌ Ce qui est interdit</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Spam et publicité non autorisée</li>
                <li>• Contenu offensant ou inapproprié</li>
                <li>• Partage d'informations personnelles</li>
                <li>• Promotion de méthodes de triche</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Call to Action */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
        <CardContent className="p-6 text-center">
          <Award className="h-12 w-12 text-primary mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">Rejoignez la communauté !</h3>
          <p className="text-muted-foreground mb-4">
            Partagez vos connaissances, apprenez des autres et contribuez à faire de Dofus Tracker la meilleure plateforme de trading.
          </p>
          <div className="flex gap-2 justify-center">
            <Button>
              <MessageSquare className="h-4 w-4 mr-2" />
              Créer un post
            </Button>
            <Button variant="outline">
              <Users className="h-4 w-4 mr-2" />
              Voir tous les membres
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 