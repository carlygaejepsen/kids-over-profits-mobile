import { useRouter, type Href } from 'expo-router';

import { Row, Screen, Section } from '@/components/ui';
import { countries, states, type Place } from '@/data/states';

export default function PlacesScreen() {
  const router = useRouter();
  const open = (p: Place) => router.push(`/place/${p.slug}?kind=${p.kind}` as Href);
  return (
    <Screen>
      <Section title="States" count={states.length}>
        {states.map((s) => (
          <Row key={s.slug} title={s.name} lines={[s.code ?? '']} onPress={() => open(s)} />
        ))}
      </Section>
      <Section title="Other countries" count={countries.length}>
        {countries.map((c) => (
          <Row key={c.slug} title={c.name} onPress={() => open(c)} />
        ))}
      </Section>
    </Screen>
  );
}
