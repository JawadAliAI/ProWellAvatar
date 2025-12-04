import React, { useContext, useState, useEffect } from "react";
import { auth, db } from "../firebase";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

const AuthContext = React.createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState();
    const [loading, setLoading] = useState(true);

    async function signup(email, password, name, username) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Update Profile
        await updateProfile(user, {
            displayName: name
        });

        // Create User Document
        try {
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                name: name,
                username: username,
                email: email,
                createdAt: new Date().toISOString()
            });
        } catch (error) {
            console.error("Error writing user document: ", error);
            // Continue even if DB write fails, as Auth is successful
        }

        return userCredential;
    }

    function login(email, password) {
        return signInWithEmailAndPassword(auth, email, password);
    }

    function logout() {
        return signOut(auth);
    }

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const value = {
        currentUser,
        login,
        signup,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
