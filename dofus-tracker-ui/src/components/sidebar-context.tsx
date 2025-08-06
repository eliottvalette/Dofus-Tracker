"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface Category {
  id: string;
  name: string;
}

interface Item {
  id: string;
  name: string;
}

interface SidebarContextType {
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  selectedCategory: string | null;
  setSelectedCategory: (v: string | null) => void;
  selectedCategories: string[];
  setSelectedCategories: (v: string[]) => void;
  selectedItems: string[];
  setSelectedItems: (v: string[]) => void;
  categories: Category[];
  setCategories: (v: Category[]) => void;
  items: Item[];
  setItems: (v: Item[]) => void;
  clearFilters: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({
  children,
  initialCategories = [],
  initialItems = [],
  initialSelectedItems = [],
}: {
  children: ReactNode;
  initialCategories?: Category[];
  initialItems?: Item[];
  initialSelectedItems?: string[];
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>(initialSelectedItems);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [items, setItems] = useState<Item[]>(initialItems);

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory(null);
    setSelectedCategories([]);
    setSelectedItems([]);
  };

  return (
    <SidebarContext.Provider
      value={{
        searchTerm,
        setSearchTerm,
        selectedCategory,
        setSelectedCategory,
        selectedCategories,
        setSelectedCategories,
        selectedItems,
        setSelectedItems,
        categories,
        setCategories,
        items,
        setItems,
        clearFilters,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebarContext() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebarContext must be used within SidebarProvider");
  return ctx;
} 