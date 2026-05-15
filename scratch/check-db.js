const admin = require('firebase-admin');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!projectId || !clientEmail || !privateKey) {
    console.error('Missing credentials');
    process.exit(1);
}

admin.initializeApp({
    credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
    }),
});

const db = admin.firestore();

async function check() {
    try {
        const snapshot = await db.collection('locations').get();
        console.log(`Found ${snapshot.size} locations:`);
        snapshot.docs.forEach(doc => {
            console.log(` - ${doc.id}`);
        });
    } catch (error) {
        console.error('Error:', error);
    }
}

check();
