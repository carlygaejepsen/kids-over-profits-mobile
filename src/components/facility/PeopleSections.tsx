import { StyleSheet, View } from 'react-native';

import type { FacilityPayload } from '@/api/types';
import { PersonCard, SectionBlock } from '../site';
import { staffRows, type SectionProps } from './model';
import { Bullets, SubHead } from './parts';

/** Staff in the site's groups: each person once (name, role, source, career), the group's sub-head over its first. */
export function StaffSection({ f, onLayoutY }: SectionProps & { f: FacilityPayload }) {
  const rows = staffRows(f.staff);
  return (
    <SectionBlock id="staff" title="Staff" icon="users" items={rows} limit={6} onLayoutY={onLayoutY}
      renderItem={(row, i) => (
        <View>
          {row.head ? <SubHead first={i === 0}>{row.head}</SubHead> : null}
          <PersonCard entry={row.entry} style={row.head ? styles.afterHead : styles.person} />
        </View>
      )}
    />
  );
}

export function PracticesSection({ f, onLayoutY }: SectionProps & { f: FacilityPayload }) {
  return (
    <SectionBlock id="practices" title="Reported practices" icon="clipboard" items={f.practices} onLayoutY={onLayoutY}
      renderItem={(g) => (
        <View style={styles.group}>
          {g.label ? <SubHead first>{g.label}</SubHead> : null}
          <Bullets items={g.items} />
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  person: { marginBottom: 2 },
  afterHead: { marginTop: 8, marginBottom: 2 },
  group: { gap: 6 },
});
