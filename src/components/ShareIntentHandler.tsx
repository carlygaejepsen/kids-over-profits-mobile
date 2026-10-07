import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { AppState } from 'react-native';

import { clearSharedLink, readSharedLink } from '@/lib/shareIntent';

/**
 * Opens the Send tab with a link shared into the app from a browser or another app. Checked at start and each time
 * the app comes to the front. Does nothing where sharing is not built in (Expo Go, the web).
 */
export function ShareIntentHandler() {
  const router = useRouter();
  useEffect(() => {
    const check = () => {
      const url = readSharedLink();
      if (!url) return;
      try {
        router.navigate({ pathname: '/send', params: { url, ts: String(Date.now()) } });
        clearSharedLink();
      } catch {
        // the navigator was not ready; the next foreground check tries again
      }
    };
    const first = setTimeout(check, 300);
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') check();
    });
    return () => {
      clearTimeout(first);
      sub.remove();
    };
  }, [router]);
  return null;
}
