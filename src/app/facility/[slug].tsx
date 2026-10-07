import { Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useRef } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useFacility } from '@/api/queries';
import type { FacilityPayload } from '@/api/types';
import { FacilityFooter, ReportingNotice } from '@/components/facility/Footer';
import { Glance } from '@/components/facility/Glance';
import { HeaderBlock, Summary } from '@/components/facility/HeaderBlock';
import { InspectionsSection } from '@/components/facility/InspectionsSection';
import { presentSections, statTiles } from '@/components/facility/model';
import { PracticesSection, StaffSection } from '@/components/facility/PeopleSections';
import {
  ErasSection, HomesSection, IncidentsSection, LawsuitsSection, MemorialsSection, NewsSection,
  SiblingsSection, VideosSection, ViolationsSection,
} from '@/components/facility/RecordSections';
import { ResourcesSection } from '@/components/facility/ResourcesSection';
import { DocumentsSection, ForumSection, NotesSection, TestimonySection, WikiSection } from '@/components/facility/VoiceSections';
import { ErrorState, Loading } from '@/components/ui';
import { JumpPills, StatTiles } from '@/components/site';
import { colors } from '@/theme/colors';
import { gutter, maxContentWidth, spacing } from '@/theme/typography';

function FacilityBody({ f }: { f: FacilityPayload }) {
  const scroller = useRef<ScrollView>(null);
  const offsets = useRef<Record<string, number>>({});
  const listY = useRef(0);
  const onLayoutY = useCallback((id: string, y: number) => {
    offsets.current[id] = y;
  }, []);
  const jump = useCallback((key: string) => {
    const y = offsets.current[key];
    if (y !== undefined) scroller.current?.scrollTo({ y: Math.max(0, listY.current + y - spacing.sm), animated: true });
  }, []);

  const sections = presentSections(f);
  const tiles = statTiles(f).filter((t) => t.count > 0);
  const p = { f, onLayoutY };

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <ScrollView ref={scroller} contentContainerStyle={styles.scroll}>
        <View style={styles.column}>
          <HeaderBlock f={f} />
          <Summary text={f.summary} />
          {tiles.length >= 2 ? <StatTiles tiles={tiles} onJump={jump} /> : null}
          {sections.length > 1 ? <JumpPills items={sections.map((s) => ({ key: s.id, label: s.label }))} onJump={jump} /> : null}
          <Glance f={f} />
          <View onLayout={(e) => { listY.current = e.nativeEvent.layout.y; }}>
            <ErasSection {...p} />
            <HomesSection {...p} />
            <MemorialsSection {...p} />
            <ViolationsSection {...p} />
            <LawsuitsSection {...p} />
            <IncidentsSection {...p} />
            <NewsSection {...p} />
            <VideosSection {...p} />
            <StaffSection {...p} />
            <PracticesSection {...p} />
            <InspectionsSection {...p} />
            <DocumentsSection {...p} />
            <TestimonySection {...p} />
            <ForumSection {...p} />
            <NotesSection {...p} />
            <WikiSection {...p} />
            <SiblingsSection {...p} />
            <ResourcesSection {...p} />
          </View>
          <ReportingNotice f={f} />
          <FacilityFooter f={f} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default function FacilityScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const query = useFacility(slug);
  const name = query.data?.name;

  return (
    <>
      <Stack.Screen options={{ title: name ?? 'Facility' }} />
      {query.isLoading ? (
        <Loading label="Loading facility" />
      ) : query.isError ? (
        <ErrorState message={(query.error as Error).message} onRetry={() => query.refetch()} />
      ) : query.data ? (
        <FacilityBody f={query.data} />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  scroll: { alignItems: 'center' },
  column: { width: '100%', maxWidth: maxContentWidth, paddingHorizontal: gutter, paddingTop: spacing.md, paddingBottom: spacing.xl },
});
