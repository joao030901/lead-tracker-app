import * as admin from 'firebase-admin';

function formatPrivateKey(key?: string) {
    if (!key) return undefined;
    let formattedKey = key;
    if (formattedKey.startsWith('"') && formattedKey.endsWith('"')) {
        formattedKey = formattedKey.slice(1, -1);
    }
    if (formattedKey.startsWith("'") && formattedKey.endsWith("'")) {
        formattedKey = formattedKey.slice(1, -1);
    }
    return formattedKey.replace(/\\n/g, '\n');
}

if (!admin.apps.length) {
    console.log("Initializing Firebase Admin inside Next.js Server...");
    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: formatPrivateKey(process.env.FIREBASE_PRIVATE_KEY),
            }),
        });
    } catch (error) {
        console.error("Firebase Admin Initialization Error:", error);
    }
}

export const db = admin.firestore();
