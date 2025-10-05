// =================================================================
// SECTION: FIREBASE INITIALIZATION & CONFIGURATION
// =================================================================

// Firebase Configuration
// IMPORTANT: DO NOT COMMIT THIS FILE WITH YOUR ACTUAL KEYS. 
// This is an example file. Copy it to firebase-config.js and fill in your actual Firebase project configuration.
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    databaseURL: "YOUR_DATABASE_URL",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID",
    measurementId: "YOUR_MEASUREMENT_ID"
};

// Firebase SDK imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, onValue, set, get, query, orderByChild, equalTo, update, push, runTransaction } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, getRedirectResult } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, addDoc, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"; // Added for Firestore

// Firebase Initialization
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app); // Realtime Database instance
const db = getFirestore(app); // Firestore instance
const provider = new GoogleAuthProvider(); // Auth provider

export {
    app,
    auth,
    database,
    db,
    provider,
    initializeApp,
    getDatabase,
    ref,
    onValue,
    set,
    get,
    query,
    orderByChild,
    equalTo,
    update,
    push,
    runTransaction,
    getAuth,
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    onAuthStateChanged,
    getRedirectResult,
    getFirestore,
    collection,
    addDoc,
    doc,
    getDoc,
    updateDoc
};
