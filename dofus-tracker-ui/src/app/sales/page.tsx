"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Edit, Trash2, DollarSign, TrendingUp, Package } from "lucide-react";
import { useState } from "react";

interface Sale {
  id: string;
  itemName: string;
  quantity: number;
  price: number;
  date: string;
  status: "pending" | "sold" | "cancelled";
}

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);

  const [formData, setFormData] = useState({
    itemName: "",
    quantity: 1,
    price: 0,
  });

  const totalRevenue = sales
    .filter(sale => sale.status === "sold")
    .reduce((sum, sale) => sum + (sale.price * sale.quantity), 0);

  const pendingSales = sales.filter(sale => sale.status === "pending").length;
  const soldItems = sales.filter(sale => sale.status === "sold").length;

  const handleAddSale = () => {
    if (formData.itemName && formData.price > 0) {
      const newSale: Sale = {
        id: Date.now().toString(),
        itemName: formData.itemName,
        quantity: formData.quantity,
        price: formData.price,
        date: new Date().toISOString(),
        status: "pending",
      };
      setSales([...sales, newSale]);
      setFormData({ itemName: "", quantity: 1, price: 0 });
      setShowAddForm(false);
    }
  };

  const handleEditSale = () => {
    if (editingSale && formData.itemName && formData.price > 0) {
      setSales(sales.map(sale => 
        sale.id === editingSale.id 
          ? { ...sale, itemName: formData.itemName, quantity: formData.quantity, price: formData.price }
          : sale
      ));
      setEditingSale(null);
      setFormData({ itemName: "", quantity: 1, price: 0 });
    }
  };

  const handleDeleteSale = (id: string) => {
    setSales(sales.filter(sale => sale.id !== id));
  };

  const handleStatusChange = (id: string, status: Sale["status"]) => {
    setSales(sales.map(sale => 
      sale.id === id ? { ...sale, status } : sale
    ));
  };

  const getStatusColor = (status: Sale["status"]) => {
    switch (status) {
      case "pending": return "bg-yellow-500";
      case "sold": return "bg-green-500";
      case "cancelled": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusText = (status: Sale["status"]) => {
    switch (status) {
      case "pending": return "En attente";
      case "sold": return "Vendu";
      case "cancelled": return "Annulé";
      default: return "Inconnu";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mes Ventes</h1>
          <p className="text-muted-foreground">
            Gérez vos ventes et suivez vos revenus
          </p>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter une vente
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus totaux</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRevenue.toLocaleString()} kamas</div>
            <p className="text-xs text-muted-foreground">
              +20.1% par rapport au mois dernier
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventes en attente</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingSales}</div>
            <p className="text-xs text-muted-foreground">
              Items en cours de vente
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Items vendus</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{soldItems}</div>
            <p className="text-xs text-muted-foreground">
              Total des ventes complétées
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Form */}
      {(showAddForm || editingSale) && (
        <Card>
          <CardHeader>
            <CardTitle>{editingSale ? "Modifier la vente" : "Ajouter une vente"}</CardTitle>
            <CardDescription>
              {editingSale ? "Modifiez les détails de votre vente" : "Ajoutez un nouvel item à vendre"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="text-sm font-medium">Nom de l'item</label>
                <Input
                  value={formData.itemName}
                  onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                  placeholder="Nom de l'item"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Quantité</label>
                <Input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                  min="1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Prix (kamas)</label>
                <Input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                  min="0"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={editingSale ? handleEditSale : handleAddSale}>
                {editingSale ? "Modifier" : "Ajouter"}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowAddForm(false);
                  setEditingSale(null);
                  setFormData({ itemName: "", quantity: 1, price: 0 });
                }}
              >
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sales List */}
      <Card>
        <CardHeader>
          <CardTitle>Mes ventes ({sales.length})</CardTitle>
          <CardDescription>
            Gérez vos ventes en cours et complétées
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sales.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Aucune vente enregistrée</p>
              <Button onClick={() => setShowAddForm(true)} className="mt-4">
                Ajouter votre première vente
              </Button>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {sales.map((sale) => (
                  <Card key={sale.id} className="hover:shadow-lg transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{sale.itemName}</p>
                            <Badge variant="outline">x{sale.quantity}</Badge>
                            <Badge variant="secondary">{sale.price.toLocaleString()} kamas</Badge>
                            <Badge className={getStatusColor(sale.status)}>
                              {getStatusText(sale.status)}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Ajouté le {new Date(sale.date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {sale.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleStatusChange(sale.id, "sold")}
                              >
                                Marquer comme vendu
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStatusChange(sale.id, "cancelled")}
                              >
                                Annuler
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingSale(sale);
                              setFormData({
                                itemName: sale.itemName,
                                quantity: sale.quantity,
                                price: sale.price,
                              });
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteSale(sale.id)}
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
    </div>
  );
} 