"use client";

import './firebase'; // force l'initialisation de Firebase
import React, { createContext, useContext, ReactNode } from 'react';
import { FirebaseApp } from 'firebase/app';
import { getApp } from 'firebase/app';

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