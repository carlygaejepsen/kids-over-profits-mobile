import * as Clipboard from 'expo-clipboard';
import { useFocusEffect, useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { openBrowserAsync } from 'expo-web-browser';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { BackHandler, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { WebView, type WebViewMessageEvent, type WebViewNavigation } from 'react-native-webview';

import { SITE } from '@/api/client';
import { Icon, type IconName } from '@/components/Icon';
import { Button } from '@/components/site';
import { dense } from '@/components/site/metrics';
import { Pill } from '@/components/tabs/Pill';
import { SearchField } from '@/components/tabs/SearchField';
import { useDebounced } from '@/components/tabs/useDebounced';
import { AppText, Loading } from '@/components/ui';
import { openDonate } from '@/lib/donate';
import { openLink } from '@/lib/links';
import {
  BACK_SCRIPT,
  EMPTY_STATE,
  kindWord,
  MAP_BRIDGE,
  openNodeScript,
  parseMessage,
  pressScript,
  searchScript,
  type MapButton,
  type MapResult,
  type MapState,
} from '@/lib/mapBridge';
import { isMapPage, MAP_INJECT_BEFORE, MAP_PATH, MAP_STYLE_SCRIPT, mapUrl, openScript } from '@/lib/mapPage';
import { colors, shadows } from '@/theme/colors';
import { radius, spacing, touchTarget, type } from '@/theme/typography';

/** The words before a name the map found by another name (search.js). */
const viaWords = (r: MapResult) => (!r.via ? '' : r.viaKind === 'past' ? `Formerly ${r.via}` : r.viaKind === 'current' ? `Now known as ${r.via}` : `Also known as ${r.via}`);

/**
 * The network map: the website's map page in a web view, driven by the app's own controls (src/lib/mapBridge.ts):
 * a search box with suggestions from the map's names, zoom buttons, Key / List / Timeline chips, Back through
 * the trail (the header button and Android's back), reload and a menu. A facility or company page it links to
 * opens the app's screen; any other site opens in the browser. `open` (a map node id, from a facility page's
 * Connections) moves the map to that name.
 */
export default function MapScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { open } = useLocalSearchParams<{ open?: string }>();
  const web = useRef<WebView>(null);
  // The page loads once (its graph is large); a later `open` only changes the hash.
  const [first] = useState(() => mapUrl(open));
  const shown = useRef(open ?? '');
  const [load, setLoad] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [map, setMap] = useState<MapState>(EMPTY_STATE);
  const [text, setText] = useState('');
  const [results, setResults] = useState<{ q: string; items: MapResult[] }>({ q: '', items: [] });
  const [menu, setMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const q = useDebounced(text.trim(), 200);

  const run = useCallback((js: string) => web.current?.injectJavaScript(js), []);
  const press = (b: MapButton) => run(pressScript(b));

  useEffect(() => {
    if (!open || open === shown.current) return;
    shown.current = open;
    run(openScript(open));
  }, [open, run]);

  useEffect(() => {
    if (q.length >= 2 && map.ready) run(searchScript(q));
  }, [q, map.ready, run]);

  const trail = map.trail;
  const back = useCallback(() => run(BACK_SCRIPT), [run]);

  // Android's back steps along the trail first, then leaves the tab as usual.
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        if (menu) {
          setMenu(false);
          return true;
        }
        if (!trail.length) return false;
        back();
        return true;
      });
      return () => sub.remove();
    }, [trail.length, back, menu]),
  );

  useLayoutEffect(() => {
    const before = trail.length > 1 ? trail[trail.length - 2].name : 'the whole map';
    navigation.setOptions({
      headerLeft: trail.length
        ? () => (
            <Pressable
              onPress={back}
              accessibilityRole="button"
              accessibilityLabel={`Back to ${before}`}
              hitSlop={spacing.xs}
              style={styles.headerButton}>
              <Icon name="arrow-left" size={22} color={colors.white} />
            </Pressable>
          )
        : undefined,
      headerRight: () => (
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => {
              setLoad('loading');
              setMap(EMPTY_STATE);
              web.current?.reload();
            }}
            accessibilityRole="button"
            accessibilityLabel="Reload the map"
            hitSlop={spacing.xs}
            style={styles.headerButton}>
            <Icon name="refresh" size={22} color={colors.white} />
          </Pressable>
          <Pressable
            onPress={() => setMenu((m) => !m)}
            accessibilityRole="button"
            accessibilityLabel="More"
            accessibilityState={{ expanded: menu }}
            hitSlop={spacing.xs}
            style={styles.headerButton}>
            <Icon name="more-vertical" size={22} color={colors.white} />
          </Pressable>
        </View>
      ),
    });
  }, [navigation, trail, back, menu]);

  const onRequest = (req: WebViewNavigation) => {
    if (isMapPage(req.url) || req.url.startsWith('about:') || req.url.startsWith('data:')) return true;
    void openLink(req.url, (href) => router.push(href));
    return false;
  };

  const onMessage = (e: WebViewMessageEvent) => {
    const m = parseMessage(e.nativeEvent.data);
    if (!m) return;
    if (m.type === 'state') setMap(m);
    else setResults({ q: m.q, items: m.items });
  };

  const link = `${SITE}${MAP_PATH}${map.hash}`;
  const pick = (r: MapResult) => {
    setText('');
    setResults({ q: '', items: [] });
    run(openNodeScript(r.id));
  };
  const showing = text.trim().length >= 2 && results.q === q ? results.items : [];

  const menuItems: { label: string; icon: IconName; onPress: () => void }[] = [
    { label: 'Open in the browser', icon: 'external', onPress: () => void openBrowserAsync(link) },
    {
      label: copied ? 'Link copied' : 'Copy a link to this view',
      icon: copied ? 'check' : 'link',
      onPress: () => {
        void Clipboard.setStringAsync(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
    },
    { label: 'Donate', icon: 'heart', onPress: () => void openDonate() },
  ];

  return (
    <View style={styles.screen}>
      <View style={styles.searchBar}>
        <SearchField value={text} onChangeText={setText} placeholder="Find a name on the map" label="Find a program, company or person on the map" />
      </View>

      <View style={styles.stage}>
        <WebView
          ref={web}
          source={{ uri: first }}
          injectedJavaScriptBeforeContentLoaded={MAP_INJECT_BEFORE}
          injectedJavaScript={MAP_BRIDGE}
          onMessage={onMessage}
          onShouldStartLoadWithRequest={onRequest}
          onLoadEnd={() => {
            setLoad((s) => (s === 'error' ? s : 'loaded'));
            // Again after load, in case the start script ran before the page had a root element.
            run(`${MAP_STYLE_SCRIPT}${MAP_BRIDGE}`);
          }}
          onError={() => setLoad('error')}
          onHttpError={() => setLoad('error')}
          setSupportMultipleWindows={false}
          bounces={false}
          overScrollMode="never"
          setBuiltInZoomControls={false}
          pullToRefreshEnabled={false}
          style={styles.web}
        />

        {showing.length ? (
          <ScrollView style={styles.results} keyboardShouldPersistTaps="handled" accessibilityLabel={`${showing.length} names on the map`}>
            {showing.map((r) => {
              const via = viaWords(r);
              const kind = kindWord(r.kind);
              return (
                <Pressable
                  key={r.id}
                  onPress={() => pick(r)}
                  accessibilityRole="button"
                  accessibilityLabel={[kind, r.name, via].filter(Boolean).join('. ')}
                  style={({ pressed }) => [styles.result, pressed && styles.pressed]}>
                  <Text style={styles.resultName}>{r.name}</Text>
                  <Text style={styles.resultMeta}>{[kind, via].filter(Boolean).join(' · ')}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : text.trim().length >= 2 && results.q === q && map.ready ? (
          <View style={styles.results}>
            <Text style={[styles.resultMeta, styles.none]}>{`No name on the map matches "${q}".`}</Text>
          </View>
        ) : null}

        {load === 'loaded' && !map.drawer ? (
          <View style={styles.zoom}>
            {(
              [
                ['zoomIn', 'plus', 'Zoom in'],
                ['zoomOut', 'minus', 'Zoom out'],
                ['fit', 'maximize', 'Fit everything on the screen'],
                ['reset', 'home', 'Reset the view'],
              ] as [MapButton, IconName, string][]
            ).map(([b, icon, label]) => (
              <Pressable
                key={b}
                onPress={() => press(b)}
                accessibilityRole="button"
                accessibilityLabel={label}
                style={({ pressed }) => [styles.zoomButton, pressed && styles.pressed]}>
                <Icon name={icon} size={22} color={colors.midnight} />
              </Pressable>
            ))}
          </View>
        ) : null}

        {menu ? (
          <View style={styles.menu}>
            {menuItems.map((m) => (
              <Pressable
                key={m.label}
                onPress={() => {
                  m.onPress();
                  if (m.icon !== 'link') setMenu(false);
                }}
                accessibilityRole="button"
                style={({ pressed }) => [styles.menuItem, pressed && styles.pressed]}>
                <Icon name={m.icon} size={20} color={colors.navy} />
                <Text {...dense} style={styles.menuText}>{m.label}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        {load === 'loading' ? (
          <View style={styles.overlay} pointerEvents="none">
            <Loading label="Loading the network map" />
          </View>
        ) : null}
        {load === 'error' ? (
          <View style={[styles.overlay, styles.errorBox]}>
            <AppText variant="body" style={styles.center}>The map could not be loaded. Check your connection and try again.</AppText>
            <Button
              label="Try again"
              icon="refresh"
              onPress={() => {
                setLoad('loading');
                web.current?.reload();
              }}
            />
          </View>
        ) : null}
      </View>

      <ScrollView horizontal style={styles.chips} contentContainerStyle={styles.chipRow} showsHorizontalScrollIndicator={false}>
        <Pill label="Key" icon="key" selected={map.key} onPress={() => press('key')} accessibilityLabel="Key and filters" />
        <Pill label="List" icon="list" selected={map.list} onPress={() => press('list')} accessibilityLabel="Show the names as a list" />
        <Pill label="Timeline" icon="calendar" selected={map.timeline} onPress={() => press('timeline')} accessibilityLabel="Timeline by year" />
        {trail.length ? <Pill label="Whole map" icon="shuffle" onPress={() => press('wholeMap')} accessibilityLabel="Back to the whole map" /> : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  searchBar: { paddingHorizontal: spacing.sm, paddingTop: spacing.sm, paddingBottom: spacing.xs, backgroundColor: colors.white },
  stage: { flex: 1 },
  web: { flex: 1, backgroundColor: colors.white },
  overlay: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white },
  errorBox: { padding: spacing.lg, gap: spacing.md },
  center: { textAlign: 'center' },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  headerButton: { minWidth: touchTarget, minHeight: touchTarget, alignItems: 'center', justifyContent: 'center' },
  results: {
    position: 'absolute',
    top: 0,
    left: spacing.sm,
    right: spacing.sm,
    maxHeight: '60%',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radius.tile,
    ...shadows.card,
  },
  result: { minHeight: touchTarget + 8, justifyContent: 'center', paddingVertical: spacing.sm, paddingHorizontal: spacing.md - 4, borderBottomWidth: 1, borderBottomColor: colors.feedBorder },
  resultName: { ...type.bodyBold, color: colors.directoryNavy },
  resultMeta: { ...type.meta },
  none: { padding: spacing.md - 4 },
  pressed: { backgroundColor: colors.sand },
  zoom: {
    position: 'absolute',
    right: spacing.sm,
    bottom: spacing.sm,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radius.tile,
    overflow: 'hidden',
    ...shadows.card,
  },
  zoomButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: colors.feedBorder, backgroundColor: colors.white },
  menu: {
    position: 'absolute',
    top: 0,
    right: spacing.sm,
    minWidth: 240,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radius.tile,
    ...shadows.card,
  },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 2, minHeight: touchTarget + 4, paddingHorizontal: spacing.md },
  menuText: { ...type.smallBold, color: colors.navy },
  chips: { flexGrow: 0, borderTopWidth: 1, borderTopColor: colors.cardBorder, backgroundColor: colors.white },
  chipRow: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.sm, paddingVertical: spacing.sm, alignItems: 'center' },
});
