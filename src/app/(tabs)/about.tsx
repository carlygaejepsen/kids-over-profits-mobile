import { openBrowserAsync } from 'expo-web-browser';
import { Pressable, StyleSheet, View } from 'react-native';

import { SITE } from '@/api/client';
import { DISCLAIMER_PARAGRAPHS } from '@/components/DisclaimerGate';
import { Icon } from '@/components/Icon';
import { AppText, Card, Screen, Section } from '@/components/ui';
import { colors } from '@/theme/colors';
import { spacing, touchTarget } from '@/theme/typography';

const LINKS = [
  { label: 'Report abuse', note: 'Where to report an abusive program or therapist, state by state.', path: '/report-abuse/' },
  { label: 'Share information', note: 'Add or correct a facility, news story, lawsuit or survivor account.', path: '/tti-data-submission/' },
  { label: 'Open data', note: 'Download the records this app reads.', path: '/open-data/' },
  { label: 'Glossary', note: 'Words the industry uses and what they mean.', path: '/glossary/' },
  { label: 'Privacy', note: 'What the website keeps.', path: '/privacy-policy/' },
];

export default function AboutScreen() {
  return (
    <Screen>
      <Section title="About Kids Over Profits">
        <Card>
          <AppText variant="body">
            Kids Over Profits tracks the troubled teen industry: the programs, the companies behind them, the deaths and findings on record, the lawsuits and the news.
          </AppText>
        </Card>
      </Section>

      <Section title="Before you rely on a record">
        <Card>
          {DISCLAIMER_PARAGRAPHS.map((p, i) => (
            <AppText key={i} variant="body">{p}</AppText>
          ))}
        </Card>
      </Section>

      <Section title="On the website">
        {LINKS.map((l) => (
          <Pressable
            key={l.path}
            onPress={() => openBrowserAsync(`${SITE}${l.path}`)}
            accessibilityRole="link"
            accessibilityLabel={`${l.label}. ${l.note} Opens the website.`}
            style={({ pressed }) => [styles.link, pressed && { opacity: 0.7 }]}>
            <Card style={styles.linkCard}>
              <Icon name="external" size={20} color={colors.tealInk} />
              <View style={styles.linkText}>
                <AppText variant="bodyBold" style={{ color: colors.tealInk }}>{l.label}</AppText>
                <AppText variant="small" muted>{l.note}</AppText>
              </View>
            </Card>
          </Pressable>
        ))}
      </Section>

      <Section title="Data and privacy">
        <Card>
          <AppText variant="body">
            The data is licensed Creative Commons Attribution-ShareAlike 4.0. Credit Kids Over Profits (kidsoverprofits.org) and share what you build from it under the same license.
          </AppText>
          <AppText variant="body">
            This app has no accounts and no analytics. It only asks kidsoverprofits.org for the pages you open.
          </AppText>
        </Card>
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  link: { minHeight: touchTarget },
  linkCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  linkText: { flex: 1, gap: 2 },
});
