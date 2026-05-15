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

if (admin.apps.length === 0) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey,
        }),
    });
}

const db = admin.firestore();

async function checkCandidate() {
    try {
        const locationsSnapshot = await db.collection('locations').get();
        for (const locDoc of locationsSnapshot.docs) {
            console.log(`Checking location: ${locDoc.id}`);
            const candidatesSnapshot = await db.collection('locations').doc(locDoc.id).collection('candidates').where('registrationCode', '==', '9365583').get();
            
            if (!candidatesSnapshot.empty) {
                console.log(`Found candidate in ${locDoc.id}:`);
                const data = candidatesSnapshot.docs[0].data();
                console.log(JSON.stringify(data, null, 2));
                return;
            }
        }
        console.log('Candidate not found in any location.');
    } catch (error) {
        console.error('Error:', error);
    }
}

checkCandidate();
