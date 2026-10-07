import { useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { HubHeader, HubListRow, SectionBlock } from '@/components/site';
import { Note } from '@/components/tabs/Note';
import { SearchField } from '@/components/tabs/SearchField';
import { TabPage } from '@/components/tabs/TabPage';
import { countries, states, type Place } from '@/data/states';
import { spacing } from '@/theme/typography';

export default function PlacesScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState('');
  const open = (p: Place) => router.push(`/place/${p.slug}?kind=${p.kind}` as Href);
  const word = filter.trim().toLowerCase();
  const keep = (p: Place) => !word || p.name.toLowerCase().includes(word) || (p.code ?? '').toLowerCase() === word;
  const shownStates = states.filter(keep);
  const shownCountries = countries.filter(keep);

  return (
    <TabPage>
      <HubHeader eyebrow="Browse" title="States and countries" />
      <SearchField value={filter} onChangeText={setFilter} placeholder="Filter states and countries" label="Filter the list of states and countries" />
      <View style={styles.lists}>
        <SectionBlock
          id="states"
          title="States"
          icon="map-pin"
          items={shownStates}
          limit={shownStates.length}
          renderItem={(p) => <HubListRow title={p.name} meta={p.code} onPress={() => open(p)} />}
        />
        <SectionBlock
          id="countries"
          title="Other countries"
          icon="globe"
          items={shownCountries}
          limit={shownCountries.length}
          renderItem={(p) => <HubListRow title={p.name} onPress={() => open(p)} />}
        />
        {!shownStates.length && !shownCountries.length ? <Note>{`No place matches "${filter.trim()}".`}</Note> : null}
      </View>
    </TabPage>
  );
}

const styles = StyleSheet.create({
  lists: { marginTop: spacing.lg },
});
