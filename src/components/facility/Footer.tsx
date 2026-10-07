import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import type { FacilityPayload } from '@/api/types';
import { SITE } from '@/api/client';
import { colors } from '@/theme/colors';
import { spacing, type } from '@/theme/typography';
import { Button, NoticeBox, useOpenLink } from '../site';
import { OpenOnSite } from '../ui';
import { isClosed } from './model';

const REPORT_ABUSE = `${SITE}/report-abuse/`;

/** "Reporting this program": the template's closed and open wordings, and a button to the reporting directory. */
export function ReportingNotice({ f }: { f: FacilityPayload }) {
  const open = useOpenLink();
  const state = f.state_name || f.state_code;
  const channels = state ? `${state} reporting channels` : 'reporting channels';
  return (
    <NoticeBox variant="reporting" title="Reporting this program">
      {isClosed(f) ? (
        <>
          <Text style={styles.body}>
            {`This program closed${f.end_year ? ` in ${f.end_year}` : ''}, so the state agency that licensed it can no longer act against it. Other channels may still be able to: the boards that license the people who worked here, law enforcement, and the civil courts.`}
          </Text>
          <Text style={styles.body}>
            {`The ${channels} list each one and what it can do. Time limits depend on the state, the kind of harm and the survivor's age, and many states have lengthened or removed them for child sexual abuse, so a program closing long ago does not by itself mean it is too late. Laws change, so the time limits we list were correct when we checked them but may have been updated since; a lawyer can tell you where things stand now.`}
          </Text>
        </>
      ) : (
        <Text style={styles.body}>
          {`If something happened here, the ${channels} list who can act and what each one can actually do - the board that licenses the therapist, the agency that licenses the program, and the bodies with a right to investigate it.`}
        </Text>
      )}
      <Button label={`See the ${channels}`} onPress={() => open(REPORT_ABUSE)} style={styles.button} />
    </NoticeBox>
  );
}

export function FacilityFooter({ f }: { f: FacilityPayload }) {
  const router = useRouter();
  return (
    <View style={styles.footer}>
      {f.updated_label ? <Text style={styles.meta}>{`Record updated ${f.updated_label}.`}</Text> : null}
      <Text style={styles.meta}>Generated from the Kids Over Profits facility database.</Text>
      <OpenOnSite url={f.url} />
      <Button
        variant="secondary"
        label="Suggest a correction"
        icon="send"
        accessibilityLabel={`Suggest a correction to ${f.name}`}
        onPress={() =>
          router.push({ pathname: '/send', params: { mode: 'correction', facility_id: String(f.id), facility: f.name, ts: String(Date.now()) } })
        }
        style={styles.button}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  body: { ...type.body },
  meta: { ...type.meta },
  button: { alignSelf: 'flex-start', marginTop: spacing.xs },
  footer: { borderTopWidth: 1, borderTopColor: colors.cardBorder, paddingTop: spacing.md, gap: spacing.sm },
});
