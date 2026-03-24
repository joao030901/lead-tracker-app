import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function check() {
    const { db } = await import('../src/lib/firebase');
    console.log("Checking Firestore...");
    try {
        const locations = await db.collection('locations').get();
        console.log(`Found ${locations.size} locations.`);
        locations.forEach(doc => {
            console.log(` - Location ID: ${doc.id}`);
        });
        
        if (locations.size > 0) {
            const firstLoc = locations.docs[0].id;
            const data = await db.collection('locations').doc(firstLoc).collection('data').get();
            console.log(`Found ${data.size} documents in ${firstLoc}/data.`);
        }
    } catch (e) {
        console.error("Diagnostic Error:", e);
    }
}

check().then(() => process.exit(0));
