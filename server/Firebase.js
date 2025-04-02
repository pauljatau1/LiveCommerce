const { getDatabase, ref, set, get, child } = require('firebase/database');
const { initializeApp } = require('firebase/app');
const { getAuth, signInWithCustomToken } = require('firebase/auth');
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIza_REDACTED",
    authDomain: "auqli-app.firebaseapp.com",
    databaseURL: "https://auqli-app-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "auqli-app",
    storageBucket: "auqli-app.firebasestorage.app",
    messagingSenderId: "558100397953",
    appId: "1:558100397953:web:0014fb72dfcd1aa3933280",
    measurementId: "G-MEYRS0CCTB"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const dbRef = ref(db);
const auth = getAuth(app);

// For server-side authentication with Firebase
let firebaseAdminInitialized = false;
let admin;

// Initialize Firebase Admin (lazy loading)
const initializeFirebaseAdmin = async () => {
    if (!firebaseAdminInitialized) {
        admin = require('firebase-admin');
        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: firebaseConfig.projectId,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
                }),
                databaseURL: firebaseConfig.databaseURL
            });
        }
        firebaseAdminInitialized = true;
    }
    return admin;
};

// Generate a Firebase token from userId
const createFirebaseToken = async (userId) => {
    const admin = await initializeFirebaseAdmin();
    return admin.auth().createCustomToken(userId.toString());
};

// Authenticate with Firebase before database operations
const authenticateFirebase = async (userId) => {
    try {
        const firebaseToken = await createFirebaseToken(userId);
        await signInWithCustomToken(auth, firebaseToken);
        return true;
    } catch (error) {
        console.error('Firebase authentication error:', error);
        throw error;
    }
};

const saveToken = async (userId, token) => {
    try {
        // Authenticate with Firebase
        await authenticateFirebase(userId);
        
        const values = (await get(child(dbRef, `userTokens/${userId}/`))).val() ?? {};
        const payload = { ...values, token };
        await set(ref(db, `userTokens/${userId}/`), payload);
        return true;
    } catch (error) {
        console.error('Firebase saveToken error:', error);
        throw error;
    }
};

const getToken = async (userId) => {
    try {
        // Authenticate with Firebase
        await authenticateFirebase(userId);
        
        const values = (await get(child(dbRef, `userTokens/${userId}`))).val();
        return values ?? {};
    } catch (error) {
        console.error('Firebase getToken error:', error);
        throw error;
    }
};

module.exports = { app, auth, saveToken, getToken, createFirebaseToken };
