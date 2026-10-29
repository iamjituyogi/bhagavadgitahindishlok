/**
 * Thin, typed persistence layer over AsyncStorage.
 * All local data the app keeps lives under the keys below — nothing else is stored.
 */
import { createAsyncStorage } from '@react-native-async-storage/async-storage';

const store = createAsyncStorage('bhagwat-geeta-audio');

export const StorageKeys = {
  themeMode: 'themeMode',
  playbackPrefs: 'playbackPrefs',
  favorites: 'favorites',
  history: 'history',
  progress: 'progress',
  lastPlayed: 'lastPlayed',
} as const;

export type StorageKey = (typeof StorageKeys)[keyof typeof StorageKeys];

export async function readJSON<T>(key: StorageKey, fallback: T): Promise<T> {
  try {
    const raw = await store.getItem(key);
    if (raw == null) {
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch (e) {
    console.warn(`[storage] failed to read "${key}"`, e);
    return fallback;
  }
}

export async function writeJSON<T>(key: StorageKey, value: T): Promise<void> {
  try {
    await store.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`[storage] failed to write "${key}"`, e);
  }
}
