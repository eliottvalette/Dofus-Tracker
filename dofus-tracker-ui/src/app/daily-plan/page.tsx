"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, Package, Calculator, Trash2, Heart, HelpCircle, Search, Check } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/firebase-provider";
import { 
  HelpDialog, 
  HelpDialogContent, 
  HelpDialogHeader, 
  HelpDialogTitle, 
  HelpDialogFooter, 
  HelpDialogCancel 
} from "@/components/ui/help-dialog";
import { GuestAuthDialog } from "@/components/ui/guest-auth-dialog";
import { GUEST_FAVORITES, GUEST_DAILY_PLAN, GUEST_CRAFT_ITEMS } from "@/lib/guest-data";

interface Item {
  category: string;
  nom: string;
  type: string;
  niveau: string;
  web_image_url: string;
  image_url: string;
}

interface CraftRecipe {
  category: string;
  has_recipe: boolean;
  job: string;
  job_level: number;
  ingredient_names: string[];
  ingredient_ids: number[];
  quantities: number[];
}

interface DailyPlanItem {
  id: string;
  itemName: string;
  itemImage?: string;
  category: string;
  type: string;
  dailyQuantity: number;
  lotSize: number;
}

interface ResourceRequirement {
  id: string;
  name: string;
  totalQuantity: number;
  image_url?: string;
  recipes: Array<{
    craftName: string;
    quantityNeeded: number;
    dailyProduction: number;
  }>;
  isCraftable: boolean;
  ingredientChain?: Array<{
    name: string;
    quantity: number;
    image_url?: string;
    isCraftable: boolean;
  }>;
}

