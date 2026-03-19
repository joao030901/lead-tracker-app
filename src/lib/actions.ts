'use server';

import { revalidatePath } from 'next/cache';
import { db } from './firebase';
import { collection, doc, getDoc, getDocs, setDoc, writeBatch } from 'firebase/firestore';

export async function listLocations(): Promise<string[]> {
    try {
        const querySnapshot = await getDocs(collection(db, 'locations'));
        return querySnapshot.docs.map(docSnap => docSnap.id);
    } catch (error) {
        console.error('Error listing locations:', error);
        return [];
    }
}

export async function addLocation(locationName: string): Promise<void> {
    const locationRef = doc(db, 'locations', locationName);
    const docSnap = await getDoc(locationRef);
    if (docSnap.exists()) {
        throw new Error(`A unidade "${locationName}" já existe.`);
    }

    // Create location doc
    await setDoc(locationRef, { name: locationName, createdAt: new Date().toISOString() });

    // Create default files
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

    const batch = writeBatch(db);
    for (const [filename, content] of Object.entries(defaultFiles)) {
        const fileRef = doc(db, 'locations', locationName, 'data', filename);
        batch.set(fileRef, { content });
    }
    await batch.commit();

    revalidatePath('/');
}

export async function updateLocation(oldLocationName: string, newLocationName: string): Promise<void> {
    if (oldLocationName === newLocationName) return;

    const oldLocationRef = doc(db, 'locations', oldLocationName);
    const newLocationRef = doc(db, 'locations', newLocationName);

    const newDocSnap = await getDoc(newLocationRef);
    if (newDocSnap.exists()) {
        throw new Error(`A unidade "${newLocationName}" já existe.`);
    }

    try {
        await setDoc(newLocationRef, { name: newLocationName, updatedAt: new Date().toISOString() });

        const dataSnapshot = await getDocs(collection(db, 'locations', oldLocationName, 'data'));
        const batch = writeBatch(db);
        
        dataSnapshot.forEach((docSnap) => {
            const newFileRef = doc(db, 'locations', newLocationName, 'data', docSnap.id);
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
        const locationRef = doc(db, 'locations', locationName);
        
        const dataSnapshot = await getDocs(collection(db, 'locations', locationName, 'data'));
        const batch = writeBatch(db);
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
  const docRef = doc(db, 'locations', location, 'data', filename);
  try {
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data()?.content as T;
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
  const docRef = doc(db, 'locations', location, 'data', filename);
  try {
    await setDoc(docRef, { content: data });
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
