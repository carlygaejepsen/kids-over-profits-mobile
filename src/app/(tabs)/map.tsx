import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { openBrowserAsync } from 'expo-web-browser';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { WebView, type WebViewNavigation } from 'react-native-webview';

import { Icon } from '@/components/Icon';
import { Button } from '@/components/site';
import { AppText, Loading } from '@/components/ui';
import { openLink } from '@/lib/links';
import { isMapPage, MAP_INJECT_BEFORE, mapUrl, openScript } from '@/lib/mapPage';
import { colors } from '@/theme/colors';
import { spacing, touchTarget } from '@/theme/typography';

/**
 * The network map: the website's map page in a web view, the site's header and footer hidden. A facility or
 * company page it links to opens the app's screen; any other site opens in the browser. `open` (a map node
 * id, from a facility page's Connections) moves the map to that name.
 */
export default function MapScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { open } = useLocalSearchParams<{ open?: string }>();
  const web = useRef<WebView>(null);
  // The page loads once (its graph is large); a later `open` only changes the hash.
  const [first] = useState(() => mapUrl(open));
  const shown = useRef(open ?? '');
  const [state, setState] = useState<'loading' | 'loaded' | 'error'>('loading');

  useEffect(() => {
    if (!open || open === shown.current) return;
    shown.current = open;
    web.current?.injectJavaScript(openScript(open));
  }, [open]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          onPress={() => void openBrowserAsync(mapUrl(shown.current))}
          accessibilityRole="button"
          accessibilityLabel="Open the map in the browser"
          hitSlop={8}
          style={styles.headerButton}>
          <Icon name="external" size={22} color={colors.white} />
        </Pressable>
      ),
    });
  }, [navigation]);

  const onRequest = (req: WebViewNavigation) => {
    if (isMapPage(req.url) || req.url.startsWith('about:') || req.url.startsWith('data:')) return true;
    void openLink(req.url, (href) => router.push(href));
    return false;
  };

  return (
    <View style={styles.screen}>
      <WebView
        ref={web}
        source={{ uri: first }}
        injectedJavaScriptBeforeContentLoaded={MAP_INJECT_BEFORE}
        onShouldStartLoadWithRequest={onRequest}
        onLoadEnd={() => setState((s) => (s === 'error' ? s : 'loaded'))}
        onError={() => setState('error')}
        onHttpError={() => setState('error')}
        setSupportMultipleWindows={false}
        style={styles.web}
      />
      {state === 'loading' ? (
        <View style={styles.overlay} pointerEvents="none">
          <Loading label="Loading the network map" />
        </View>
      ) : null}
      {state === 'error' ? (
        <View style={[styles.overlay, styles.errorBox]}>
          <AppText variant="body" style={styles.center}>The map could not be loaded. Check your connection and try again.</AppText>
          <Button
            label="Try again"
            icon="shuffle"
            onPress={() => {
              setState('loading');
              web.current?.reload();
            }}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  web: { flex: 1, backgroundColor: colors.white },
  overlay: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white },
  errorBox: { padding: spacing.lg, gap: spacing.md },
  center: { textAlign: 'center' },
  headerButton: { minWidth: touchTarget, minHeight: touchTarget, alignItems: 'center', justifyContent: 'center' },
});
