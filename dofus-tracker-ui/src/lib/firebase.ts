import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBCnGdxaRPcmpvnXp0a7CQ6kXL3-7zOaQI",
  authDomain: "dofus-tracker-e1453.firebaseapp.com",
  projectId: "dofus-tracker-e1453",
  storageBucket: "dofus-tracker-e1453.firebasestorage.app",
  messagingSenderId: "615047576735",
  appId: "1:615047576735:web:b37204e661789d0b8476aa"
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);