"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MessageSquare, Users, Heart, Send } from "lucide-react";
import { useState } from "react";

export default function CommunityPage() {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleContactSupport = () => {
    window.location.href = "mailto:dofus.tracker.contact@gmail.com";
  };

  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    setIsSending(true);
    
    // Simuler l'envoi
    setTimeout(() => {
      const mailtoLink = `mailto:dofus.tracker.contact@gmail.com?subject=Suggestion d'amélioration - Dofus Tracker&body=${encodeURIComponent(message)}`;
      window.location.href = mailtoLink;
      setIsSending(false);
      setMessage("");
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Communauté</h1>
        <p className="text-muted-foreground">
          Proposez des améliorations pour Dofus Tracker
        </p>
      </div>

      {/* Contact Card */}
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <MessageSquare className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Proposez des améliorations</CardTitle>
          <CardDescription>
            Partagez vos idées pour améliorer Dofus Tracker
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Vous avez des idées pour améliorer Dofus Tracker ? 
              Partagez vos suggestions avec nous !
            </p>
            
            <div className="space-y-3">
              <label className="text-sm font-medium">Votre suggestion :</label>
              <Textarea
                placeholder="Décrivez votre idée d'amélioration..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[120px]"
              />
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <p className="font-medium mb-2">Email de contact :</p>
              <p className="text-primary font-mono text-lg">dofus.tracker.contact@gmail.com</p>
            </div>

            <div className="space-y-3 text-sm text-muted-foreground">
              <p>Nous étudions toutes les suggestions avec attention.</p>
              <p>Merci de votre contribution à l'amélioration de Dofus Tracker !</p>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <Button 
              onClick={handleSendMessage} 
              size="lg" 
              disabled={!message.trim() || isSending}
            >
              <Send className="h-4 w-4 mr-2" />
              {isSending ? "Envoi..." : "Envoyer la suggestion"}
            </Button>
            <Button onClick={handleContactSupport} variant="outline" size="lg">
              <Mail className="h-4 w-4 mr-2" />
              Email direct
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suggestions reçues</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Cette année
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Améliorations</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Implémentées
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 