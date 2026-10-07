import { useRouter } from 'expo-router';
import { useCallback } from 'react';

import { openLink } from '@/lib/links';

/** Opens an address the way the site's links do: an app screen when there is one, else the in-app browser. */
export function useOpenLink() {
  const router = useRouter();
  return useCallback(
    (url?: string | null) => {
      void openLink(url, (href) => router.push(href));
    },
    [router],
  );
}
