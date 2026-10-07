import { Platform } from 'react-native';

import { extractUrl } from './sendLink';

/**
 * Links shared into the app from a browser or another app (expo-sharing). The native module only exists in a
 * development or release build, so it is loaded lazily and every call is guarded: in Expo Go this finds nothing.
 */
function sharing() {
  if (Platform.OS === 'web') return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-sharing') as typeof import('expo-sharing');
  } catch {
    return null;
  }
}

/** The first web address in what was shared with the app, or ''. */
export function readSharedLink(): string {
  try {
    const mod = sharing();
    if (!mod) return '';
    for (const p of mod.getSharedPayloads() ?? []) {
      const url = extractUrl(p.value);
      if (url) return url;
    }
  } catch {
    // module missing in Expo Go
  }
  return '';
}

export function clearSharedLink(): void {
  try {
    sharing()?.clearSharedPayloads();
  } catch {
    // nothing to clear
  }
}
