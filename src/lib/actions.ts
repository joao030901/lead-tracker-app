'use server';

import { revalidatePath } from 'next/cache';
import { db } from './firebase-admin';

// Função auxiliar para migrar/salvar array em subcoleções (em blocos de 500 para respeitar limite do Firebase)
async function saveToSubcollection(location: string, collectionName: string, data: any[]) {
    const adminDb = requireDb();
    const colRef = adminDb.collection('locations').doc(location).collection(collectionName);
    
    const existingDocs = await colRef.get();
    const existingIds = new Set(existingDocs.docs.map(d => d.id));
    const newIds = new Set(data.map(s => s.id));
    
    const toDelete = Array.from(existingIds).filter(id => !newIds.has(id));
    
    let batches = [];
    let currentBatch = adminDb.batch();
    let opCount = 0;

    const commitBatch = () => {
        batches.push(currentBatch.commit());
        currentBatch = adminDb.batch();
        opCount = 0;
    };

    for (const id of toDelete) {
        currentBatch.delete(colRef.doc(id));
        opCount++;
        if (opCount === 500) commitBatch();
    }

    for (const item of data) {
        if (!item.id) continue;
        currentBatch.set(colRef.doc(item.id), item);
        opCount++;
        if (opCount === 500) commitBatch();
    }

    if (opCount > 0) {
        batches.push(currentBatch.commit());
    }

    await Promise.all(batches);
}

function requireDb() {
    if (!db) {
        throw new Error(
            'Firebase Admin SDK não está configurado. ' +
            'Adicione FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL e FIREBASE_PRIVATE_KEY ao .env.local.'
        );
    }
    return db;
}

export async function listLocations(): Promise<string[]> {
    try {
        if (!db) return [];
        const querySnapshot = await db.collection('locations').get();
        return querySnapshot.docs.map(docSnap => docSnap.id);
    } catch (error) {
        console.error('Error listing locations:', error);
        return [];
    }
}

export async function addLocation(locationName: string): Promise<void> {
    const adminDb = requireDb();
    const locationRef = adminDb.collection('locations').doc(locationName);
    const docSnap = await locationRef.get();
    if (docSnap.exists) {
        throw new Error(`A unidade "${locationName}" já existe.`);
    }

    await locationRef.set({ name: locationName, createdAt: new Date().toISOString() });

    const defaultFiles = {
        'specialists.json': [],
        'goals.json': [],
        'holidays.json': [],
        'agenda.json': [],
        'templates.json': [],
        'candidates.json': [],
        'leads.json': [],
        'students.json': [],
        'paid-bonuses.json': {},
        'academic-period.json': { startDate: null, endDate: null },
        'logs.json': [],
    };

    const batch = adminDb.batch();
    for (const [filename, content] of Object.entries(defaultFiles)) {
        if (filename === 'students.json') {
            continue; // Will be handled dynamically via subcollections
        }
        const fileRef = locationRef.collection('data').doc(filename);
        batch.set(fileRef, { content });
    }
    await batch.commit();

    revalidatePath('/');
}

export async function updateLocation(oldLocationName: string, newLocationName: string): Promise<void> {
    if (oldLocationName === newLocationName) return;
    const adminDb = requireDb();

    const oldLocationRef = adminDb.collection('locations').doc(oldLocationName);
    const newLocationRef = adminDb.collection('locations').doc(newLocationName);

    const newDocSnap = await newLocationRef.get();
    if (newDocSnap.exists) {
        throw new Error(`A unidade "${newLocationName}" já existe.`);
    }

    try {
        await newLocationRef.set({ name: newLocationName, updatedAt: new Date().toISOString() });

        const dataSnapshot = await oldLocationRef.collection('data').get();
        const batch = adminDb.batch();
        
        dataSnapshot.forEach((docSnap) => {
            if (docSnap.id === 'students.json') return; // Skip old students.json if any
            const newFileRef = newLocationRef.collection('data').doc(docSnap.id);
            batch.set(newFileRef, docSnap.data());
            batch.delete(docSnap.ref);
        });

        const studentsSnapshot = await oldLocationRef.collection('students').get();
        studentsSnapshot.forEach((docSnap) => {
            const newFileRef = newLocationRef.collection('students').doc(docSnap.id);
            batch.set(newFileRef, docSnap.data());
            batch.delete(docSnap.ref);
        });

        batch.delete(oldLocationRef);
        await batch.commit();

        revalidatePath('/');
    } catch (error) {
        console.error(`Error updating location from ${oldLocationName} to ${newLocationName}:`, error);
        throw new Error(`Não foi possível renomear a unidade.`);
    }
}

