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



// Fonction pour vérifier si un item est dans les favoris invité
export const isGuestFavorite = (itemName: string): boolean => {
  return GUEST_FAVORITES.some(fav => fav.itemName === itemName);
};

// Interface pour les items craftables du plan journalier
export interface GuestCraftItem {
  itemName: string;
  category: string;
  type: string;
  job: string;
  job_level: number;
  ingredient_names: string[];
  ingredient_ids: number[];
  quantities: number[];
}

// Items craftables pour le plan journalier (mode invité)
export const GUEST_CRAFT_ITEMS: GuestCraftItem[] = [
  {
    itemName: "Arc de Chasse",
    category: "armes",
    type: "Arc",
    job: "Sculpteur",
    job_level: 20,
    ingredient_names: ["Bois de Châtaignier", "Ficelle", "Plume de Bouftou"],
    ingredient_ids: [1001, 1002, 1003],
    quantities: [3, 1, 2]
  },
  {
    itemName: "Épée de Chasse",
    category: "armes",
    type: "Épée",
    job: "Forgeur",
    job_level: 25,
    ingredient_names: ["Minerai de Fer", "Bois de Chêne", "Cuir de Bouftou"],
    ingredient_ids: [2001, 2002, 2003],
    quantities: [5, 2, 1]
  },
  {
    itemName: "Baguette de Chasse",
    category: "armes",
    type: "Baguette",
    job: "Sculpteur",
    job_level: 15,
    ingredient_names: ["Bois de Frêne", "Cristal", "Plume de Corbeau"],
    ingredient_ids: [3001, 3002, 3003],
    quantities: [2, 1, 3]
  },
  {
    itemName: "Hache de Chasse",
    category: "armes",
    type: "Hache",
    job: "Forgeur",
    job_level: 30,
    ingredient_names: ["Minerai de Fer", "Bois de Chêne", "Pierre de Silex"],
    ingredient_ids: [4001, 4002, 4003],
    quantities: [4, 3, 2]
  },
  {
    itemName: "Marteau de Chasse",
    category: "armes",
    type: "Marteau",
    job: "Forgeur",
    job_level: 35,
    ingredient_names: ["Minerai de Fer", "Bois de Chêne", "Cuir de Sanglier"],
    ingredient_ids: [5001, 5002, 5003],
    quantities: [6, 2, 1]
  }
];

// Plan journalier prédéfini pour les invités
export const GUEST_DAILY_PLAN = [
  {
    id: "guest_plan_1",
    itemName: "Arc de Chasse",
    itemImage: "/images/20016.w40h40.png",
    category: "armes",
    type: "Arc",
    dailyQuantity: 5,
    lotSize: 5
  },
  {
    id: "guest_plan_2",
    itemName: "Épée de Chasse",
    itemImage: "/images/20017.w40h40.png",
    category: "armes",
    type: "Épée",
    dailyQuantity: 3,
    lotSize: 3
  },
  {
    id: "guest_plan_3",
    itemName: "Baguette de Chasse",
    itemImage: "/images/3001.w40h40.png",
    category: "armes",
    type: "Baguette",
    dailyQuantity: 10,
    lotSize: 10
  }
];

// Plus de ventes pour des statistiques plus riches
export const GUEST_ADDITIONAL_SALES: GuestSaleItem[] = [
  {
    id: "guest_additional_1",
    itemName: "Arc de Chasse",
    itemImage: "/images/20016.w40h40.png",
    category: "armes",
    type: "Arc",
    quantity: 1,
    price: 350,
    date: "2025-06-10T08:00:00Z",
    createdAt: new Date("2025-06-10T08:00:00Z"),
    status: "sold",
    soldDate: "2025-06-10T10:30:00Z",
    soldAt: new Date("2025-06-10T10:30:00Z") // Vendu en 2h30
  },
  {
    id: "guest_additional_2",
    itemName: "Hache de Chasse",
    itemImage: "/images/20018.w40h40.png",
    category: "armes",
    type: "Hache",
    quantity: 1,
    price: 280,
    date: "2025-06-09T14:00:00Z",
    createdAt: new Date("2025-06-09T14:00:00Z"),
    status: "sold",
    soldDate: "2025-06-09T16:45:00Z",
    soldAt: new Date("2025-06-09T16:45:00Z") // Vendu en 2h45
  },
  {
    id: "guest_additional_3",
    itemName: "Marteau de Chasse",
    itemImage: "/images/20019.w40h40.png",
    category: "armes",
    type: "Marteau",
    quantity: 1,
    price: 320,
    date: "2025-06-08T11:00:00Z",
    createdAt: new Date("2025-06-08T11:00:00Z"),
    status: "sold",
    soldDate: "2025-06-08T13:15:00Z",
    soldAt: new Date("2025-06-08T13:15:00Z") // Vendu en 2h15
  },
  {
    id: "guest_additional_4",
    itemName: "Lance de Chasse",
    itemImage: "/images/20017.w40h40.png",
    category: "armes",
    type: "Lance",
    quantity: 2,
    price: 180,
    date: "2025-06-07T09:00:00Z",
    createdAt: new Date("2025-06-07T09:00:00Z"),
    status: "sold",
    soldDate: "2025-06-07T11:30:00Z",
    soldAt: new Date("2025-06-07T11:30:00Z") // Vendu en 2h30
  },
  {
    id: "guest_additional_5",
    itemName: "Dague de Chasse",
    itemImage: "/images/20020.w40h40.png",
    category: "armes",
    type: "Dague",
    quantity: 1,
    price: 220,
    date: "2025-06-06T16:00:00Z",
    createdAt: new Date("2025-06-06T16:00:00Z"),
    status: "sold",
    soldDate: "2025-06-06T18:45:00Z",
    soldAt: new Date("2025-06-06T18:45:00Z") // Vendu en 2h45
  }
];

// Mise à jour de la fonction getGuestData
export const getGuestData = () => ({
  favorites: GUEST_FAVORITES,
  pendingSales: GUEST_PENDING_SALES,
  soldSales: [...GUEST_SOLD_SALES, ...GUEST_ADDITIONAL_SALES],
  craftItems: GUEST_CRAFT_ITEMS,
  dailyPlan: GUEST_DAILY_PLAN
});
