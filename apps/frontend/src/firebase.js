import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyCpitXOIAZKZ8udAE6UreUR7vN-czFs39M",
    authDomain: "healbot-36975.firebaseapp.com",
    projectId: "healbot-36975",
    storageBucket: "healbot-36975.firebasestorage.app",
    messagingSenderId: "676007096034",
    appId: "1:676007096034:web:b00240a300f1ef205638bb",
    measurementId: "G-M0JKZB5BC2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
