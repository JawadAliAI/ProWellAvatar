import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyDJFU-lqh-WBZAd6HvOqNTnz_3hF_AEBNQ",
    authDomain: "prowell-21a58.firebaseapp.com",
    projectId: "prowell-21a58",
    storageBucket: "prowell-21a58.firebasestorage.app",
    messagingSenderId: "522998581596",
    appId: "1:522998581596:web:1f65cd22d1f27314b65999",
    measurementId: "G-2B5FZHGMX0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
