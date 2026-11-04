const admin = require('firebase-admin');

// Firebase stores device push tokens for the native app. It is optional:
// without credentials these helpers do nothing, so the web MVP runs without it.
const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const databaseURL = process.env.FIREBASE_DATABASE_URL;

const firebaseConfigured = Boolean(projectId && clientEmail && privateKey && databaseURL);

let dbRef = null;
if (firebaseConfigured) {
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
            databaseURL
        });
    }
    dbRef = admin.database().ref();
}

const saveToken = async (userId, token) => {
    if (!dbRef) return false;
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
    if (!dbRef) return {};
    try {
        const values = (await dbRef.child(`userTokens/${userId}`).get()).val();
        return values ?? {};
    } catch (error) {
        console.error('Firebase getToken error:', error);
        throw error;
    }
};

const removeToken = async (userId) => {
    if (!dbRef) return false;
    try {
        await dbRef.child(`userTokens/${userId}`).remove();
        return true;
    } catch (error) {
        console.error('Firebase removeToken error:', error);
        throw error;
    }
};

module.exports = { admin, firebaseConfigured, saveToken, getToken, removeToken };
