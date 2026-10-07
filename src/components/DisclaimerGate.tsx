import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/theme/colors';
import { gutter, maxContentWidth, spacing, type } from '@/theme/typography';
import { Button, HubHeader, NoticeBox } from './site';
import { DISCLAIMER_PARAGRAPHS } from './tabs/disclaimerText';

const KEY = 'kop.disclaimer.accepted.v1';

export { DISCLAIMER_PARAGRAPHS };

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

  const [about, care, crisis] = DISCLAIMER_PARAGRAPHS;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={accept}>
      <SafeAreaView style={styles.screen}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.column}>
            <HubHeader eyebrow="Before you start" title="A research tool, not a verdict" />
            <Text style={type.body}>{about}</Text>
            <Text style={type.body}>{care}</Text>
            <NoticeBox variant="testimony" title="Take care of yourself">
              <Text style={type.body}>{crisis}</Text>
            </NoticeBox>
            <Button label="I understand" accessibilityLabel="I understand, continue" onPress={accept} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  scroll: { padding: gutter, alignItems: 'center' },
  column: { width: '100%', maxWidth: maxContentWidth, gap: spacing.md },
});
