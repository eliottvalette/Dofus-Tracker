# Dofus Tracker UI

Un projet Next.js moderne avec shadcn/ui et Tailwind CSS pour créer une interface de suivi Dofus.

## 🚀 Technologies

- **Next.js 15** - Framework React avec App Router
- **TypeScript** - Support complet du typage
- **Tailwind CSS v4** - Framework CSS utilitaire
- **shadcn/ui** - Composants UI réutilisables
- **Lucide React** - Icônes modernes
- **ESLint** - Linting et formatage du code

## 📁 Structure du projet

```
dofus-tracker-ui/
├── src/
│   ├── app/                 # Pages Next.js (App Router)
│   ├── components/
│   │   ├── ui/             # Composants shadcn/ui
│   │   └── layout/         # Composants de layout
│   └── lib/                # Utilitaires
├── public/                 # Assets statiques
└── components.json         # Configuration shadcn/ui
```

## 🎨 Composants disponibles

- **MainLayout** - Layout principal avec sidebar et navbar
- **Button** - Boutons avec différentes variantes
- **Card** - Cartes pour organiser le contenu
- **Input** - Champs de saisie
- **Label** - Labels pour les formulaires

## 🛠️ Installation et développement

```bash
# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev

# Vérifier le linting
npm run lint

# Build pour la production
npm run build
```

## 🎯 Fonctionnalités

- ✅ Layout responsive avec sidebar et navbar
- ✅ Composants shadcn/ui intégrés
- ✅ Design moderne et accessible
- ✅ Support TypeScript complet
- ✅ Configuration ESLint
- ✅ Espace central pour vos composants personnalisés

## 🔧 Ajouter de nouveaux composants shadcn/ui

```bash
npx shadcn@latest add [component-name]
```

## 📝 Utilisation du MainLayout

```tsx
import { MainLayout } from "@/components/layout/main-layout";

export default function MyPage() {
  return (
    <MainLayout>
      {/* Votre contenu ici */}
    </MainLayout>
  );
}
```

## 🎨 Personnalisation

Le projet utilise les variables CSS de shadcn/ui pour la personnalisation des couleurs et du thème. Modifiez `src/app/globals.css` pour ajuster le design.

## 📦 Scripts disponibles

- `npm run dev` - Serveur de développement
- `npm run build` - Build de production
- `npm run start` - Serveur de production
- `npm run lint` - Vérification du code
