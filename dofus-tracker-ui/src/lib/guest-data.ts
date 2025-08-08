// Données prédéfinies pour les utilisateurs invités

export interface GuestFavoriteItem {
  itemName: string;
  category: string;
  type: string;
  niveau: string;
  image_url: string;
  createdAt: Date;
}

export interface GuestSaleItem {
  id: string;
  itemName: string;
  itemImage?: string;
  category: string;
  type: string;
  quantity: number;
  price: number;
  date: string;
  createdAt: Date;
  status: "pending" | "sold" | "local_sold";
  soldDate?: string;
  soldAt?: Date;
}

// 5 favoris prédéfinis
export const GUEST_FAVORITES: GuestFavoriteItem[] = [
  {
    itemName: "Aiguilles et Fil",
    category: "ressources",
    type: "Matériel",
    niveau: "Niv. 1",
    image_url: "/images/20004.w40h40.png",
    createdAt: new Date("2024-01-15")
  },
  {
    itemName: "Le Bâton d'Amour",
    category: "armes",
    type: "Bâton",
    niveau: "Niv. 50",
    image_url: "/images/20008.w40h40.png",
    createdAt: new Date("2024-01-16")
  },
  {
    itemName: "Lame de chasse",
    category: "armes",
    type: "Épée",
    niveau: "Niv. 25",
    image_url: "/images/20016.w40h40.png",
    createdAt: new Date("2024-01-17")
  },
  {
    itemName: "Lance de Chasse",
    category: "armes",
    type: "Lance",
    niveau: "Niv. 25",
    image_url: "/images/20017.w40h40.png",
    createdAt: new Date("2024-01-18")
  },
  {
    itemName: "Baguette de Chasse",
    category: "armes",
    type: "Baguette",
    niveau: "Niv. 25",
    image_url: "/images/3001.w40h40.png",
    createdAt: new Date("2024-01-19")
  }
];

// 5 ventes en cours prédéfinies
export const GUEST_PENDING_SALES: GuestSaleItem[] = [
  {
    id: "guest_pending_1",
    itemName: "Aiguilles et Fil",
    itemImage: "/images/20004.w40h40.png",
    category: "ressources",
    type: "Matériel",
    quantity: 3,
    price: 100,
    date: "2024-01-20",
    createdAt: new Date("2024-01-20"),
    status: "pending"
  },
  {
    id: "guest_pending_2",
    itemName: "Baguette de Chasse",
    itemImage: "/images/3001.w40h40.png",
    category: "armes",
    type: "Baguette",
    quantity: 5,
    price: 50,
    date: "2024-01-21",
    createdAt: new Date("2024-01-21"),
    status: "pending"
  },
  {
    id: "guest_pending_3",
    itemName: "Lance de Chasse",
    itemImage: "/images/20017.w40h40.png",
    category: "armes",
    type: "Lance",
    quantity: 10,
    price: 25,
    date: "2024-01-22",
    createdAt: new Date("2024-01-22"),
    status: "pending"
  },
  {
    id: "guest_pending_4",
    itemName: "Le Bâton d'Amour",
    itemImage: "/images/20008.w40h40.png",
    category: "armes",
    type: "Bâton",
    quantity: 1,
    price: 800,
    date: "2024-01-23",
    createdAt: new Date("2024-01-23"),
    status: "pending"
  },
  {
    id: "guest_pending_5",
    itemName: "Lame de chasse",
    itemImage: "/images/20016.w40h40.png",
    category: "armes",
    type: "Épée",
    quantity: 1,
    price: 450,
    date: "2024-01-24",
    createdAt: new Date("2024-01-24"),
    status: "pending"
  }
];

// 5 ventes vendues prédéfinies
export const GUEST_SOLD_SALES: GuestSaleItem[] = [
  {
    id: "guest_sold_1",
    itemName: "Aiguilles et Fil",
    itemImage: "/images/20004.w40h40.png",
    category: "ressources",
    type: "Matériel",
    quantity: 2,
    price: 100,
    date: "2025-06-04T08:00:00Z",
    createdAt: new Date("2025-06-04T08:00:00Z"),
    status: "sold",
    soldDate: "2025-06-04T14:30:00Z",
    soldAt: new Date("2025-06-04T14:30:00Z") // Vendu en 6h30
  },
  {
    id: "guest_sold_2",
    itemName: "Le Bâton d'Amour",
    itemImage: "/images/20008.w40h40.png",
    category: "armes",
    type: "Bâton",
    quantity: 1,
    price: 750,
    date: "2025-06-08T10:15:00Z",
    createdAt: new Date("2025-06-08T10:15:00Z"),
    status: "sold",
    soldDate: "2025-06-08T22:45:00Z",
    soldAt: new Date("2025-06-08T22:45:00Z") // Vendu en 12h30
  },
  {
    id: "guest_sold_3",
    itemName: "Lance de Chasse",
    itemImage: "/images/20017.w40h40.png",
    category: "armes",
    type: "Lance",
    quantity: 1,
    price: 300,
    date: "2025-06-05T16:00:00Z",
    createdAt: new Date("2025-06-05T16:00:00Z"),
    status: "sold",
    soldDate: "2025-06-05T18:20:00Z",
    soldAt: new Date("2025-06-05T18:20:00Z") // Vendu en 2h20
  },
  {
    id: "guest_sold_4",
    itemName: "Lame de chasse",
    itemImage: "/images/20016.w40h40.png",
    category: "armes",
    type: "Épée",
    quantity: 1,
    price: 420,
    date: "2025-06-03T09:30:00Z",
    createdAt: new Date("2025-06-03T09:30:00Z"),
    status: "sold",
    soldDate: "2025-06-04T11:15:00Z",
    soldAt: new Date("2025-06-04T11:15:00Z") // Vendu en 25h45
  },
  {
    id: "guest_sold_5",
    itemName: "Baguette de Chasse",
    itemImage: "/images/3001.w40h40.png",
    category: "armes",
    type: "Baguette",
    quantity: 2,
    price: 180,
    date: "2025-06-01T14:00:00Z",
    createdAt: new Date("2025-06-01T14:00:00Z"),
    status: "sold",
    soldDate: "2025-06-07T09:30:00Z",
    soldAt: new Date("2025-06-07T09:30:00Z") // Vendu en 139h30 (5j 19h30)
  }
];

// Fonction pour obtenir toutes les données d'invité
export const getGuestData = () => ({
  favorites: GUEST_FAVORITES,
  pendingSales: GUEST_PENDING_SALES,
  soldSales: GUEST_SOLD_SALES
});

// Fonction pour vérifier si un item est dans les favoris invité
export const isGuestFavorite = (itemName: string): boolean => {
  return GUEST_FAVORITES.some(fav => fav.itemName === itemName);
};
