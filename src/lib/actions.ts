'use server';

import { revalidatePath } from 'next/cache';
import { db } from './firebase-admin';

export async function listLocations(): Promise<string[]> {
    try {
        const querySnapshot = await db.collection('locations').get();
        return querySnapshot.docs.map(docSnap => docSnap.id);
    } catch (error) {
        console.error('Error listing locations:', error);
        return [];
    }
}

export async function addLocation(locationName: string): Promise<void> {
    const locationRef = db.collection('locations').doc(locationName);
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

    const batch = db.batch();
    for (const [filename, content] of Object.entries(defaultFiles)) {
        const fileRef = locationRef.collection('data').doc(filename);
        batch.set(fileRef, { content });
    }
    await batch.commit();

    revalidatePath('/');
}

export async function updateLocation(oldLocationName: string, newLocationName: string): Promise<void> {
    if (oldLocationName === newLocationName) return;

    const oldLocationRef = db.collection('locations').doc(oldLocationName);
    const newLocationRef = db.collection('locations').doc(newLocationName);

    const newDocSnap = await newLocationRef.get();
    if (newDocSnap.exists) {
        throw new Error(`A unidade "${newLocationName}" já existe.`);
    }

    try {
        await newLocationRef.set({ name: newLocationName, updatedAt: new Date().toISOString() });

        const dataSnapshot = await oldLocationRef.collection('data').get();
        const batch = db.batch();
        
        dataSnapshot.forEach((docSnap) => {
            const newFileRef = newLocationRef.collection('data').doc(docSnap.id);
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
    try {
        const locationRef = db.collection('locations').doc(locationName);
        
        const dataSnapshot = await locationRef.collection('data').get();
        const batch = db.batch();
        dataSnapshot.forEach((docSnap) => {
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
  if (!location) return defaultData;
  const docRef = db.collection('locations').doc(location).collection('data').doc(filename);
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
  const docRef = db.collection('locations').doc(location).collection('data').doc(filename);
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
  const filename = `${dataType}.json`;
  await writeData(filename, data, location);

  revalidatePaths.forEach(path => revalidatePath(path));
}