export default function DailyPlanPage() {
  const { user, isGuest } = useAuth();
  const [allItems, setAllItems] = useState<Item[]>([]);
  const [allItemsComplete, setAllItemsComplete] = useState<Item[]>([]);
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [favoriteItems, setFavoriteItems] = useState<Set<string>>(new Set());
  const [craftRecipes, setCraftRecipes] = useState<Record<string, CraftRecipe>>({});
  const [dailyPlan, setDailyPlan] = useState<DailyPlanItem[]>([]);
  const [resourceRequirements, setResourceRequirements] = useState<ResourceRequirement[]>([]);
  const [localResourceQuantities, setLocalResourceQuantities] = useState<Record<string, number>>({});
  const [selectedLotSize, setSelectedLotSize] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedJobs, setSelectedJobs] = useState<Set<string>>(new Set());
  const [availableJobs, setAvailableJobs] = useState<string[]>([]);
  const [selectedResources, setSelectedResources] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [itemsLoading, setItemsLoading] = useState(true);
  
  const [floatingNotifications, setFloatingNotifications] = useState<Array<{
    id: string;
    x: number;
    y: number;
    text: string;
  }>>([]);
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  const [guestDialogOpen, setGuestDialogOpen] = useState(false);

  const lotSizes = [1, 10, 100, 1000];

  // Charger tous les items du JSON pour la recherche d'images
  const loadAllItemsComplete = useCallback(async () => {
    try {
      const { loadAllItemsFromJson } = await import('@/lib/jobs-utils');
      const itemsData = await loadAllItemsFromJson();
      
      // Convertir ItemDetail en Item pour la compatibilité
      const convertedItems: Item[] = itemsData.map(item => ({
        category: item.category,
        nom: item.nom,
        type: item.type,
        niveau: item.niveau,
        web_image_url: '', // Plus utilisé
        image_url: item.local_url
      }));
      
      setAllItemsComplete(convertedItems);
    } catch (error) {
      console.error('Erreur lors du chargement de tous les items:', error);
    }
  }, []);

  // Extraire tous les métiers disponibles depuis les recettes de craft
  const extractAvailableJobs = useCallback(() => {
    const jobsSet = new Set<string>();
    Object.values(craftRecipes).forEach(recipe => {
      if (recipe.has_recipe && recipe.job) {
        jobsSet.add(recipe.job);
      }
    });
    const jobsArray = Array.from(jobsSet).sort();
    setAvailableJobs(jobsArray);
    
    // Sélectionner tous les métiers par défaut
    setSelectedJobs(new Set(jobsArray));
  }, [craftRecipes]);

  // Charger les données de craft
  const loadCraftRecipes = useCallback(async () => {
    try {
      if (isGuest) {
        // Pour les invités, utiliser les données prédéfinies
        const guestCraftData: Record<string, CraftRecipe> = {};
        GUEST_CRAFT_ITEMS.forEach(item => {
          guestCraftData[item.itemName] = {
            category: item.category,
            has_recipe: true,
            job: item.job,
            job_level: item.job_level,
            ingredient_names: item.ingredient_names,
            ingredient_ids: item.ingredient_ids,
            quantities: item.quantities
          };
        });
        setCraftRecipes(guestCraftData);
      } else {
        const response = await fetch('/data/craft.json');
        const craftData = await response.json();
        setCraftRecipes(craftData);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des recettes de craft:', error);
    }
  }, [isGuest]);

  // Charger les favoris
  const loadFavorites = useCallback(async () => {
    if (!user) return;

    if (isGuest) {
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
  }, [user, isGuest]);

  // Charger tous les items favoris
  const loadAllItems = useCallback(async () => {
    setItemsLoading(true);
    try {
      const { loadAllItemsFromJson } = await import('@/lib/jobs-utils');
      const itemsData = await loadAllItemsFromJson();
      
      // Convertir ItemDetail en Item pour la compatibilité
      const convertedItems: Item[] = itemsData.map(item => ({
        category: item.category,
        nom: item.nom,
        type: item.type,
        niveau: item.niveau,
        web_image_url: '', // Plus utilisé
        image_url: item.local_url
      }));
      
      // Filtrer pour ne garder que les favoris (tous, pas seulement ceux qui ont une recette)
      const favoriteItemsList = convertedItems.filter(item => favoriteItems.has(item.nom));
      
      // Trier par nom
      const sortedItems = favoriteItemsList.sort((a, b) => a.nom.localeCompare(b.nom));
      
      setAllItems(sortedItems);
    } catch (error) {
      console.error('Erreur lors du chargement des items:', error);
    } finally {
      setItemsLoading(false);
    }
  }, [favoriteItems]);

  // Charger le plan journalier
  const loadDailyPlan = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      if (isGuest) {
        // Pour les invités, utiliser les données prédéfinies
        setDailyPlan(GUEST_DAILY_PLAN);
      } else {
        const dailyPlanRef = collection(db, "users", user.uid, "dailyPlan");
        const dailyPlanSnapshot = await getDocs(dailyPlanRef);
        const dailyPlanData: DailyPlanItem[] = [];
        
        dailyPlanSnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          // Utiliser l'ID du document Firestore et supprimer l'ancien champ id s'il existe
          const cleanData: Record<string, unknown> = { ...data };
          delete (cleanData as { id?: unknown }).id;
          dailyPlanData.push({ id: docSnap.id, ...(cleanData as Omit<DailyPlanItem, 'id'>) });
        });
        
        setDailyPlan(dailyPlanData);
      }
    } catch (error) {
      console.error("Erreur lors du chargement du plan journalier:", error);
    } finally {
      setLoading(false);
    }
  }, [user, isGuest]);

  // Calculer les ressources nécessaires
  const calculateResourceRequirements = useCallback(() => {
    const resourceMap = new Map<string, ResourceRequirement>();

    dailyPlan.forEach(planItem => {
      const recipe = craftRecipes[planItem.itemName];
      if (!recipe) return;

      // planItem.dailyQuantity représente déjà le nombre total d'items par jour
      const dailyProduction = planItem.dailyQuantity;

      // Utiliser les nouvelles propriétés de la structure JSON
      for (let i = 0; i < recipe.ingredient_names.length; i++) {
        const name = recipe.ingredient_names[i];
        const id = recipe.ingredient_ids[i];
        const quantityPerCraft = recipe.quantities[i];
        
        const totalQuantityNeeded = quantityPerCraft * dailyProduction;

        if (resourceMap.has(id.toString())) {
          const existing = resourceMap.get(id.toString())!;
          existing.totalQuantity += totalQuantityNeeded;
          existing.recipes.push({
            craftName: planItem.itemName,
            quantityNeeded: totalQuantityNeeded,
            dailyProduction
          });
        } else {
          // Chercher l'image de la ressource dans tous les items du JSON
          const resourceItem = allItemsComplete.find(item => item.nom === name);
          const imageUrl = resourceItem?.image_url;

          // Vérifier si cette ressource est craftable
          const isCraftable = craftRecipes[name]?.has_recipe || false;
          
          // Calculer la chaîne d'ingrédients si c'est craftable
          let ingredientChain: Array<{
            name: string;
            quantity: number;
            image_url?: string;
            isCraftable: boolean;
          }> = [];

          if (isCraftable) {
            const resourceRecipe = craftRecipes[name];
            ingredientChain = resourceRecipe.ingredient_names.map((ingName, ingIndex) => {
              const ingItem = allItemsComplete.find(item => item.nom === ingName);
              const ingImageUrl = ingItem?.image_url;
              const ingIsCraftable = craftRecipes[ingName]?.has_recipe || false;
              
              return {
                name: ingName,
                quantity: resourceRecipe.quantities[ingIndex] * totalQuantityNeeded,
                image_url: ingImageUrl,
                isCraftable: ingIsCraftable
              };
            });
          }

          resourceMap.set(id.toString(), {
            id: id.toString(),
            name,
            totalQuantity: totalQuantityNeeded,
            image_url: imageUrl,
            isCraftable,
            ingredientChain,
            recipes: [{
              craftName: planItem.itemName,
              quantityNeeded: totalQuantityNeeded,
              dailyProduction
            }]
          });
        }
      }
    });

    const resources = Array.from(resourceMap.values())
      .sort((a, b) => b.totalQuantity - a.totalQuantity);
    
    setResourceRequirements(resources);
  }, [dailyPlan, craftRecipes, allItemsComplete]);

  // Ajouter un item au plan journalier
  const addToDailyPlan = async (item: Item, event: React.MouseEvent) => {
    if (!user) return;

    if (isGuest) {
      setGuestDialogOpen(true);
      return;
    }

    // Vérifier si l'item existe déjà dans le plan
    const existingItemIndex = dailyPlan.findIndex(planItem => 
      planItem.itemName === item.nom
    );

    if (existingItemIndex !== -1) {
      // L'item existe déjà, augmenter la quantité
      const existingItem = dailyPlan[existingItemIndex];
      const newQuantity = existingItem.dailyQuantity + selectedLotSize;
      
      try {
        // S'assurer que nous utilisons bien l'ID du document Firestore
        const planItemRef = doc(db, "users", user.uid, "dailyPlan", existingItem.id);
        await updateDoc(planItemRef, { dailyQuantity: newQuantity });
        
        setDailyPlan(prev => prev.map((planItem, index) => 
          index === existingItemIndex 
            ? { ...planItem, dailyQuantity: newQuantity }
            : planItem
        ));

        // Notification de mise à jour
        const notificationId = Date.now().toString();
        const newNotification = {
          id: notificationId,
          x: event.clientX,
          y: event.clientY,
          text: `+${selectedLotSize} (Total: ${newQuantity})`,
        };
        setFloatingNotifications(prev => [...prev, newNotification]);
        setTimeout(() => {
          setFloatingNotifications(prev => prev.filter(notif => notif.id !== notificationId));
        }, 2000);

        return;
      } catch (error) {
        console.error("Erreur lors de la mise à jour de la quantité:", error);
        return;
      }
    }

    // Vérifier si l'item a une recette de craft
    if (!craftRecipes[item.nom] || !craftRecipes[item.nom].has_recipe) {
      // Notification d'info (pas d'erreur)
      const notificationId = Date.now().toString();
      const newNotification = {
        id: notificationId,
        x: event.clientX,
        y: event.clientY,
        text: "Item ajouté (pas de recette)",
      };
      setFloatingNotifications(prev => [...prev, newNotification]);
      setTimeout(() => {
        setFloatingNotifications(prev => prev.filter(notif => notif.id !== notificationId));
      }, 2000);
    }

    // Créer un nouvel item dans le plan - ne pas inclure d'ID ici car Firestore le génèrera
    const dailyPlanItem = {
      itemName: item.nom,
      itemImage: item.image_url,
      category: item.category,
      type: item.type,
      dailyQuantity: selectedLotSize, // Utiliser la taille de lot sélectionnée
      lotSize: selectedLotSize,
    };

    try {
      const dailyPlanRef = collection(db, "users", user.uid, "dailyPlan");
      const docRef = await addDoc(dailyPlanRef, dailyPlanItem);
      
      // Utiliser l'ID généré par Firestore
      setDailyPlan(prev => [...prev, { ...dailyPlanItem, id: docRef.id }]);

      // Notification de succès
      const notificationId = Date.now().toString();
      const newNotification = {
        id: notificationId,
        x: event.clientX,
        y: event.clientY,
        text: `+${selectedLotSize} ajouté au plan`,
      };
      setFloatingNotifications(prev => [...prev, newNotification]);
      setTimeout(() => {
        setFloatingNotifications(prev => prev.filter(notif => notif.id !== notificationId));
      }, 2000);

    } catch (error) {
      console.error("Erreur lors de l'ajout au plan journalier:", error);
    }
  };

  // Mettre à jour la quantité d'un item dans le plan
  const updateDailyQuantity = async (planItemId: string, newQuantity: number) => {
    if (!user || isGuest) return;

    if (newQuantity <= 0) {
      // Au lieu de supprimer, mettre la quantité à 1
      newQuantity = 1;
    }

    try {
      const planItemRef = doc(db, "users", user.uid, "dailyPlan", planItemId);
      await updateDoc(planItemRef, { dailyQuantity: newQuantity });
      
      setDailyPlan(prev => 
        prev.map(item => 
          item.id === planItemId 
            ? { ...item, dailyQuantity: newQuantity }
            : item
        )
      );
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la quantité:", error);
    }
  };

  // Supprimer un item du plan
  const removePlanItem = async (planItemId: string) => {
    if (!user || isGuest) return;

    try {
      const planItemRef = doc(db, "users", user.uid, "dailyPlan", planItemId);
      await deleteDoc(planItemRef);
      
      setDailyPlan(prev => prev.filter(item => item.id !== planItemId));
    } catch (error) {
      console.error("Erreur lors de la suppression du plan item:", error);
    }
  };

  // Effets
  useEffect(() => {
    loadCraftRecipes();
    loadFavorites();
    loadAllItemsComplete();
  }, [loadCraftRecipes, loadFavorites, loadAllItemsComplete]);

  useEffect(() => {
    if (favoriteItems.size > 0) {
      loadAllItems();
    }
  }, [favoriteItems, loadAllItems]);

  useEffect(() => {
    loadDailyPlan();
  }, [loadDailyPlan]);

  useEffect(() => {
    extractAvailableJobs();
  }, [extractAvailableJobs]);

  // Filtrer les items selon la recherche et les métiers sélectionnés
  useEffect(() => {
    if (searchTerm.trim() === "" && selectedJobs.size === 0) {
      // Si aucun filtre n'est appliqué, ne rien afficher
      setFilteredItems([]);
      return;
    }

    const filtered = allItems.filter(item => {
      const recipe = craftRecipes[item.nom];
      if (!recipe || !recipe.has_recipe || !recipe.job) {
        return false;
      }

      // Vérifier que le métier de l'item est dans la sélection
      if (selectedJobs.size > 0 && !selectedJobs.has(recipe.job)) {
        return false;
      }

      // Vérifier le terme de recherche
      if (searchTerm.trim() !== "") {
        return (
          item.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.category.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      return true;
    });
    
    setFilteredItems(filtered);
  }, [allItems, searchTerm, craftRecipes, selectedJobs]);

  useEffect(() => {
    calculateResourceRequirements();
  }, [calculateResourceRequirements]);

  // Toggle la sélection d'un métier
  const toggleJobSelection = (job: string) => {
    setSelectedJobs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(job)) {
        newSet.delete(job);
      } else {
        newSet.add(job);
      }
      return newSet;
    });
  };

  // Sélectionner tous les métiers
  const selectAllJobs = () => {
    setSelectedJobs(new Set(availableJobs));
  };

  // Désélectionner tous les métiers
  const deselectAllJobs = () => {
    setSelectedJobs(new Set());
  };

  // Toggle la sélection d'une ressource
  const toggleResourceSelection = (resourceId: string) => {
    setSelectedResources(prev => {
      const newSet = new Set(prev);
      if (newSet.has(resourceId)) {
        newSet.delete(resourceId);
      } else {
        newSet.add(resourceId);
      }
      return newSet;
    });
  };

  // Mettre à jour la quantité locale d'une ressource
  const updateLocalResourceQuantity = (resourceId: string, newQuantity: number) => {
    if (newQuantity < 0) return;
    
    setLocalResourceQuantities(prev => ({
      ...prev,
      [resourceId]: newQuantity
    }));
  };

  // Obtenir la quantité finale d'une ressource (quantité nécessaire - stock local)
  const getFinalResourceQuantity = (resourceId: string, baseQuantity: number) => {
    const localQuantity = localResourceQuantities[resourceId] || 0;
    return Math.max(0, baseQuantity - localQuantity);
  };

  return (
    <div className="min-h-screen p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Calendar className="h-8 w-8" />
            Plan Journalier
          </h1>
          <p className="text-muted-foreground">
            Planifiez votre production quotidienne et calculez les ressources nécessaires
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setHelpDialogOpen(true)}>
          <HelpCircle className="h-4 w-4 mr-2" />
          Aide
        </Button>
      </div>

      {/* Carte des items favoris craftables */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Items Favoris Craftables
          </CardTitle>
          <CardDescription>
            Sélectionnez les items que vous voulez ajouter à votre plan journalier. Les badges +1, +10, +100, +1000 facilitent l&apos;ajout des quantités.
            {filteredItems.length > 0 && (
              <span className="ml-2 text-sm font-medium">
                ({filteredItems.length} favori{filteredItems.length > 1 ? 's' : ''} affiché{filteredItems.length > 1 ? 's' : ''})
              </span>
            )}
          </CardDescription>
          <div className="mb-6">
            {/* Barre de recherche */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher parmi vos favoris..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Filtre par métier */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Filtrer par métier</label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={selectAllJobs}
                    className="text-xs"
                  >
                    Tout sélectionner
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={deselectAllJobs}
                    className="text-xs"
                  >
                    Tout désélectionner
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {availableJobs.map((job) => (
                  <Button
                    key={job}
                    variant="outline"
                    size="sm"
                    onClick={() => toggleJobSelection(job)}
                    className={`text-xs ${selectedJobs.has(job) ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/90 hover:text-secondary-foreground"}`}
                  >
                    {job}
                  </Button>
                ))}
              </div>
            </div>
            
            {/* Sélecteur de taille de lot pour faciliter l'ajout */}
            <div>
              <label className="text-sm font-medium mb-2 block">Quantité à ajouter</label>
              <div className="flex gap-2">
                {lotSizes.map((size) => (
                  <Button
                    key={size}
                    variant={selectedLotSize === size ? "default" : "outline"}
                    onClick={() => setSelectedLotSize(size)}
                  >
                    +{size}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {itemsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">Chargement des items...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-8">
              <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm.trim() !== "" || selectedJobs.size > 0
                  ? `Aucun favori trouvé pour les critères sélectionnés.`
                  : "Aucun favori trouvé"
                }
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {selectedJobs.size === 0 
                  ? "Sélectionnez au moins un métier pour voir les items craftables"
                  : "Essayez de modifier vos filtres ou ajoutez des favoris dans la page \"Items\""
                }
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[330px]">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredItems.slice(0, 200).map((item, index) => (
                  <Card 
                    key={index} 
                    className="hover:shadow-lg hover:bg-secondary transition-all cursor-pointer h-35 py-0 justify-center relative"
                    onClick={(e) => addToDailyPlan(item, e)}
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
                          <p className="text-sm font-medium break-words">{item.nom}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs border border-popover">
                              {item.type === "Essence de gardien de donjon" ? "Essence de Gardien" : item.type}
                            </Badge>
                          </div>
                          <div className="flex gap-1 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {craftRecipes[item.nom]?.has_recipe ? craftRecipes[item.nom].job : 'Pas de recette'}
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

      {/* Carte du plan de production journalier */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Production Journalière
          </CardTitle>
          <CardDescription>
            Items que vous prévoyez de crafter chaque jour
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">Chargement du plan...</p>
            </div>
          ) : dailyPlan.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Aucun item dans votre plan journalier</p>
              <p className="text-sm text-muted-foreground mt-2">
                Ajoutez des items depuis la section au-dessus
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                {dailyPlan.map((planItem) => (
                  <Card key={planItem.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center border border-popover-foreground">
                            {planItem.itemImage ? (
                              <img
                                src={planItem.itemImage}
                                alt={planItem.itemName}
                                className="w-10 h-10 object-contain"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-muted-foreground/20 rounded" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-medium">{planItem.itemName}</h3>
                            <p className="text-sm text-muted-foreground">{planItem.type}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min="1"
                              value={planItem.dailyQuantity || ''}
                              onChange={(e) => {
                                const inputValue = e.target.value;
                                // Permettre la valeur vide
                                if (inputValue === '') {
                                  setDailyPlan(prev => 
                                    prev.map(item => 
                                      item.id === planItem.id 
                                        ? { ...item, dailyQuantity: 0 }
                                        : item
                                    )
                                  );
                                  return;
                                }
                                
                                const newValue = parseInt(inputValue);
                                // Empêcher les valeurs négatives ou NaN
                                if (isNaN(newValue) || newValue < 1) return;
                                
                                // Mettre à jour localement sans sauvegarder
                                setDailyPlan(prev => 
                                  prev.map(item => 
                                    item.id === planItem.id 
                                      ? { ...item, dailyQuantity: newValue }
                                      : item
                                  )
                                );
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  if (!planItem.dailyQuantity || planItem.dailyQuantity < 1) {
                                    // Afficher une erreur si la valeur est invalide
                                    alert('La quantité doit être supérieure à 0');
                                    return;
                                  }
                                  updateDailyQuantity(planItem.id, planItem.dailyQuantity);
                                }
                              }}
                              className="w-26 text-center"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (!planItem.dailyQuantity || planItem.dailyQuantity < 1) {
                                  // Afficher une erreur si la valeur est invalide
                                  alert('La quantité doit être supérieure à 0');
                                  return;
                                }
                                updateDailyQuantity(planItem.id, planItem.dailyQuantity);
                              }}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="text-right">
                            <div className="font-medium">
                              {planItem.dailyQuantity} items
                            </div>
                          </div>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removePlanItem(planItem.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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

      {/* Carte des ressources nécessaires */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Ressources Nécessaires
          </CardTitle>
          <CardDescription>
            Quantités totales de ressources à collecter pour votre production journalière
          </CardDescription>
        </CardHeader>
        <CardContent>
          {resourceRequirements.length === 0 ? (
            <div className="text-center py-8">
              <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Aucune ressource calculée</p>
              <p className="text-sm text-muted-foreground mt-2">
                Ajoutez des items à votre plan journalier
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
                {resourceRequirements.map((resource) => (
                  <Card 
                    key={resource.id} 
                    className={`hover:shadow-lg hover:bg-secondary transition-all h-25 py-0 justify-center relative ${
                      resource.isCraftable ? 'cursor-pointer' : 'cursor-default'
                    } ${
                      selectedResources.has(resource.id) ? 'border-primary' : ''
                    }`}
                    onClick={resource.isCraftable ? () => toggleResourceSelection(resource.id) : undefined}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center border border-popover-foreground">
                          {resource.image_url ? (
                            <img 
                              src={resource.image_url} 
                              alt={resource.name}
                              className="w-10 h-10 object-contain"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-10 h-10 bg-muted-foreground/20 rounded" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 mt-2">
                          <h3 className="font-medium break-words">{resource.name}</h3>
                          <div className="flex flex-row justify-between">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="text-sm text-muted-foreground">Stock local:</div>
                              <Input
                                type="number"
                                min="0"
                                value={localResourceQuantities[resource.id] || ''}
                                onChange={(e) => {
                                  const inputValue = e.target.value;
                                  if (inputValue === '') {
                                    updateLocalResourceQuantity(resource.id, 0);
                                    return;
                                  }
                                  const newValue = parseInt(inputValue);
                                  if (!isNaN(newValue) && newValue >= 0) {
                                    updateLocalResourceQuantity(resource.id, newValue);
                                  }
                                }}
                                className="w-20 text-center text-xs"
                                placeholder="0"
                              />
                            </div>
                            <div className="text-lg font-bold text-primary">
                            {getFinalResourceQuantity(resource.id, resource.totalQuantity).toLocaleString()}
                          </div>
                          </div>
                          {localResourceQuantities[resource.id] > 0 && (
                            <div className="text-xs text-muted-foreground text-right">
                              -{localResourceQuantities[resource.id].toLocaleString()} du stock
                            </div>
                          )}
                        </div>
                        {resource.isCraftable && (
                          <Badge 
                            variant={selectedResources.has(resource.id) ? "default" : "secondary"} 
                            className="text-xs absolute left-1/2 -translate-x-1/2 bottom-[-8]"
                          >
                            {selectedResources.has(resource.id) ? "À fabriquer" : "Craftable"}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Carte Chaînes de Fabrication - Chaînes de craft */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Chaînes de Fabrication
          </CardTitle>
          <CardDescription>
            Détail des ingrédients nécessaires pour fabriquer les ressources sélectionnées
          </CardDescription>
        </CardHeader>
        <CardContent>
          {resourceRequirements.filter(r => r.isCraftable && r.ingredientChain && r.ingredientChain.length > 0 && selectedResources.has(r.id) && getFinalResourceQuantity(r.id, r.totalQuantity) > 0).length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Aucune chaîne de fabrication à afficher</p>
              <p className="text-sm text-muted-foreground mt-2">
                Sélectionnez des ressources craftables dans la section &quot;Ressources Nécessaires&quot;
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                {resourceRequirements
                  .filter(r => r.isCraftable && r.ingredientChain && r.ingredientChain.length > 0 && selectedResources.has(r.id) && getFinalResourceQuantity(r.id, r.totalQuantity) > 0)
                  .map((resource) => (
                    <Card key={`super-${resource.id}`} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="mb-3">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center border border-popover-foreground">
                              {resource.image_url ? (
                                <img 
                                  src={resource.image_url} 
                                  alt={resource.name}
                                  className="w-8 h-8 object-contain"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              ) : (
                                <div className="w-8 h-8 bg-muted-foreground/20 rounded" />
                              )}
                            </div>
                            <div>
                              <h3 className="font-medium">{resource.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                {getFinalResourceQuantity(resource.id, resource.totalQuantity).toLocaleString()} items nécessaires
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-muted-foreground">Ingrédients à collecter :</p>
                          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                            {(() => {
                              const neededAfterStock = getFinalResourceQuantity(resource.id, resource.totalQuantity);
                              const multiplier = resource.totalQuantity > 0 ? (neededAfterStock / resource.totalQuantity) : 0;
                              return resource.ingredientChain!
                                .map((ingredient) => ({
                                  ...ingredient,
                                  adjustedQuantity: Math.ceil(ingredient.quantity * multiplier),
                                }))
                                .filter((ingredient) => ingredient.adjustedQuantity > 0)
                                .map((ingredient, index) => (
                                  <div key={index} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center border border-popover-foreground">
                                      {ingredient.image_url ? (
                                        <img 
                                          src={ingredient.image_url} 
                                          alt={ingredient.name}
                                          className="w-6 h-6 object-contain"
                                          onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                          }}
                                        />
                                      ) : (
                                        <div className="w-6 h-6 bg-muted-foreground/20 rounded" />
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium break-words">{ingredient.name}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {ingredient.adjustedQuantity.toLocaleString()} items
                                      </p>
                                    </div>
                                  </div>
                                ));
                            })()}
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

      {/* Carte Bilan des courses - Tous les ingrédients nécessaires */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Bilan des Courses
          </CardTitle>
          <CardDescription>
            Liste complète de tous les ingrédients à collecter : ressources non craftables + ingrédients des chaînes de fabrication
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(() => {
            // Collecter tous les ingrédients uniques
            const allIngredients = new Map<string, {
              name: string;
              totalQuantity: number;
              image_url?: string;
              isCraftable: boolean;
              sources: string[];
            }>();

            // Pré-calculer les besoins ajustés après stock pour chaque ressource
            const adjustedNeeds = new Map<string, number>();
            resourceRequirements.forEach((r) => {
              adjustedNeeds.set(r.id, getFinalResourceQuantity(r.id, r.totalQuantity));
            });

            // Ajouter les ressources non craftables
            resourceRequirements
              .filter(r => !r.isCraftable)
              .forEach(resource => {
                const finalQuantity = adjustedNeeds.get(resource.id) ?? resource.totalQuantity;
                if (finalQuantity > 0) {
                  allIngredients.set(resource.name, {
                    name: resource.name,
                    totalQuantity: finalQuantity,
                    image_url: resource.image_url,
                    isCraftable: false,
                    sources: resource.recipes.map(r => r.craftName)
                  });
                }
              });

            // Ajouter les ingrédients des chaînes de fabrication sélectionnées
            resourceRequirements
              .filter(r => r.isCraftable && selectedResources.has(r.id) && r.ingredientChain)
              .forEach(resource => {
                const neededAfterStock = adjustedNeeds.get(resource.id) ?? resource.totalQuantity;
                if (neededAfterStock <= 0 || resource.totalQuantity <= 0) return;
                const multiplier = neededAfterStock / resource.totalQuantity;

                resource.ingredientChain!.forEach(ingredient => {
                  // Quantité ajustée pour l'ingrédient en fonction du besoin réel après stock
                  let adjustedQuantity = Math.ceil(ingredient.quantity * multiplier);

                  // Si l'ingrédient existe aussi comme ressource principale, appliquer son stock propre
                  const existingResource = resourceRequirements.find(r => r.name === ingredient.name);
                  if (existingResource) {
                    adjustedQuantity = getFinalResourceQuantity(existingResource.id, adjustedQuantity);
                  }

                  if (adjustedQuantity > 0) {
                    if (allIngredients.has(ingredient.name)) {
                      const existing = allIngredients.get(ingredient.name)!;
                      existing.totalQuantity += adjustedQuantity;
                      existing.sources.push(...resource.recipes.map(r => r.craftName));
                    } else {
                      allIngredients.set(ingredient.name, {
                        name: ingredient.name,
                        totalQuantity: adjustedQuantity,
                        image_url: ingredient.image_url,
                        isCraftable: ingredient.isCraftable,
                        sources: resource.recipes.map(r => r.craftName)
                      });
                    }
                  }
                });
              });

            // Ajouter les ressources craftables non sélectionnées (comme la Levure de Boulanger)
            resourceRequirements
              .filter(r => r.isCraftable && !selectedResources.has(r.id))
              .forEach(resource => {
                const finalQuantity = adjustedNeeds.get(resource.id) ?? resource.totalQuantity;
                if (finalQuantity > 0) {
                  allIngredients.set(resource.name, {
                    name: resource.name,
                    totalQuantity: finalQuantity,
                    image_url: resource.image_url,
                    isCraftable: true,
                    sources: resource.recipes.map(r => r.craftName)
                  });
                }
              });

            const ingredientsList = Array.from(allIngredients.values())
              .sort((a, b) => b.totalQuantity - a.totalQuantity);

            return ingredientsList.length === 0 ? (
              <div className="text-center py-8">
                <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Aucun ingrédient à collecter</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Ajoutez des items à votre plan journalier
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {ingredientsList.map((ingredient, index) => (
                    <Card key={index} className="hover:shadow-lg hover:bg-secondary transition-all h-25 py-0 justify-center relative">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center border border-popover-foreground">
                            {ingredient.image_url ? (
                              <img 
                                src={ingredient.image_url} 
                                alt={ingredient.name}
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
                            <h3 className="font-medium break-words">{ingredient.name}</h3>
                            <div className="text-lg font-bold mt-2 text-primary">
                              {ingredient.totalQuantity.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            );
          })()}
        </CardContent>
      </Card>

      {/* Notifications flottantes */}
      {floatingNotifications.map((notification) => (
        <div
          key={notification.id}
          className="fixed z-50 bg-green-500 text-white px-3 py-1 rounded-md text-sm font-medium pointer-events-none animate-fade-up"
          style={{
            left: notification.x - 50,
            top: notification.y - 40,
            animation: "fadeUpAndOut 2s ease-out forwards",
          }}
        >
          {notification.text}
        </div>
      ))}

      {/* Dialog d'aide personnalisé */}
      <HelpDialog open={helpDialogOpen} onOpenChange={setHelpDialogOpen}>
        <HelpDialogContent>
          <HelpDialogHeader>
            <HelpDialogTitle>Plan Journalier - Aide</HelpDialogTitle>
          </HelpDialogHeader>

          <div className="space-y-6">
            <div className="text-sm space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Vue d&apos;ensemble</h3>
                <p>Cette page vous permet de planifier votre production quotidienne de crafts et de calculer automatiquement les ressources nécessaires.</p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Items Favoris Craftables</h3>
                <p>Cette section affiche tous vos items favoris qui peuvent être craftés. Sélectionnez la taille de lot souhaitée puis cliquez sur un item pour l&apos;ajouter à votre plan.</p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Production Journalière</h3>
                <p>Gérez ici les items que vous voulez crafter chaque jour. Ajustez les quantités directement dans l&apos;input puis cliquez sur le bouton de validation (✓) pour sauvegarder.</p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Ressources Nécessaires</h3>
                <p>Cette section calcule automatiquement toutes les ressources dont vous avez besoin pour votre production journalière, triées par quantité décroissante.</p>
              </div>
            </div>
          </div>

          <HelpDialogFooter>
            <HelpDialogCancel>Fermer</HelpDialogCancel>
          </HelpDialogFooter>
        </HelpDialogContent>
      </HelpDialog>

      <GuestAuthDialog
        open={guestDialogOpen}
        onOpenChange={setGuestDialogOpen}
      />

      <style jsx>{`
        @keyframes fadeUpAndOut {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          20% {
            opacity: 1;
            transform: translateY(-10px);
          }
          80% {
            opacity: 1;
            transform: translateY(-10px);
          }
          100% {
            opacity: 0;
            transform: translateY(-30px);
          }
        }
      `}</style>
    </div>
  );
}
