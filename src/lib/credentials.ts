import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import type { Credentials } from '@/api/types';

const KEY = 'kop_reviewer_login';

/** expo-secure-store has no web version, so every call is guarded and the app never crashes without it. */
function store() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('expo-secure-store') as typeof import('expo-secure-store');
}

export async function loadCredentials(): Promise<Credentials | null> {
  try {
    const raw = await store().getItemAsync(KEY);
    if (!raw) return null;
    const v = JSON.parse(raw);
    return typeof v?.username === 'string' && typeof v?.appPassword === 'string' && v.username && v.appPassword ? v : null;
  } catch {
    return null;
  }
}

export async function saveCredentials(c: Credentials): Promise<boolean> {
  try {
    await store().setItemAsync(
      KEY,
      JSON.stringify({ username: c.username.trim(), appPassword: c.appPassword.replace(/\s+/g, '') }),
    );
    return true;
  } catch {
    return false;
  }
}

export async function clearCredentials(): Promise<void> {
  try {
    await store().deleteItemAsync(KEY);
  } catch {
    // nothing stored
  }
}

/** The saved reviewer login (null when signed out), read again each time the screen comes into view. */
export function useCredentials() {
  const [creds, setCreds] = useState<Credentials | null>(null);
  const [ready, setReady] = useState(false);
  const reload = useCallback(async () => {
    setCreds(await loadCredentials());
    setReady(true);
  }, []);
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );
  return { creds, ready, reload };
}
