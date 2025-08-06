"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sword, Shield, TestTube, Gem, Search, Filter } from "lucide-react";
import { useState, useEffect } from "react";

interface Item {
  nom: string;
  type: string;
  niveau: string;
  image_url: string;
}

export default function Home() {
  const [items, setItems] = useState<Item[]>([]);
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("armes");
  const [selectedType, setSelectedType] = useState("");
  const [loading, setLoading] = useState(true);

  const categories = [
    { id: "armes", name: "Armes", icon: Sword, color: "bg-red-500" },
    { id: "equipements", name: "Équipements", icon: Shield, color: "bg-blue-500" },
    { id: "consommables", name: "Consommables", icon: TestTube, color: "bg-green-500" },
    { id: "ressources", name: "Ressources", icon: Gem, color: "bg-yellow-500" },
  ];

  useEffect(() => {
    loadItems(selectedCategory);
  }, [selectedCategory]);

  useEffect(() => {
    filterItems();
  }, [items, searchTerm, selectedType]);

  const loadItems = async (category: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/data/${category}_data.csv`);
      const csvText = await response.text();
      const lines = csvText.split('\n').slice(1); // Skip header
      
      const parsedItems: Item[] = lines
        .filter(line => line.trim())
        .map(line => {
          const [nom, type, niveau, image_url] = line.split(',').map(field => 
            field.replace(/^"|"$/g, '') // Remove quotes
          );
          return { nom, type, niveau, image_url };
        });
      
      setItems(parsedItems);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterItems = () => {
    let filtered = items;

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedType) {
      filtered = filtered.filter(item => item.type === selectedType);
    }

    setFilteredItems(filtered);
  };

  const getUniqueTypes = () => {
    return [...new Set(items.map(item => item.type))];
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dofus Tracker</h1>
          <p className="text-muted-foreground">
            Naviguez dans la base de données des items Dofus
          </p>
        </div>

        {/* Category Selection */}
        <div className="grid gap-4 md:grid-cols-4">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <Card 
                key={category.id}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  selectedCategory === category.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedCategory(category.id)}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{category.name}</CardTitle>
                  <div className={`p-2 rounded-full ${category.color}`}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {loading ? "..." : items.length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    items disponibles
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Recherche et filtres</CardTitle>
            <CardDescription>
              Trouvez rapidement les items que vous cherchez
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un item..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtres
                </Button>
              </div>
            </div>
            
            {/* Type Filter */}
            {!loading && (
              <div className="flex flex-wrap gap-2">
                <Badge 
                  variant={selectedType === "" ? "default" : "secondary"}
                  className="cursor-pointer"
                  onClick={() => setSelectedType("")}
                >
                  Tous les types
                </Badge>
                {getUniqueTypes().map((type) => (
                  <Badge 
                    key={type}
                    variant={selectedType === type ? "default" : "secondary"}
                    className="cursor-pointer"
                    onClick={() => setSelectedType(type)}
                  >
                    {type}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Items Grid */}
        <Card>
          <CardHeader>
            <CardTitle>Items ({filteredItems.length})</CardTitle>
            <CardDescription>
              {selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} disponibles
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-2">Chargement...</p>
              </div>
            ) : (
              <ScrollArea className="h-[600px]">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredItems.map((item, index) => (
                    <Card key={index} className="hover:shadow-lg transition-all cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
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
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
