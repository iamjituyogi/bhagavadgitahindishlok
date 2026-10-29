/**
 * Reads the required app version from Firebase Realtime Database.
 *
 * Node: /bhagavadgitaaudiobook
 *   { appVersion: 1.3, appURL: "https://play.google.com/store/apps/details?id=…" }
 *
 * appVersion is compared with the installed versionName (build.gradle).
 * appURL is optional; anything that is not an official store link is ignored
 * and the UpdateModal falls back to the Play Store listing.
 * Prefer storing appVersion as a STRING: Firebase turns the number 1.10 into 1.1.
 */
import { getApp, getApps } from '@react-native-firebase/app';
import { get, getDatabase, onValue, ref } from '@react-native-firebase/database';
import { isValidStoreUrl, parseVersion } from '../utils/appVersion';

const APP_VERSION_PATH = 'bhagavadgitaaudiobook';

export interface RequiredAppVersion {
  /** Version the app must be on; null if missing/invalid. */
  requiredVersion: string | null;
  storeUrl: string | null;
  message: string | null;
  enabled: boolean;
}

const toVersionString = (value: unknown): string | null => {
  let text: string | null = null;
  if (typeof value === 'string') text = value.trim();
  else if (typeof value === 'number' && Number.isFinite(value)) text = String(value);
  return text && parseVersion(text) ? text : null;
};

/** Turns the raw node into a safe config. Malformed values never lock the app. */
export function parseAppVersionConfig(raw: unknown): RequiredAppVersion {
  const data = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const message = typeof data.message === 'string' ? data.message.trim() : '';
  return {
    requiredVersion: toVersionString(data.appVersion),
    storeUrl: isValidStoreUrl(data.appURL) ? data.appURL.trim() : null,
    message: message || null,
    enabled: data.enabled !== false,
  };
}

/** false when Firebase isn't initialised on this build (config file missing). */
export const isFirebaseConfigured = () => {
  try {
    return getApps().length > 0;
  } catch {
    return false;
  }
};

const appVersionRef = () => ref(getDatabase(getApp()), APP_VERSION_PATH);

export async function fetchRequiredAppVersion(): Promise<RequiredAppVersion> {
  const snapshot = await get(appVersionRef());
  return parseAppVersionConfig(snapshot.val());
}

/** Live subscription; returns the unsubscribe function. */
export function subscribeRequiredAppVersion(
  onConfig: (config: RequiredAppVersion) => void,
  onError: (error: Error) => void,
): () => void {
  return onValue(
    appVersionRef(),
    snapshot => onConfig(parseAppVersionConfig(snapshot.val())),
    onError,
  );
}
