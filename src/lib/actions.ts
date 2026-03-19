
'use server';

import fs from 'node:fs/promises';
import path from 'node:path';
import { revalidatePath } from 'next/cache';

const baseDataDirectory = path.join(process.cwd(), 'data');

async function ensureDirectoryExists(directoryPath: string) {
  try {
    await fs.access(directoryPath);
  } catch {
    await fs.mkdir(directoryPath, { recursive: true });
  }
}

export async function listLocations(): Promise<string[]> {
    try {
        await ensureDirectoryExists(baseDataDirectory);
        const entries = await fs.readdir(baseDataDirectory, { withFileTypes: true });
        const directories = entries
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);
        return directories;
    } catch (error) {
        console.error('Error listing locations:', error);
        return [];
    }
}

export async function addLocation(locationName: string): Promise<void> {
    const locationDirectory = path.join(baseDataDirectory, locationName);
    try {
        await fs.access(locationDirectory);
        throw new Error(`A unidade "${locationName}" já existe.`);
    } catch (error: any) {
        if (error.code !== 'ENOENT') {
            throw error;
        }
    }
    
    await ensureDirectoryExists(locationDirectory);

    // Create empty files for the new location
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

    for (const [filename, content] of Object.entries(defaultFiles)) {
        await fs.writeFile(path.join(locationDirectory, filename), JSON.stringify(content, null, 2), 'utf8');
    }
    revalidatePath('/');
}

export async function updateLocation(oldLocationName: string, newLocationName: string): Promise<void> {
    const oldDirectory = path.join(baseDataDirectory, oldLocationName);
    const newDirectory = path.join(baseDataDirectory, newLocationName);

    if (oldLocationName === newLocationName) return;

    try {
        await fs.access(newDirectory);
        throw new Error(`A unidade "${newLocationName}" já existe.`);
    } catch (error: any) {
        if (error.code !== 'ENOENT') {
            throw error;
        }
    }
    
    try {
        await fs.rename(oldDirectory, newDirectory);
        revalidatePath('/');
    } catch (error) {
        console.error(`Error updating location from ${oldLocationName} to ${newLocationName}:`, error);
        throw new Error(`Não foi possível renomear a unidade.`);
    }
}

export async function deleteLocation(locationName: string): Promise<void> {
    const locationDirectory = path.join(baseDataDirectory, locationName);
    try {
        await fs.rm(locationDirectory, { recursive: true, force: true });
        revalidatePath('/');
    } catch (error) {
        console.error(`Error deleting location ${locationName}:`, error);
        throw new Error(`Não foi possível deletar a unidade "${locationName}".`);
    }
}


export async function readData<T>(filename: string, defaultData: T, location: string): Promise<T> {
  const locationDirectory = path.join(baseDataDirectory, location);
  const filePath = path.join(locationDirectory, filename);
  try {
    await ensureDirectoryExists(locationDirectory);
    const fileContent = await fs.readFile(filePath, 'utf8');
    return JSON.parse(fileContent);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      // File doesn't exist for this location, write default and return it
      await writeData(filename, defaultData, location);
      return defaultData;
    }
    console.error(`Error reading ${filename} from ${location}:`, error);
    // Return default data in case of other errors
    return defaultData;
  }
}

export async function writeData<T>(filename: string, data: T, location: string): Promise<void> {
  const locationDirectory = path.join(baseDataDirectory, location);
  const filePath = path.join(locationDirectory, filename);
  try {
    await ensureDirectoryExists(locationDirectory);
    const fileContent = JSON.stringify(data, null, 2);
    await fs.writeFile(filePath, fileContent, 'utf8');
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
