const { getDatabase, ref, set, get, child } = require('firebase/database');
const { initializeApp } = require('firebase/app');
const admin = require('firebase-admin');
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

// Initialize Firebase Admin SDK
let adminInitialized = false;
const initializeAdminApp = () => {
    if (!adminInitialized && !admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: firebaseConfig.projectId,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
            }),
            databaseURL: firebaseConfig.databaseURL
        });
        adminInitialized = true;
    }
    return admin;
};

// Initialize Admin SDK
initializeAdminApp();

// Get database reference from Admin SDK
const db = admin.database();
const dbRef = db.ref();

const saveToken = async (userId, token) => {
    try {
        const values = (await dbRef.child(`userTokens/${userId}/`).get()).val() ?? {};
        const payload = { ...values, token };
        await dbRef.child(`userTokens/${userId}/`).set(payload);
        return true;
    } catch (error) {
        console.error('Firebase saveToken error:', error);
        throw error;
    }
};

const getToken = async (userId) => {
    try {
        const values = (await dbRef.child(`userTokens/${userId}`).get()).val();
        return values ?? {};
    } catch (error) {
        console.error('Firebase getToken error:', error);
        throw error;
    }
};


const removeToken = async (userId) => {
    try {
        await dbRef.child(`userTokens/${userId}`).remove();
        return true;
    } catch (error) {
        console.error('Firebase removeToken error:', error);
        throw error;
    }
};

module.exports = { admin, saveToken, getToken, removeToken };
