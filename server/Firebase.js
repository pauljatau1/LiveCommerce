const { getDatabase, ref, set, get, child } = require('firebase/database');
const { initializeApp } = require('firebase/app');
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIza_REDACTED",
    authDomain: "auqli-mobile-app.firebaseapp.com",
    databaseURL: "https://auqli-mobile-app-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "auqli-mobile-app",
    storageBucket: "auqli-mobile-app.firebasestorage.app",
    messagingSenderId: "95041167196",
    appId: "1:95041167196:web:46e7d0b0f872247cd2ab99",
    measurementId: "G-8WT7XMRDGR",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const dbRef = ref(db);

const saveToken = async (userId, token) => {
    try {
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
        const values = (await get(child(dbRef, `userTokens/${userId}`))).val();
        return values ?? {};
    } catch (error) {
        console.error('Firebase getToken error:', error);
        throw error;
    }
};

module.exports = { app, saveToken, getToken };