export async function deleteLocation(locationName: string): Promise<void> {
    const adminDb = requireDb();
    try {
        const locationRef = adminDb.collection('locations').doc(locationName);
        
        const dataSnapshot = await locationRef.collection('data').get();
        const batch = adminDb.batch();
        dataSnapshot.forEach((docSnap) => {
            batch.delete(docSnap.ref);
        });

        const studentsSnapshot = await locationRef.collection('students').get();
        studentsSnapshot.forEach((docSnap) => {
            batch.delete(docSnap.ref);
        });
        
        batch.delete(locationRef);
        await batch.commit();

        revalidatePath('/');
    } catch (error) {
        console.error(`Error deleting location ${locationName}:`, error);
        throw new Error(`Não foi possível deletar a unidade "${locationName}".`);
    }
}

export async function readData<T>(filename: string, defaultData: T, location: string): Promise<T> {
  if (!location || !db) return defaultData;
  const adminDb = db;

  if (filename === 'students.json') {
      const colRef = adminDb.collection('locations').doc(location).collection('students');
      try {
          const snapshot = await colRef.get();
          if (!snapshot.empty) {
              return snapshot.docs.map(d => d.data()) as T;
          } else {
              // Backward compatibility check
              const oldDocRef = adminDb.collection('locations').doc(location).collection('data').doc(filename);
              const oldDocSnap = await oldDocRef.get();
              if (oldDocSnap.exists) {
                  return (oldDocSnap.data()?.content as T) ?? defaultData;
              }
              return defaultData;
          }
      } catch (error) {
          console.error(`Error reading ${filename} from ${location}:`, error);
          return defaultData;
      }
  }

  const docRef = adminDb.collection('locations').doc(location).collection('data').doc(filename);
  try {
    const docSnap = await docRef.get();
    if (docSnap.exists) {
      return (docSnap.data()?.content as T) ?? defaultData;
    } else {
      await writeData(filename, defaultData, location);
      return defaultData;
    }
  } catch (error) {
    console.error(`Error reading ${filename} from ${location}:`, error);
    return defaultData;
  }
}

export async function writeData<T>(filename: string, data: T, location: string): Promise<void> {
  const adminDb = requireDb();
  const docRef = adminDb.collection('locations').doc(location).collection('data').doc(filename);
  try {
    await docRef.set({ content: data });
  } catch (error) {
    console.error(`Error writing to ${filename} in ${location}:`, error);
    throw new Error(`Could not write to ${filename} in ${location}`);
  }
}

export async function saveData(
    dataType: 'specialists' | 'goals' | 'holidays' | 'agenda' | 'templates' | 'candidates' | 'leads' | 'students' | 'paid-bonuses' | 'academic-period' | 'logs', 
    location: string,
    data: any, 
    revalidatePaths: string[] = []
) {
  if (!location) throw new Error("Location must be provided to save data.");
  
  if (dataType === 'students') {
      if (!Array.isArray(data)) throw new Error("Data must be an array for students");
      await saveToSubcollection(location, dataType, data);
  } else {
      const filename = `${dataType}.json`;
      await writeData(filename, data, location);
  }

  revalidatePaths.forEach(path => revalidatePath(path));
}
