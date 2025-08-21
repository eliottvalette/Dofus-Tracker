"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpCircle } from "lucide-react";

const Q_n_A = [
  {
    question: "Pourquoi il n'y a pas le prix des items ?",
    answer: "Le prix des items récupéré automatiquement nécessiterait un bot HDV, ce qui est formellement interdit par la communauté et par Ankama. Cependant, prochainement, il vous sera possible de mettre à jour le prix des items manuellement. Il sera également possible de partager les prix entre utilisateurs pour créer une base de données collaborative."
  },
  {
    question: "Comment annuler une vente ?",
    answer: "Faites un clic droit sur une vente en cours et sélectionnez \"Annuler la vente\". La vente sera supprimée définitivement de votre liste."
  },
  {
    question: "Dofus Tracker est-il gratuit ?",
    answer: "Oui, Dofus Tracker est entièrement gratuit. Aucun abonnement ou paiement n'est requis pour utiliser toutes les fonctionnalités."
  },
  {
    question: "Mes données sont-elles sauvegardées ?",
    answer: "Oui, vos favoris et vos ventes sont sauvegardées automatiquement et instantanément dans Firebase et synchronisés entre tous vos appareils une fois que vous êtes connecté avec votre compte."
  },
  {
    question: "L'application fonctionne-t-elle sur mobile ?",
    answer: "Oui, Dofus Tracker est responsive et fonctionne parfaitement sur mobile. L'interface s'adapte automatiquement à la taille de votre écran."
  },
  {
    question: "Y a-t-il des limites d'utilisation ?",
    answer: "Il n'y a pas, et il n'y aura jamais de limite sur le nombre d'items favoris ou de ventes que vous pouvez créer."
  }
]


export default function FAQPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <HelpCircle className="h-6 w-6 text-primary" />
        <h1 className="text-3xl font-bold">FAQ</h1>
      </div>

      <div className="space-y-4">
        {Q_n_A.map((item, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="text-lg">{item.question}</CardTitle>
          </CardHeader>
          <div className="w-full h-px bg-border mx-6"></div>
          <CardContent className="pt-2">
            <p className="text-muted-foreground">
              {item.answer}
            </p>
          </CardContent>
        </Card>
        ))}
      </div>
    </div>
  );
} 