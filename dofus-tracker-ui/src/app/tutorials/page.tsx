"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Monitor, Smartphone, HelpCircle } from "lucide-react";

export default function TutorialsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Play className="h-6 w-6 text-primary" />
        <h1 className="text-3xl font-bold">Tutoriels</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Tutoriel PC */}
        <Card className="overflow-hidden">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Monitor className="h-5 w-5 text-primary" />
              <CardTitle>Tutoriel PC</CardTitle>
            </div>
            <CardDescription>
              Guide complet pour utiliser Dofus Tracker sur ordinateur
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="aspect-video w-full">
              <iframe
                className="w-full h-full rounded-lg"
                src="https://www.youtube.com/embed/sCod6w1rsQ0"
                title="Tutoriel PC - Dofus Tracker"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              ></iframe>
            </div>
          </CardContent>
        </Card>

        {/* Tutoriel Mobile */}
        <Card className="overflow-hidden">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-primary" />
              <CardTitle>Tutoriel Mobile</CardTitle>
            </div>
            <CardDescription>
              Guide pour utiliser Dofus Tracker sur mobile
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="aspect-video w-full">
              <iframe
                className="w-full h-full rounded-lg"
                src="https://www.youtube.com/embed/v51UyrIDlig"
                title="Tutoriel Mobile - Dofus Tracker"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              ></iframe>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Section Bulles Tuto */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            <CardTitle>Bulles Tuto</CardTitle>
          </div>
          <CardDescription>
            Des bulles d&apos;aide interactives sont disponibles dans l&apos;application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Cliquez sur l&apos;icône <HelpCircle className="inline h-4 w-4" /> dans le coin supérieur droit des pages pour accéder aux tutoriels interactifs.
            </p>
            <div className="grid gap-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span><strong>Page Items</strong> : Comment ajouter des favoris et préparer vos ventes</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span><strong>Page Sales</strong> : Comment gérer vos ventes et le cycle de validation</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 