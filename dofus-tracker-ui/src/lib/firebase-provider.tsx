"use client";

import './firebase'; // force l'initialisation de Firebase
import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { FirebaseApp } from 'firebase/app';
import { getApp } from 'firebase/app';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';

// Créer un contexte pour l'application Firebase
const FirebaseAppContext = createContext<FirebaseApp | undefined>(undefined);

// Hook pour utiliser l'application Firebase
export const useFirebaseApp = (): FirebaseApp => {
  const context = useContext(FirebaseAppContext);
  if (!context) {
    throw new Error('useFirebaseApp doit être utilisé à l\'intérieur de FirebaseProvider');
  }
  return context;
};

// Hook pour utiliser l'authentification Firebase
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, loading };
};

// Composant Provider pour le contexte Firebase
const FirebaseProvider = ({ children }: { children: ReactNode }) => {
  // Utiliser l'instance existante de l'application Firebase
  const app = getApp();
  
  return (
    <FirebaseAppContext.Provider value={app}>
      {children}
    </FirebaseAppContext.Provider>
  );
};

export default FirebaseProvider; 