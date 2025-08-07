"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MessageSquare, Users, Send } from "lucide-react";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

export default function CommunityPage() {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const isMobile = useIsMobile();

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
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Communauté</h1>
        <p className="text-muted-foreground">
          Proposez des améliorations pour Dofus Tracker
        </p>
      </div>

      {/* Contact Card */}
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 md:w-16 md:h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <MessageSquare className="h-6 w-6 md:h-8 md:w-8 text-primary" />
          </div>
          <CardTitle className="text-xl md:text-2xl">Proposez des améliorations</CardTitle>
          <CardDescription>
            Partagez vos idées pour améliorer Dofus Tracker
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4 md:space-y-6">
          <div className="space-y-4">
            <p className="text-muted-foreground text-sm md:text-base">
              Vous avez des idées pour améliorer Dofus Tracker ? 
              Partagez vos suggestions !
            </p>
            
            <div className="space-y-3">
              <label className="text-sm font-medium">Votre suggestion :</label>
              <Textarea
                placeholder="Décrivez votre idée d'amélioration..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[100px] md:min-h-[120px]"
              />
            </div>

            <div className="bg-muted/50 rounded-lg p-3 md:p-4">
              <p className="font-medium mb-2 text-sm md:text-base">Email de contact :</p>
              <p className="text-primary font-mono text-sm md:text-lg break-all">
                dofus.tracker.contact@gmail.com
              </p>
            </div>

            <div className="space-y-2 md:space-y-3 text-xs md:text-sm text-muted-foreground">
              <p>J&apos;étudie toutes les suggestions avec attention.</p>
              <p>Merci de votre contribution à l&apos;amélioration de Dofus Tracker !</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
            <Button 
              onClick={handleSendMessage} 
              size={isMobile ? "default" : "lg"}
              disabled={!message.trim() || isSending}
              className="w-full sm:w-auto"
            >
              <Send className="h-4 w-4 mr-2" />
              {isSending ? "Envoi..." : "Envoyer la suggestion"}
            </Button>
            <Button 
              onClick={handleContactSupport} 
              variant="outline" 
              size={isMobile ? "default" : "lg"}
              className="w-full sm:w-auto"
            >
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