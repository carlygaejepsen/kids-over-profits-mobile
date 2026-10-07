import Constants from 'expo-constants';
import { openBrowserAsync } from 'expo-web-browser';
import { StyleSheet, Text, View } from 'react-native';

import { SITE } from '@/api/client';
import { Button, HubHeader, HubListRow, NoticeBox } from '@/components/site';
import { DISCLAIMER_PARAGRAPHS } from '@/components/tabs/disclaimerText';
import { TabPage } from '@/components/tabs/TabPage';
import { spacing, type } from '@/theme/typography';

const open = (path: string) => () => openBrowserAsync(`${SITE}${path}`);

const LINKS = [
  { title: 'Open data', meta: 'Download the records this app reads.', path: '/open-data/' },
  { title: 'Glossary', meta: 'Words the industry uses and what they mean.', path: '/glossary/' },
  { title: 'Privacy', meta: 'What the website keeps.', path: '/privacy-policy/' },
];

export default function AboutScreen() {
  const version = Constants.expoConfig?.version;
  return (
    <TabPage>
      <HubHeader eyebrow="About" title="Kids Over Profits" />
      <Text style={type.body}>
        Kids Over Profits tracks the troubled teen industry: the programs, the companies behind them, the deaths and findings on record, the lawsuits and the news.
      </Text>

      <View style={styles.block}>
        <NoticeBox variant="reporting" title="Report abuse">
          <Text style={type.body}>Where to report an abusive program or therapist, state by state.</Text>
          <Button label="Find where to report" icon="external" onPress={open('/report-abuse/')} style={styles.button} />
        </NoticeBox>

        <Text accessibilityRole="header" style={type.subheading}>Share information</Text>
        <Text style={type.body}>Add or correct a facility, news story, lawsuit or survivor account.</Text>
        <Button variant="secondary" label="Open the form" icon="external" onPress={open('/tti-data-submission/')} style={styles.button} />
      </View>

      <Text accessibilityRole="header" style={type.heading}>Before you rely on a record</Text>
      <View style={styles.paragraphs}>
        {DISCLAIMER_PARAGRAPHS.map((p, i) => (
          <Text key={i} style={type.body}>{p}</Text>
        ))}
      </View>

      <Text accessibilityRole="header" style={type.heading}>Data and privacy</Text>
      <View style={styles.paragraphs}>
        <Text style={type.body}>
          The data is licensed Creative Commons Attribution-ShareAlike 4.0. Credit Kids Over Profits (kidsoverprofits.org) and share what you build from it under the same license.
        </Text>
        <Text style={type.body}>
          This app has no accounts and no analytics. It only asks kidsoverprofits.org for the pages you open.
        </Text>
      </View>

      <Text accessibilityRole="header" style={type.heading}>On the website</Text>
      <View style={styles.paragraphs}>
        {LINKS.map((l) => (
          <HubListRow key={l.path} title={l.title} meta={l.meta} onPress={open(l.path)} />
        ))}
      </View>

      {version ? <Text style={[type.meta, styles.version]}>{`Version ${version}`}</Text> : null}
    </TabPage>
  );
}

const styles = StyleSheet.create({
  block: { marginTop: spacing.lg, marginBottom: spacing.xl, gap: spacing.sm },
  button: { alignSelf: 'flex-start', marginTop: spacing.xs },
  paragraphs: { gap: spacing.sm + 4, marginTop: spacing.sm, marginBottom: spacing.lg },
  version: { marginTop: spacing.sm },
});
