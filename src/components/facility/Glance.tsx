import { Text } from 'react-native';

import type { FacilityPayload } from '@/api/types';
import { colors } from '@/theme/colors';
import { type } from '@/theme/typography';
import { GlanceBox, useOpenLink, type GlanceRow } from '../site';
import { factText } from './model';

/** "At a glance": addresses, former locations, then every fact with its sources; the operator links to its page. */
export function Glance({ f }: { f: FacilityPayload }) {
  const open = useOpenLink();
  const rows: GlanceRow[] = [];
  if (f.addresses.length) {
    rows.push({ label: f.addresses.length > 1 ? 'Addresses' : 'Address', value: f.addresses.join('\n') });
  }
  if (f.former_locations.length) {
    rows.push({
      label: 'Former locations',
      value: f.former_locations.map((l) => `${l.line}${l.years ? ` (${l.years})` : ''}`).join('\n'),
      sources: f.fact_sources?.former_locations,
    });
  }
  const facts = f.facts.some((x) => x.label === 'Operator') || !f.operator?.name
    ? f.facts
    : [...f.facts, { label: 'Operator', value: f.operator.name }];
  for (const fact of facts) {
    const text = factText(fact.value);
    if (!text) continue;
    const sources = f.fact_sources?.[fact.label];
    if (fact.label === 'Operator' && f.operator?.url) {
      rows.push({
        label: fact.label,
        value: (
          <Text
            onPress={() => open(f.operator.url)}
            accessibilityRole="link"
            style={{ ...type.body, fontWeight: '600', color: colors.navy }}>
            {text}
          </Text>
        ),
        sources,
      });
    } else {
      rows.push({ label: fact.label, value: text, sources });
    }
  }
  return <GlanceBox rows={rows} />;
}
