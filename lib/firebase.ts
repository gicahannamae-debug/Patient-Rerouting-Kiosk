import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAPMOlQNlIkyrJjcbzxKZauAqKpfYni9s0",
  authDomain: "opd-self-intake-kiosk.firebaseapp.com",
  projectId: "opd-self-intake-kiosk",
  storageBucket: "opd-self-intake-kiosk.firebasestorage.app",
  messagingSenderId: "681589352390",
  appId: "1:681589352390:web:8c27390f066ed0064db4c7",
  measurementId: "G-HMV71QTHB8",
};

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
