import { Fragment } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { FacilityPayload, InspectionReport } from '@/api/types';
import { colors } from '@/theme/colors';
import { spacing, type } from '@/theme/typography';
import { Button, SectionBlock, useOpenLink } from '../site';
import { hitSlopFor } from '../site/metrics';
import type { SectionProps } from './model';
import { FactList, Lead, card } from './parts';

type Item = { kind: 'summary' } | { kind: 'report'; r: InspectionReport };

function summaryRows(f: FacilityPayload) {
  const s = f.inspections?.summary;
  if (!s) return [];
  const names = s.licensed_names ?? [];
  const showNames = names.length > 1 || (names.length === 1 && names[0].toLowerCase() !== f.name.toLowerCase());
  const addresses = s.addresses ?? [];
  return [
    { label: 'Licensed as', value: showNames ? names.join('; ') : '' },
    { label: 'Program', value: s.licensed_program_name },
    { label: 'License category', value: s.program_category },
    { label: 'Executive director', value: s.executive_director },
    { label: 'Licensed capacity', value: s.bed_capacity },
    { label: 'License expires', value: s.license_expiration },
    { label: 'Relicensing visit', value: s.relicense_visit_date },
    { label: 'Licensing action', value: s.licensing_action },
    { label: 'Phone on file', value: s.phone },
    { label: addresses.length > 1 ? 'Licensed addresses' : 'Licensed address', value: addresses.join('; ') },
  ];
}

function Report({ r }: { r: InspectionReport }) {
  const open = useOpenLink();
  const label = r.date_label || r.date || 'Undated';
  return (
    <View style={styles.report}>
      <Text style={styles.date}>{label}</Text>
      {r.summary ? <Text style={styles.body}>{r.summary}</Text> : null}
      {r.findings.slice(0, 5).map((fi, i) => (
        <Text key={i} style={styles.finding}>
          {fi.label ? <Text style={styles.findingLabel}>{`${fi.label}: `}</Text> : null}
          {fi.text}
        </Text>
      ))}
      {r.url ? (
        <Pressable
          onPress={() => open(r.url)}
          accessibilityRole="link"
          accessibilityLabel={`Read the report, ${label}`}
          hitSlop={hitSlopFor(type.smallBold.lineHeight!)}
          style={styles.link}>
          <Text style={styles.linkText}>Read the report</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/** Licence summary, how many reports there are, and the newest reports with their findings. */
export function InspectionsSection({ f, onLayoutY }: SectionProps & { f: FacilityPayload }) {
  const open = useOpenLink();
  const insp = f.inspections;
  if (!insp) return null;
  const items: Item[] = [{ kind: 'summary' }, ...insp.reports.map((r): Item => ({ kind: 'report', r }))];
  return (
    <SectionBlock id="inspections" title="Licensing and inspections" icon="clipboard" items={items} count={insp.total || insp.reports.length} limit={6} onLayoutY={onLayoutY}
      renderItem={(it) =>
        it.kind === 'report' ? (
          <Report r={it.r} />
        ) : (
          <Fragment>
            <FactList rows={summaryRows(f)} />
            {insp.total > 0 ? (
              <Lead>{`${insp.total} inspection ${insp.total === 1 ? 'report' : 'reports'} on file.`}</Lead>
            ) : null}
            {insp.more > 0 && insp.page_url ? (
              <Button variant="secondary" label={`See all ${insp.total} reports on the website`} onPress={() => open(insp.page_url)} style={styles.button} />
            ) : null}
          </Fragment>
        )
      }
    />
  );
}

const styles = StyleSheet.create({
  report: { ...card, paddingVertical: 10, paddingHorizontal: 13, gap: spacing.xs + 2 },
  date: { ...type.bodyBold },
  body: { ...type.body },
  finding: { ...type.small },
  findingLabel: { ...type.smallBold, color: colors.navy },
  link: { alignSelf: 'flex-start' },
  linkText: { ...type.smallBold, color: colors.navy, textDecorationLine: 'underline' },
  button: { alignSelf: 'flex-start', marginTop: spacing.sm },
});
