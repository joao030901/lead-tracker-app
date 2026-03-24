import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

async function createUser() {
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    
    const email = 'admin@leadsuni.com.br';
    const password = 'leadsuni@2024';

    console.log(`Creating user (Client SDK): ${email}...`);
    
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        console.log('Successfully created new user:', userCredential.user.uid);
    } catch (error: any) {
        console.error('Error creating new user:', error.code, error.message);
    }
}

createUser().then(() => process.exit(0));
