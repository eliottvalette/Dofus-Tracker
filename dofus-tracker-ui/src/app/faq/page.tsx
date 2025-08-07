"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpCircle } from "lucide-react";

export default function FAQPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <HelpCircle className="h-6 w-6 text-primary" />
        <h1 className="text-3xl font-bold">FAQ</h1>
      </div>

      <div className="space-y-4">
        {/* Question 1 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pourquoi il n&apos;y a pas le prix des items ?</CardTitle>
          </CardHeader>
          <div className="w-full h-px bg-border mx-6"></div>
          <CardContent className="pt-2">
            <p className="text-muted-foreground">
              Le prix des items récupéré automatiquement nécessiterait un bot HDV, ce qui est formellement interdit par la communauté et par Ankama.
              Cependant, prochainement, il vous sera possible de mettre à jour le prix des items manuellement. 
              Il sera également possible de partager les prix entre utilisateurs pour créer une base de données collaborative.
            </p>
          </CardContent>
        </Card>

        {/* Question 2 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Comment annuler une vente ?</CardTitle>
          </CardHeader>
          <div className="w-full h-px bg-border mx-6"></div>
          <CardContent className="pt-2">
            <p className="text-muted-foreground">
              Faites un clic droit sur une vente en cours et sélectionnez &quot;Annuler la vente&quot;. 
              La vente sera supprimée définitivement de votre liste.
            </p>
          </CardContent>
        </Card>

        {/* Question 3 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Dofus Tracker est-il gratuit ?</CardTitle>
          </CardHeader>
          <div className="w-full h-px bg-border mx-6"></div>
          <CardContent className="pt-2">
            <p className="text-muted-foreground">
              Oui, Dofus Tracker est entièrement gratuit. Aucun abonnement ou paiement n&apos;est requis pour utiliser toutes les fonctionnalités.
            </p>
          </CardContent>
        </Card>

        {/* Question 4 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Mes données sont-elles sauvegardées ?</CardTitle>
          </CardHeader>
          <div className="w-full h-px bg-border mx-6"></div>
          <CardContent className="pt-2">
            <p className="text-muted-foreground">
              Oui, vos favoris et vos ventes sont sauvegardés automatiquement et instantanément dans Firebase et synchronisés entre tous vos appareils 
              une fois que vous êtes connecté avec votre compte.
            </p>
          </CardContent>
        </Card>

        {/* Question 5 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">L&apos;application fonctionne-t-elle sur mobile ?</CardTitle>
          </CardHeader>
          <div className="w-full h-px bg-border mx-6"></div>
          <CardContent className="pt-2">
            <p className="text-muted-foreground">
              Oui, Dofus Tracker est responsive et fonctionne parfaitement sur mobile. 
              L&apos;interface s&apos;adapte automatiquement à la taille de votre écran.
            </p>
          </CardContent>
        </Card>

        {/* Question 6 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Y a-t-il des limites d&apos;utilisation ?</CardTitle>
          </CardHeader>
          <div className="w-full h-px bg-border mx-6"></div>
          <CardContent className="pt-2">
            <p className="text-muted-foreground">
              Il n&apos;y a pas, et il n&apos;y aura jamais de limite sur le nombre d&apos;items favoris ou de ventes que vous pouvez créer. 
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 