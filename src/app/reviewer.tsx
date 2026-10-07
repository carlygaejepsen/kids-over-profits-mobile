import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { testCredentials } from '@/api/submit';
import { Field, FormSection as Section, Notice } from '@/components/form';
import { Button, HubHeader } from '@/components/site';
import { TabPage } from '@/components/tabs/TabPage';
import { clearCredentials, saveCredentials, useCredentials } from '@/lib/credentials';
import { spacing, type } from '@/theme/typography';

/** Sign-in for the site's reviewers: a WordPress username and an application password, kept only in secure storage. */
export default function ReviewerScreen() {
  const { creds, ready, reload } = useCredentials();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ kind: 'ok' | 'error' | 'info'; text: string } | null>(null);

  const entered = { username: username.trim(), appPassword: password.replace(/\s+/g, '') };
  const active = creds ?? (entered.username && entered.appPassword ? entered : null);

  const test = async () => {
    if (!active) {
      setNote({ kind: 'error', text: 'Enter a username and an application password first.' });
      return;
    }
    setBusy(true);
    const r = await testCredentials(active);
    setBusy(false);
    setNote(r.ok ? { kind: 'ok', text: `Signed in as ${r.user}.` } : { kind: 'error', text: r.message });
  };

  const save = async () => {
    if (!entered.username || !entered.appPassword) {
      setNote({ kind: 'error', text: 'Enter a username and an application password.' });
      return;
    }
    setBusy(true);
    const r = await testCredentials(entered);
    if (!r.ok) {
      setBusy(false);
      setNote({ kind: 'error', text: r.message });
      return;
    }
    const stored = await saveCredentials(entered);
    setBusy(false);
    if (!stored) {
      setNote({ kind: 'error', text: 'This device could not store the login securely, so it was not saved.' });
      return;
    }
    setPassword('');
    await reload();
    setNote({ kind: 'ok', text: `Signed in as ${r.user}. Links you send now go straight to the review queues.` });
  };

  const signOut = async () => {
    await clearCredentials();
    setUsername('');
    setPassword('');
    await reload();
    setNote({ kind: 'info', text: 'Signed out. This device no longer holds the login.' });
  };

  return (
    <TabPage>
      <HubHeader eyebrow="Send" title="Reviewer sign-in" />
      <Section title="Sign in">
        <>
          <Text style={type.body}>
            For the site&apos;s reviewers. Create an application password in WordPress under Users, Profile, Application Passwords, then enter it here. The login stays in this device&apos;s secure storage.
          </Text>
          <Text style={type.body}>Everyone else can send links and facility information without signing in.</Text>
        </>

        {ready && creds ? (
          <Notice kind="ok" title={`Signed in as ${creds.username}`} />
        ) : (
          <>
            <Field label="WordPress username" value={username} onChangeText={setUsername} autoCapitalize="none" />
            <Field label="Application password" value={password} onChangeText={setPassword} autoCapitalize="none" secure />
          </>
        )}

        {note ? <Notice kind={note.kind}>{note.text}</Notice> : null}

        {!creds ? <Button label={busy ? 'Checking' : 'Sign in'} onPress={save} disabled={busy} style={styles.button} /> : null}
        <Button label={busy ? 'Checking' : 'Test'} variant="secondary" onPress={test} disabled={busy} style={styles.button} />
        {creds ? <Button label="Sign out" variant="secondary" onPress={signOut} disabled={busy} style={styles.button} /> : null}
      </Section>
    </TabPage>
  );
}

const styles = StyleSheet.create({
  button: { alignSelf: 'flex-start', marginBottom: spacing.xs },
});
