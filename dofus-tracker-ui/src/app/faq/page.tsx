"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpCircle } from "lucide-react";

const Q_n_A = [
  {
    question: "Pourquoi il n'y a pas le prix des items ?",
    answer:
      "La récupération automatique des prix nécessiterait un bot HDV (interdit par la communauté et par Ankama). En revanche, vous pouvez déjà définir des prix manuels: dans la page Ventes via des badges de prix, et dans le Plan Journalier via des badges de prix unitaires par ingrédient.",
  },
  {
    question: "Comment annuler une vente ?",
    answer:
      "Faites un clic droit sur une vente en cours et sélectionnez \"Annuler la vente\". La vente sera supprimée de votre liste de ventes en cours. Disponible uniquement sur ordinateur, je réfléchis à une solution pour mobile.",
  },
  {
    question: "Qu'est-ce que le mode invité ?",
    answer:
      "Le mode invité permet de tester l'application sans compte avec des données de démonstration (favoris, ventes, statistiques). Les actions d'écriture (favoris personnalisés, ventes, plan journalier) nécessitent un compte pour être sauvegardées et synchronisées.",
  },
  {
    question: "Mes données sont-elles sauvegardées ?",
    answer:
      "Oui. Une fois connecté, vos favoris, ventes et plan journalier sont sauvegardés dans Firebase et synchronisés entre vos appareils.",
  },
  {
    question: "L'application fonctionne-t-elle sur mobile ?",
    answer:
      "Oui, l'interface est responsive et s'adapte automatiquement aux écrans mobiles.",
  },
  {
    question: "Y a-t-il des limites d'utilisation ?",
    answer:
      "Aucune limite volontaire sur le nombre de favoris, ventes ou éléments du plan journalier. Des limites techniques raisonnables peuvent s'appliquer pour préserver les performances.",
  },
  {
    question: "Comment proposer une amélioration ou signaler un bug ?",
    answer:
      "Rendez-vous sur la page Communauté pour envoyer votre suggestion, ou écrivez à dofus.tracker.contact@gmail.com.",
  },
];


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
          <div className="h-px bg-border mx-6"></div>
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