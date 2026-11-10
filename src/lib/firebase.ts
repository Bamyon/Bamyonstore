import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, collection, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc, query, where, orderBy, limit, onSnapshot, serverTimestamp, writeBatch, runTransaction, increment, deleteField, getCountFromServer, getAggregateFromServer, sum } from 'firebase/firestore';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendPasswordResetEmail } from 'firebase/auth';

// NEXT_PUBLIC_* values must be written out in full so Next.js can inline them at build time.
export const CFG = {
  firebase: {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyA_0g9MfAQHNrumn6Zg6xknvfJPkGY33wY',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'bamyon-shop.firebaseapp.com',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'bamyon-shop',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'bamyon-shop.firebasestorage.app',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_SENDER_ID || '65308645881',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:65308645881:web:8dee4dd6d83f74acadc528',
  },
  cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD || 'xtrrhfj7',
  preset: process.env.NEXT_PUBLIC_CLOUDINARY_PRESET || 'bamyon',
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP || '2348112772267',
  paystack: process.env.NEXT_PUBLIC_PAYSTACK_KEY || '',
  useFunctions: process.env.NEXT_PUBLIC_USE_FUNCTIONS === 'true',
};

let fb: any;
// Browser only. Call inside effects and event handlers, never during render.
export function getFb(): any {
  if (fb) return fb;
  const app = getApps().length ? getApp() : initializeApp(CFG.firebase);
  fb = {
    app, db: getFirestore(app), auth: getAuth(app), initApp: initializeApp, getAuth, getFirestore,
    doc, collection, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc, query, where, orderBy, limit, onSnapshot,
    serverTimestamp, writeBatch, runTransaction, increment, deleteField, getCountFromServer, getAggregateFromServer, sum,
    onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendPasswordResetEmail,
  };
  return fb;
}
