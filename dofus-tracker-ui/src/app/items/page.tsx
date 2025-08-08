"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Grid, List, Heart, HeartOff, HelpCircle } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { collection, addDoc, deleteDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/firebase-provider";
import { useIsMobile } from "@/hooks/use-mobile";
import { HelpDialogComponent } from "@/components/ui/help-dialog";
import { GuestAuthDialog } from "@/components/ui/guest-auth-dialog";
import { GUEST_FAVORITES } from "@/lib/guest-data";

interface Item {
  category: string;
  nom: string;
  type: string;
  niveau: string;
  web_image_url: string;
  image_url: string;
}

export default function ItemsPage() {
  const { user, isGuest } = useAuth();
  const isMobile = useIsMobile();
  const [allItems, setAllItems] = useState<Item[]>([]);
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [displayedItems, setDisplayedItems] = useState<Item[]>([]);
  const [favoriteItems, setFavoriteItems] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedType] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [favoriteFilter, setFavoriteFilter] = useState<"all" | "favorites" | "not-favorites">("all");
  const [loading, setLoading] = useState(true);
  const [itemsToShow, setItemsToShow] = useState(100);
  const [floatingNotifications, setFloatingNotifications] = useState<Array<{
    id: string;
    x: number;
    y: number;
    text: string;
  }>>([]);
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  const [guestDialogOpen, setGuestDialogOpen] = useState(false);

  const categories = [
    { id: "armes", name: "Armes" },
    { id: "equipements", name: "Équipements" },
    { id: "consommables", name: "Consommables" },
    { id: "ressources", name: "Ressources" },
  ];

  const loadAllItems = async () => {
    setLoading(true);
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
      
      // Trier les items par niveau croissant
      const sortedItems = parsedItems.sort((a, b) => {
        const niveauA = parseInt(a.niveau.replace('Niv. ', '')) || 0;
        const niveauB = parseInt(b.niveau.replace('Niv. ', '')) || 0;
        return niveauA - niveauB;
      });
      
      setAllItems(sortedItems);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

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
      
      favoritesSnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        favoritesSet.add(data.itemName);
      });
      
      setFavoriteItems(favoritesSet);
    } catch (error) {
      console.error("Erreur lors du chargement des favoris:", error);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // Retrait de isGuest pour éviter les re-renders inutiles

  const toggleFavorite = async (item: Item, event: React.MouseEvent) => {
    if (!user) return;

    // Si l'utilisateur est invité, afficher le dialog d'authentification
    if (isGuest) {
      setGuestDialogOpen(true);
      return;
    }

    const isCurrentlyFavorite = favoriteItems.has(item.nom);
    const notificationId = Date.now().toString();
    
    // Créer une notification flottante
    const newNotification = {
      id: notificationId,
      x: event.clientX,
      y: event.clientY,
      text: `+${isCurrentlyFavorite ? "Retiré" : "Ajouté"}`,
    };
    
    setFloatingNotifications(prev => [...prev, newNotification]);
    
    // Supprimer la notification après l'animation
    setTimeout(() => {
      setFloatingNotifications(prev => prev.filter(n => n.id !== notificationId));
    }, 1000);

    try {
      if (isCurrentlyFavorite) {
        // Retirer des favoris
        const favoritesRef = collection(db, "users", user.uid, "favorites");
        const q = query(favoritesRef, where("itemName", "==", item.nom));
        const querySnapshot = await getDocs(q);
        
        querySnapshot.forEach(async (docSnapshot) => {
          await deleteDoc(docSnapshot.ref);
        });
        
        setFavoriteItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(item.nom);
          return newSet;
        });
      } else {
        // Ajouter aux favoris
        const favoriteData = {
          itemName: item.nom,
          category: item.category,
          type: item.type,
          niveau: item.niveau,
          image_url: item.image_url,
          createdAt: new Date()
        };
        
        await addDoc(collection(db, "users", user.uid, "favorites"), favoriteData);
        
        setFavoriteItems(prev => {
          const newSet = new Set(prev);
          newSet.add(item.nom);
          return newSet;
        });
      }
    } catch (error) {
      console.error("Erreur lors de la modification des favoris:", error);
    }
  };

  const filterItems = useCallback(() => {
    let filtered = allItems;

    if (selectedCategory) {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedType) {
      filtered = filtered.filter(item => item.type === selectedType);
    }

    // Filtre des favoris
    if (favoriteFilter === "favorites") {
      filtered = filtered.filter(item => favoriteItems.has(item.nom));
    } else if (favoriteFilter === "not-favorites") {
      filtered = filtered.filter(item => !favoriteItems.has(item.nom));
    }

    setFilteredItems(filtered);
  }, [allItems, searchTerm, selectedCategory, selectedType, favoriteFilter, favoriteItems]);

  const loadMoreItems = () => {
    setItemsToShow(prev => prev + 100);
  };

  useEffect(() => {
    loadAllItems();
    if (user) {
      loadFavorites();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // Retrait de loadFavorites des dépendances pour éviter la boucle infinie

  useEffect(() => {
    filterItems();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allItems, searchTerm, selectedCategory, selectedType, favoriteFilter, favoriteItems]); // Retrait de filterItems pour éviter la boucle infinie

  useEffect(() => {
    // Mettre à jour les items affichés quand les items filtrés changent
    setDisplayedItems(filteredItems.slice(0, itemsToShow));
  }, [filteredItems, itemsToShow]);

  // Plus besoin de vérifier si user existe car l'auth anonyme est maintenant activée

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Floating Notifications */}
      {floatingNotifications.map((notification) => (
        <div
          key={notification.id}
          className="fixed z-50 pointer-events-none animate-ping"
          style={{
            left: notification.x - 20,
            top: notification.y - 20,
          }}
        >
          <div className="flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-primary text-primary-foreground">
            <Heart className="h-4 w-4" />
            {notification.text}
          </div>
        </div>
      ))}

      {/* Search and Filters */}
      <Card>
        <CardHeader className="pb-4 relative">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg md:text-xl">Recherche et filtres</CardTitle>
              <CardDescription>
                Trouvez rapidement vos items préférés
              </CardDescription>
            </div>
            <button
              onClick={() => setHelpDialogOpen(true)}
              className="h-16 w-16 p-0 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
              title="Aide"
            >
              <HelpCircle className="h-8 w-8 bg-primary text-primary-foreground rounded-full" />
            </button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Rechercher un item..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* View Mode and Favorite Filter */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {!isMobile && <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
              >
                <Grid className="h-4 w-4 mr-2" />
                Grille
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4 mr-2" />
                Liste
              </Button>
            </div>
            }

            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant={favoriteFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFavoriteFilter("all")}
                className={isMobile ? "min-w-[60px]" : ""}
                title={isMobile ? "Afficher tous les items" : ""}
              >
                Tout
              </Button>
              <Button
                variant={favoriteFilter === "favorites" ? "default" : "outline"}
                size="sm"
                onClick={() => setFavoriteFilter("favorites")}
                className={isMobile ? "min-w-[60px]" : ""}
                title={isMobile ? "Afficher seulement les favoris" : ""}
              >
                <Heart className={`h-4 w-4 ${isMobile ? "" : "mr-2"}`} />
                {!isMobile && "Favoris"}
                {isMobile && (
                  <span className="ml-1 text-xs">Que les Fav</span>
                )}
              </Button>
              <Button
                variant={favoriteFilter === "not-favorites" ? "default" : "outline"}
                size="sm"
                onClick={() => setFavoriteFilter("not-favorites")}
                className={isMobile ? "min-w-[60px]" : ""}
                title={isMobile ? "Afficher seulement les non-favoris" : ""}
              >
                <HeartOff className={`h-4 w-4 ${isMobile ? "" : "mr-2"}`} />
                {!isMobile && "Non favoris"}
                {isMobile && (
                  <span className="ml-1 text-xs">Non Favs</span>
                )}
              </Button>
            </div>
          </div>

          {/* Categories */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge 
              variant={selectedCategory === "" ? "default" : "outline"}
              className="cursor-pointer h-7"
              onClick={() => setSelectedCategory("")}
            >
              {isMobile ? "Toutes" : "Toutes"}
            </Badge>
            {categories.map((category) => (
              <Badge 
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                className="cursor-pointer h-7 hover:bg-accent"
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.name}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg md:text-xl">Résultats ({filteredItems.length} items)</CardTitle>
          <CardDescription className="text-sm">
            {selectedCategory ? `${categories.find(c => c.id === selectedCategory)?.name} - ` : ""}
            {selectedType ? `${selectedType} - ` : ""}
            {searchTerm ? `Recherche: "${searchTerm}"` : "Tous les items"}
            {favoriteFilter !== "all" && ` - ${favoriteFilter === "favorites" ? "Favoris" : "Non favoris"}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">Chargement...</p>
            </div>
          ) : (
            <>
              <ScrollArea className="h-[500px] md:h-[600px]">
                {viewMode === "grid" ? (
                  <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {displayedItems.map((item, index) => (
                      <Card 
                        key={index} 
                        className="hover:shadow-lg transition-all cursor-pointer relative group hover:bg-accent"
                        onClick={(e) => toggleFavorite(item, e)}
                      >
                        <CardContent className="px-3 py-3 md:px-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 border">
                              {item.image_url ? (
                                <img 
                                  src={item.image_url} 
                                  alt={item.nom}
                                  className="w-8 h-8 md:w-10 md:h-10 object-contain"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              ) : (
                                <div className="w-8 h-8 md:w-10 md:h-10 bg-muted-foreground/20 rounded" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{item.nom}</p>
                              <div className="flex items-center gap-1 mt-1">
                                <Badge variant="secondary" className="text-xs">
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
                ) : (
                  <div className="space-y-2">
                    {displayedItems.map((item, index) => (
                      <Card 
                        key={index} 
                        className="hover:shadow-lg transition-all cursor-pointer relative group"
                        onClick={(e) => toggleFavorite(item, e)}
                      >
                        <CardContent className="p-3 md:p-4">
                          <div className="flex items-center space-x-3 md:space-x-4">
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                              {item.image_url ? (
                                <img 
                                  src={item.image_url} 
                                  alt={item.nom}
                                  className="w-8 h-8 md:w-10 md:h-10 object-contain"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              ) : (
                                <div className="w-8 h-8 md:w-10 md:h-10 bg-muted-foreground/20 rounded" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm md:text-base">{item.nom}</p>
                              <p className="text-xs md:text-sm text-muted-foreground">{item.type}</p>
                            </div>
                            <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
                              <Badge variant="secondary" className="text-xs">
                                {item.type}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {item.niveau}
                              </Badge>
                              {!isMobile && (
                                <Badge variant="outline" className="text-xs">
                                  {item.category}
                                </Badge>
                              )}
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
                )}
                {/* Load More Button */}
                {displayedItems.length < filteredItems.length && (
                  <div className="flex justify-center mt-6">
                    <Button 
                      onClick={loadMoreItems}
                      className="w-full max-w-xs"
                    >
                      Voir {Math.min(100, filteredItems.length - displayedItems.length)} items supplémentaires
                    </Button>
                  </div>
                )}
              </ScrollArea>
            </>
          )}
        </CardContent>
      </Card>

      {/* Help Dialog */}
      <HelpDialogComponent 
        open={helpDialogOpen} 
        onOpenChange={setHelpDialogOpen} 
      />
      
      {/* Guest Auth Dialog */}
      <GuestAuthDialog
        open={guestDialogOpen}
        onOpenChange={setGuestDialogOpen}
        title="Favoris - Compte requis"
        description="La gestion des favoris nécessite un compte utilisateur. Créez un compte 100% gratuit pour sauvegarder vos favoris personnalisés ou continuez en mode invité avec les favoris prédéfinis."
      />
    </div>
  );
} 