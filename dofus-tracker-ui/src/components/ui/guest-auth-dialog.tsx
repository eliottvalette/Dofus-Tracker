"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { UserPlus, LogIn, Users } from "lucide-react";

interface GuestAuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
}

export function GuestAuthDialog({ 
  open, 
  onOpenChange, 
  title = "Compte requis",
  description = "Cette action nécessite un compte utilisateur. Créez un compte 100% gratuit pour sauvegarder vos données ou continuez en mode invité."
}: GuestAuthDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleCreateAccount = async () => {
    setLoading(true);
    try {
      router.push("/login?mode=signup");
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    try {
      router.push("/login?mode=signin");
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const handleStayGuest = () => {
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-left">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex flex-col gap-3 py-4">
          <Button 
            onClick={handleCreateAccount}
            disabled={loading}
            className="w-full justify-start"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Créer un compte gratuit
          </Button>
          <Button 
            variant="outline"
            onClick={handleLogin}
            disabled={loading}
            className="w-full justify-start"
          >
            <LogIn className="h-4 w-4 mr-2" />
            J&apos;ai déjà un compte
          </Button>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleStayGuest}>
            Rester en mode invité
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
