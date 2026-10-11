import { useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Path, Text as SvgText } from 'react-native-svg';

import type { FacilityPayload, NetworkLink } from '@/api/types';
import { colors } from '@/theme/colors';
import { spacing, type } from '@/theme/typography';
import { Button, HubListRow, SectionBlock } from '../site';
import type { SectionProps } from './model';
import { Lead, SubHead } from './parts';

/** Names drawn around the facility; the rest are on the full map (and in the list under the drawing). */
export const DRAW_MAX = 16;
const ROW = 34;
const PAD = 18;
const SPREAD = 46;
const LABEL_CHARS = 22;
/** SVG text on the web defaults to a serif face; phones draw it in the system font already. */
const LABEL_FONT = Platform.OS === 'web' ? 'system-ui, sans-serif' : undefined;

/** Each kind of name's dot, in ink shades (3:1 on white): programs teal, companies orange, people navy, the rest grey. */
export function kindColor(kind: string): string {
  if (kind === 'facility') return colors.tealInk;
  if (kind === 'parent') return colors.orangeInk;
  if (kind === 'person') return colors.navy;
  return colors.textMuted;
}

const KIND_WORDS: [string, string][] = [['facility', 'Program'], ['parent', 'Company'], ['person', 'Person'], ['other', 'Other']];

export type PlacedName = { link: NetworkLink; x: number; y: number; side: 'left' | 'right' };

/**
 * Where each name sits: the facility in the middle, its names in two columns either side of it, labels
 * outward, so no label can cover another however many there are. Companies and programs come before
 * people, renames first of all; past DRAW_MAX the rest are counted in `more`.
 */
export function connectionsLayout(links: NetworkLink[], width: number, max = DRAW_MAX) {
  const rank = (l: NetworkLink) => (l.relation === 'became' || l.relation === 'formerly' ? 0 : l.kind === 'person' ? 2 : 1);
  const ordered = [...links].sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name));
  const shown = ordered.slice(0, max);
  const rows = Math.max(1, Math.ceil(shown.length / 2));
  const height = rows * ROW + PAD * 2;
  const cx = width / 2;
  const placed: PlacedName[] = shown.map((link, i) => {
    const side = i % 2 === 0 ? 'left' : 'right';
    const row = Math.floor(i / 2);
    // A lone name on its side is drawn level with the facility.
    const count = side === 'left' ? Math.ceil(shown.length / 2) : Math.floor(shown.length / 2);
    const top = (height - count * ROW) / 2;
    return { link, side, x: side === 'left' ? cx - SPREAD : cx + SPREAD, y: top + row * ROW + ROW / 2 };
  });
  return { placed, height, center: { x: cx, y: height / 2 }, more: ordered.length - shown.length };
}

export function shortLabel(name: string, chars = LABEL_CHARS): string {
  return name.length > chars ? `${name.slice(0, chars - 1).trimEnd()}…` : name;
}

/**
 * The facility on the network map (template: the 'network' section): a drawing of the names around it, each
 * opening the Map tab on that name, then the website's list (renames, owners, acquisitions, ...) with links
 * to their pages. People are on the page as staff cards, so the list leaves them out, as the website does.
 */
