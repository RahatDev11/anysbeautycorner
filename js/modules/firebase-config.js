// =================================================================
// SECTION: FIREBASE INITIALIZATION & CONFIGURATION
// =================================================================

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCVSzQS1c7H4BLhsDF_fW8wnqUN4B35LPA",
    authDomain: "nahid-6714.firebaseapp.com",
    databaseURL: "https://nahid-6714-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "nahid-6714",
    storageBucket: "nahid-6714.appspot.com",
    messagingSenderId: "505741217147",
    appId: "1:505741217147:web:25ed4e9f0d00e3c4d381de",
    measurementId: "G-QZ7CTRKHCW"
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
