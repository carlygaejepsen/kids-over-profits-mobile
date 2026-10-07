/**
 * Links that open the app. expo-sharing launches it with expo-sharing://... when something is shared in; send that
 * to the Send tab, which reads the shared link. Everything else (kidsoverprofits://send?url=..., site pages) is
 * left to the router.
 */
export function redirectSystemPath({ path }: { path: string; initial: boolean }) {
  try {
    const url = new URL(path, 'kidsoverprofits://app.home');
    if (url.protocol === 'expo-sharing:' || url.hostname === 'expo-sharing') return '/send';
    return path;
  } catch {
    return '/';
  }
}
