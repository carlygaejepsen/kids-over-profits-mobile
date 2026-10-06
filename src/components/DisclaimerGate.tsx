import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/theme/colors';
import { maxContentWidth, radius, spacing, touchTarget } from '@/theme/typography';
import { AppText } from './ui';

const KEY = 'kop.disclaimer.accepted.v1';

export const DISCLAIMER_PARAGRAPHS = [
  'Kids Over Profits collects public records, news reports, lawsuits and survivor accounts about the troubled teen industry. It is a research tool, not a rating or a legal finding.',
  'A record can be out of date or incomplete. Check a program with its state licensing agency before you rely on it, and read the sources behind each entry.',
  'Some pages describe abuse and death. Take breaks if you need them. If a child is in danger now, call 911. The Childhelp National Child Abuse Hotline is 1-800-422-4453.',
];

/** Shown once, the first time the app opens. */
export function DisclaimerGate() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((v) => setVisible(v !== 'yes'))
      .catch(() => setVisible(true));
  }, []);

  const accept = () => {
    setVisible(false);
    AsyncStorage.setItem(KEY, 'yes').catch(() => undefined);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={accept}>
      <SafeAreaView style={styles.screen}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.column}>
            <AppText variant="title" accessibilityRole="header">Before you start</AppText>
            {DISCLAIMER_PARAGRAPHS.map((p, i) => (
              <AppText key={i} variant="body">{p}</AppText>
            ))}
            <Pressable onPress={accept} accessibilityRole="button" accessibilityLabel="I understand, continue" style={({ pressed }) => [styles.button, pressed && { opacity: 0.8 }]}>
              <AppText variant="bodyBold" style={styles.buttonText}>I understand</AppText>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgPrimary },
  scroll: { padding: spacing.lg, alignItems: 'center' },
  column: { width: '100%', maxWidth: maxContentWidth, gap: spacing.md },
  button: {
    minHeight: touchTarget,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.tealFill,
    borderRadius: radius.md,
    marginTop: spacing.md,
  },
  buttonText: { color: colors.white },
});
