import { Search, X } from "lucide-react"

import { Label } from "@/components/ui/label"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarInput,
} from "@/components/ui/sidebar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"

export interface SearchFormProps extends React.ComponentProps<"form"> {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  selectedCategories: string[];
  setSelectedCategories: (categories: string[]) => void;
  selectedItems: string[];
  setSelectedItems: (items: string[]) => void;
  categories: { id: string; name: string }[];
  items: { id: string; name: string }[];
}

export function SearchForm({ 
  searchTerm,
  setSearchTerm,
  selectedCategories,
  setSelectedCategories,
  selectedItems,
  setSelectedItems,
  categories,
  items,
  ...props 
}: SearchFormProps) {
  // Toggle category selection
  const toggleCategory = (categoryId: string) => {
    if (selectedCategories.includes(categoryId)) {
      setSelectedCategories(selectedCategories.filter(id => id !== categoryId));
    } else {
      setSelectedCategories([...selectedCategories, categoryId]);
    }
  };

  // Remove a single category
  const removeCategory = (categoryId: string) => {
    setSelectedCategories(selectedCategories.filter(id => id !== categoryId));
  };

  // Toggle item selection
  const toggleItem = (itemId: string) => {
    if (selectedItems.includes(itemId)) {
      setSelectedItems(selectedItems.filter(id => id !== itemId));
    } else {
      setSelectedItems([...selectedItems, itemId]);
    }
  };

  // Remove a single item
  const removeItem = (itemId: string) => {
    setSelectedItems(selectedItems.filter(id => id !== itemId));
  };

  return (
    <form {...props}>
      
      <SidebarGroup>
        <SidebarGroupContent className="relative">
          <Label htmlFor="search" className="sr-only">
            Recherche
          </Label>
          <SidebarInput
            id="search"
            placeholder="Rechercher..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 select-none opacity-50" />
        </SidebarGroupContent>
         <div className="text-xs text-muted-foreground mt-1 px-1">
            Recherche simultanée dans: mémos, items et matières
          </div>
      </SidebarGroup>

      <SidebarGroup>
        <SidebarGroupContent>
          <Label htmlFor="category" className="text-sm font-medium mb-1 block">
            Matières (sélection multiple)
          </Label>
          <Select 
            value="_select"
            onValueChange={(value) => {
              if (value === "_all") {
                setSelectedCategories([]);
              } else if (value !== "_select") {
                toggleCategory(value);
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Toutes les matières">
                {selectedCategories.length > 0 
                  ? `${selectedCategories.length} matière(s) sélectionnée(s)` 
                  : "Toutes les matières"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Effacer la sélection</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id} className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      checked={selectedCategories.includes(category.id)} 
                      onCheckedChange={() => toggleCategory(category.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    {category.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {selectedCategories.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {selectedCategories.map(catId => {
                const category = categories.find(c => c.id === catId);
                return category ? (
                  <Badge key={catId} variant="secondary" className="flex items-center gap-1">
                    {category.name}
                    <button 
                      type="button" 
                      onClick={() => removeCategory(catId)}
                      className="rounded-full h-4 w-4 inline-flex items-center justify-center"
                    >
                      <X size={12} />
                    </button>
                  </Badge>
                ) : null;
              })}
            </div>
          )}
        </SidebarGroupContent>
      </SidebarGroup>

      <SidebarGroup>
        <SidebarGroupContent>
          <Label htmlFor="item" className="text-sm font-medium mb-1 block">
            Items (sélection multiple)
          </Label>
          <Select 
            value="_select"
            onValueChange={(value) => {
              if (value === "_all") {
                setSelectedItems([]);
              } else if (value !== "_select") {
                toggleItem(value);
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Tous les items">
                {selectedItems.length > 0 
                  ? `${selectedItems.length} item(s) sélectionné(s)` 
                  : "Tous les items"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Effacer la sélection</SelectItem>
              {items.map((item) => (
                <SelectItem key={item.id} value={item.id} className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      checked={selectedItems.includes(item.id)} 
                      onCheckedChange={() => toggleItem(item.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  {item.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {selectedItems.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {selectedItems.map(itemId => {
                const item = items.find(i => i.id === itemId);
                return item ? (
                  <Badge key={itemId} variant="secondary" className="flex items-center gap-1">
                    {item.name}
                    <button 
                      type="button" 
                      onClick={() => removeItem(itemId)}
                      className="rounded-full h-4 w-4 inline-flex items-center justify-center"
                    >
                      <X size={12} />
                    </button>
                  </Badge>
                ) : null;
              })}
            </div>
          )}
        </SidebarGroupContent>
      </SidebarGroup>

      <SidebarGroup>
        <SidebarGroupContent>
          <Button 
            type="button" 
            variant="outline" 
            className="w-full"
            onClick={() => {
              setSearchTerm("");
              setSelectedCategories([]);
              setSelectedItems([]);
            }}
          >
            Réinitialiser les filtres
          </Button>
        </SidebarGroupContent>
      </SidebarGroup>
    </form>
  )
}
