import { Stack, useLocalSearchParams } from 'expo-router';
import { openBrowserAsync } from 'expo-web-browser';
import { useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { SITE } from '@/api/client';
import { Icon } from '@/components/Icon';
import { Button } from '@/components/site';
import { AppText, Loading } from '@/components/ui';
import { docKindOf, imageViewerHtml, pdfViewerHtml } from '@/lib/docs';
import { colors } from '@/theme/colors';
import { spacing, touchTarget } from '@/theme/typography';

/**
 * A document from the site's library, read in the app: PDFs drawn by pdf.js (opened at the cited page),
 * pictures with pinch to zoom. iOS's web view reads anything else itself; on Android a Word file or the like
 * gets a button to the browser instead of a blank screen.
 */
export default function DocumentScreen() {
  const params = useLocalSearchParams<{ url: string; page?: string; title?: string }>();
  const url = String(params.url ?? '');
  const page = Number(params.page) || 1;
  const kind = docKindOf(url);
  const [state, setState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const external = page > 1 ? `${url}#page=${page}` : url;
  const browser = () => void openBrowserAsync(external);

  const source = useMemo(() => {
    if (kind === 'pdf' && url.startsWith(SITE)) return { html: pdfViewerHtml(url, page), baseUrl: `${SITE}/` };
    if (kind === 'image') return { html: imageViewerHtml(url), baseUrl: `${SITE}/` };
    return { uri: url };
  }, [kind, url, page]);

  const onMessage = (e: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(e.nativeEvent.data) as { type?: string };
      if (msg.type === 'loaded' || msg.type === 'error') setState(msg.type);
    } catch {
      // not ours
    }
  };

  const header = (
    <Stack.Screen
      options={{
        title: params.title || 'Document',
        headerRight: () => (
          <Pressable onPress={browser} accessibilityRole="button" accessibilityLabel="Open in the browser" hitSlop={8} style={styles.headerButton}>
            <Icon name="external" size={22} color={colors.white} />
          </Pressable>
        ),
      }}
    />
  );

  if (!url || (kind === 'other' && Platform.OS === 'android')) {
    return (
      <SafeAreaView style={styles.notice} edges={['bottom']}>
        {header}
        <Icon name="file-text" size={32} color={colors.tealInk} />
        <AppText variant="body" style={styles.noticeText}>
          {url ? 'The app cannot show this kind of file. Your browser can open or download it.' : 'No document to show.'}
        </AppText>
        {url ? <Button label="Open in the browser" icon="external" onPress={browser} /> : null}
      </SafeAreaView>
    );
  }

  // Our pdf.js page and picture page report back; a page iOS draws itself has only the load events.
  const reports = 'html' in source;
  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      {header}
      <WebView
        source={source}
        originWhitelist={['*']}
        onMessage={onMessage}
        onLoadEnd={reports ? undefined : () => setState('loaded')}
        onError={() => setState('error')}
        onHttpError={() => setState('error')}
        allowsInlineMediaPlayback
        setSupportMultipleWindows={false}
        style={styles.web}
      />
      {state === 'loading' ? (
        <View style={styles.overlay} pointerEvents="none">
          <Loading label="Loading the document" />
        </View>
      ) : null}
      {state === 'error' ? (
        <View style={[styles.overlay, styles.errorBox]}>
          <AppText variant="body" style={styles.noticeText}>This document could not be opened in the app.</AppText>
          <Button label="Open in the browser" icon="external" onPress={browser} />
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.midnight },
  web: { flex: 1, backgroundColor: colors.midnight },
  overlay: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  errorBox: { backgroundColor: colors.white, padding: spacing.lg, gap: spacing.md },
  notice: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, gap: spacing.md, backgroundColor: colors.white },
  noticeText: { textAlign: 'center' },
  headerButton: { minWidth: touchTarget, minHeight: touchTarget, alignItems: 'center', justifyContent: 'center' },
});
