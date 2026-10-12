import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { signOutEverywhere, useAdminTools, type AdminTool } from '@/api/admin';
import { Button, HubHeader, HubListRow, NoticeBox } from '@/components/site';
import { SearchField } from '@/components/tabs/SearchField';
import { TabPage } from '@/components/tabs/TabPage';
import { ErrorState, Loading } from '@/components/ui';
import { clearAdminSession } from '@/lib/adminSession';
import { useCredentials } from '@/lib/credentials';
import { spacing, type } from '@/theme/typography';

/** Tools grouped by their KOP Tools category, in the order the site lists them, filtered by `q`. */
export function groupTools(tools: AdminTool[], q: string): { category: string; tools: AdminTool[] }[] {
  const needle = q.trim().toLowerCase();
  const groups: { category: string; tools: AdminTool[] }[] = [];
  for (const t of tools) {
    if (needle && !`${t.title} ${t.desc} ${t.category}`.toLowerCase().includes(needle)) continue;
    let g = groups.find((x) => x.category === t.category);
    if (!g) groups.push((g = { category: t.category, tools: [] }));
    g.tools.push(t);
  }
  return groups;
}

/**
 * Admin mode: every KOP Tools screen, opened in the app signed in to WordPress (admin-tool.tsx). The tab is
 * only shown to an administrator's login (see the tabs layout).
 */
export default function AdminScreen() {
  const router = useRouter();
  const { creds } = useCredentials();
  const tools = useAdminTools(creds);
  const [q, setQ] = useState('');
  const [note, setNote] = useState('');
  const groups = useMemo(() => groupTools(tools.data?.tools ?? [], q), [tools.data, q]);

  const confirmSignOut = () => {
    if (!creds) return;
    Alert.alert(
      'Sign out everywhere?',
      'This ends every WordPress session of your account: this phone, and every computer and browser. The app signs in again the next time you open a tool.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign out everywhere',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOutEverywhere(creds);
              await clearAdminSession();
              setNote('Signed out of WordPress everywhere.');
            } catch (e) {
              setNote((e as Error).message);
            }
          },
        },
      ],
    );
  };

  return (
    <TabPage>
      <HubHeader eyebrow="Admin" title="KOP Tools" standfirst={tools.data ? `Signed in as ${tools.data.user}` : undefined} />
      {!creds ? (
        <View style={styles.block}>
          <Text style={type.body}>Sign in with an administrator&apos;s application password to use the site&apos;s tools here.</Text>
          <Button label="Reviewer sign-in" onPress={() => router.push('/reviewer')} style={styles.button} />
        </View>
      ) : tools.isLoading ? (
        <Loading label="Loading the tools" />
      ) : tools.isError ? (
        <ErrorState message={(tools.error as Error).message} onRetry={() => tools.refetch()} />
      ) : (
        <>
          <SearchField value={q} onChangeText={setQ} placeholder="Find a tool" label="Find a tool" />
          {groups.map((g) => (
            <View key={g.category} style={styles.block}>
              <Text accessibilityRole="header" style={type.heading}>{g.category}</Text>
              {g.tools.map((t) => (
                <HubListRow
                  key={`${t.title}|${t.url}`}
                  title={t.title}
                  meta={t.desc}
                  onPress={() => router.push({ pathname: '/admin-tool', params: { url: t.url, title: t.title } })}
                />
              ))}
            </View>
          ))}
          {groups.length === 0 ? <Text style={type.body}>No tool matches.</Text> : null}

          <NoticeBox variant="reporting" title="Your WordPress sessions">
            <Text style={type.body}>
              Tools open signed in for a year on this phone. Revoking this app&apos;s application password in WordPress (Users, Profile) ends its session at once.
            </Text>
            <Button variant="secondary" label="Sign out everywhere" onPress={confirmSignOut} style={styles.button} />
            {note ? <Text style={type.body}>{note}</Text> : null}
          </NoticeBox>
        </>
      )}
    </TabPage>
  );
}

const styles = StyleSheet.create({
  block: { marginTop: spacing.lg, gap: spacing.sm },
  button: { alignSelf: 'flex-start', marginTop: spacing.xs },
});
