// src/services/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyBf5wGLoTtcboTYRIOaWxMvDxxT3X26GQc",
    authDomain: "personal-calendar-813b0.firebaseapp.com",
    projectId: "personal-calendar-813b0",
    storageBucket: "personal-calendar-813b0.firebasestorage.app",
    messagingSenderId: "798170823454",
    appId: "1:798170823454:web:f8c7ed44f7df3e9212270f",
    measurementId: "G-09FRFEJC0R"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const analytics = getAnalytics(app);