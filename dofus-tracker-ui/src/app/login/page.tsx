"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/login-form";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSignUp, setIsSignUp] = useState(false);

  useEffect(() => {
    const mode = searchParams?.get('mode');
    if (mode === 'signup') {
      setIsSignUp(true);
    } else if (mode === 'signin') {
      setIsSignUp(false);
    }
  }, [searchParams]);

  const toggleMode = () => setIsSignUp(prev => !prev);

  const handleEmailSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    try {
      if (isSignUp) {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        // Créer un profil utilisateur simple sans afficher l'UID
        await setDoc(doc(db, "users", cred.user.uid), {
          email: email,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        });
        toast.success("Compte créé avec succès.");
      } else {
        const loginCred = await signInWithEmailAndPassword(auth, email, password);
        const userRef = doc(db, "users", loginCred.user.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          // Créer un profil pour un utilisateur existant
          await setDoc(userRef, {
            email: email,
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
          });
        } else {
          // Mettre à jour la dernière connexion
          await setDoc(userRef, {
            ...userSnap.data(),
            lastLogin: new Date().toISOString()
          }, { merge: true });
        }
        toast.success("Connexion réussie.");
      }
      router.replace("/");
    } catch (err) {
      console.error(err);
      toast.error(`Erreur d'authentification: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      
      // Créer ou mettre à jour le profil utilisateur
      const userRef = doc(db, "users", result.user.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          email: result.user.email,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        });
      } else {
        await setDoc(userRef, {
          ...userSnap.data(),
          lastLogin: new Date().toISOString()
        }, { merge: true });
      }
      
      toast.success("Connexion Google réussie.");
      router.replace("/");
    } catch (err) {
      console.error(err);
      toast.error(`Erreur de connexion Google: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  return (
    <div className="min-h-screen bg-grid bg-[#111111] flex flex-col">
      <main className="flex flex-1 items-center justify-center px-4 flex-col">
        <span className="text-xl max-w-[26rem] w-full text-left mb-8 font-bold">Dofus Tracker</span>
        <Card className="w-full max-w-[26rem] shadow-lg border-[#262626] bg-[#111111]/90 backdrop-blur-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center text-[#FAFAFA]">
              {isSignUp ? "Créer un compte" : "Connexion"}
            </CardTitle>
            <CardDescription className="text-center text-gray-400">
              {isSignUp ? "Rejoignez Dofus Tracker pour tracker vos ventes" : "Connectez-vous à votre compte Dofus Tracker"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm
              onSubmit={handleEmailSubmit}
              isSignUp={isSignUp}
              onToggleMode={toggleMode}
              onGoogleSignIn={handleGoogleSignIn}
            />
          </CardContent>
        </Card>
      </main>
      <Toaster />
    </div>
  );
}
