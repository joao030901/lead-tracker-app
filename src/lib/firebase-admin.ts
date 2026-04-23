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

let adminApp: admin.app.App | null = null;

if (!admin.apps.length) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = formatPrivateKey(process.env.FIREBASE_PRIVATE_KEY);

    if (projectId && clientEmail && privateKey) {
        try {
            adminApp = admin.initializeApp({
                credential: admin.credential.cert({
                    projectId,
                    clientEmail,
                    privateKey,
                }),
            });
        } catch (error) {
            console.error("Firebase Admin Initialization Error:", error);
        }
    } else {
        console.warn("Firebase Admin: credenciais não encontradas (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY). Operações server-side estarão desabilitadas.");
    }
} else {
    adminApp = admin.apps[0] ?? null;
}

export const db = adminApp ? adminApp.firestore() : null;
export { admin };
