import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function createUser() {
    const { admin } = await import('../src/lib/firebase-admin');
    
    const email = 'admin@leadsuni.com.br';
    const password = 'leadsuni@2024';

    console.log(`Creating user: ${email}...`);
    
    try {
        const user = await admin.auth().createUser({
            email,
            password,
            emailVerified: true,
            displayName: 'Admin LeadsUni',
        });
        console.log('Successfully created new user:', user.uid);
    } catch (error: any) {
        if (error.code === 'auth/email-already-exists') {
            console.log('User already exists. You can use the existing account.');
        } else {
            console.error('Error creating new user:', error);
        }
    }
}

createUser().then(() => process.exit(0));