export function ConnectionsSection({ f, onLayoutY }: SectionProps & { f: FacilityPayload }) {
  const router = useRouter();
  const [width, setWidth] = useState(0);
  const net = f.network;
  if (!net || !net.links.length) return null;

  const openOnMap = (node: string) => router.push({ pathname: '/map', params: { open: node } } as Href);
  const { placed, height, center, more } = connectionsLayout(net.links, width || 340);
  const kinds = KIND_WORDS.filter(([k]) => net.links.some((l) => (k === 'other' ? !['facility', 'parent', 'person'].includes(l.kind) : l.kind === k)));

  const groups = new Map<string, NetworkLink[]>();
  for (const l of net.links) {
    if (l.group === 'People') continue;
    if (!groups.has(l.group)) groups.set(l.group, []);
    groups.get(l.group)!.push(l);
  }
  const listed = [...groups.entries()].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));
  const people = net.links.length - net.links.filter((l) => l.group !== 'People').length;

  return (
    <SectionBlock id="network" title="Connections" icon="shuffle" count={net.links.length} onLayoutY={onLayoutY}>
      <Lead>Names tied to this program on the network map. A line means a relationship was documented, not an allegation of wrongdoing.</Lead>
      <View
        style={styles.stage}
        onLayout={(e) => setWidth(Math.round(e.nativeEvent.layout.width))}
        accessible
        accessibilityRole="image"
        accessibilityLabel={`Map of ${net.name} and ${net.links.length} ${net.links.length === 1 ? 'name' : 'names'} around it; they are listed below.`}>
        {width ? (
          <Svg width={width} height={height}>
            {placed.map((p) => {
              const dashed = p.link.relation !== '';
              const mid = (center.x + p.x) / 2;
              return (
                <Path
                  key={`l-${p.link.node}`}
                  d={`M${center.x},${center.y} C${mid},${center.y} ${mid},${p.y} ${p.x},${p.y}`}
                  stroke={colors.textMuted}
                  strokeWidth={dashed ? 2 : 1.5}
                  strokeDasharray={dashed ? '5,4' : undefined}
                  fill="none"
                />
              );
            })}
            {placed.map((p) => (
              <G key={`n-${p.link.node}`} onPress={() => openOnMap(p.link.node)}>
                <Circle cx={p.x} cy={p.y} r={p.link.kind === 'person' ? 6 : 8} fill={kindColor(p.link.kind)} stroke={colors.white} strokeWidth={2} />
                <SvgText
                  x={p.side === 'left' ? p.x - 12 : p.x + 12}
                  y={p.y + 4}
                  fontSize={12}
                  fontFamily={LABEL_FONT}
                  fill={colors.midnight}
                  textAnchor={p.side === 'left' ? 'end' : 'start'}>
                  {shortLabel(p.link.name, Math.max(10, Math.floor((width / 2 - SPREAD - 16) / 6.4)))}
                </SvgText>
                {/* A bigger target than the dot, for a finger. */}
                <Circle cx={p.x} cy={p.y} r={16} fill="transparent" />
              </G>
            ))}
            <G onPress={() => openOnMap(net.node)}>
              <Circle cx={center.x} cy={center.y} r={13} fill={colors.midnight} stroke={colors.teal} strokeWidth={3} />
            </G>
          </Svg>
        ) : (
          <View style={{ height }} />
        )}
      </View>
      <View style={styles.legend}>
        <View style={styles.key}>
          <View style={[styles.dot, styles.self]} />
          <Text style={styles.keyText}>{shortLabel(net.name, 40)}</Text>
        </View>
        {kinds.map(([k, label]) => (
          <View key={k} style={styles.key}>
            <View style={[styles.dot, { backgroundColor: kindColor(k) }]} />
            <Text style={styles.keyText}>{label}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.caption}>
        {`Tap a name to open it on the full map.${more > 0 ? ` ${more} more ${more === 1 ? 'name is' : 'names are'} on the map.` : ''}`}
      </Text>
      <Button label="Open on the full map" icon="shuffle" onPress={() => openOnMap(net.node)} />

      {listed.map(([group, items], gi) => (
        <View key={group} style={styles.group}>
          <SubHead first={gi === 0}>{group}</SubHead>
          {items.map((l) => (
            <HubListRow key={l.node} title={l.name} meta={l.role || undefined} url={l.url || undefined} onPress={l.url ? undefined : () => openOnMap(l.node)} />
          ))}
        </View>
      ))}
      {people > 0 && listed.length ? (
        <Text style={styles.caption}>{`${people} ${people === 1 ? 'person' : 'people'} on the map ${people === 1 ? 'is' : 'are'} listed under Staff.`}</Text>
      ) : null}
    </SectionBlock>
  );
}

const styles = StyleSheet.create({
  stage: { marginTop: spacing.sm, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.feedBorder, borderRadius: 8, overflow: 'hidden' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.sm },
  key: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  dot: { width: 12, height: 12, borderRadius: 6 },
  self: { backgroundColor: colors.midnight, borderWidth: 2, borderColor: colors.teal },
  keyText: { ...type.meta },
  caption: { ...type.meta, marginVertical: spacing.sm },
  group: { gap: spacing.xs, marginTop: spacing.sm },
});
