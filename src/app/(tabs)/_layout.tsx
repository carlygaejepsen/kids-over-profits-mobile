import { Tabs } from 'expo-router/js-tabs';
import type { ColorValue } from 'react-native';

import { Icon, type IconName } from '@/components/Icon';
import { colors } from '@/theme/colors';

const tab = (title: string, icon: IconName) => ({
  title,
  tabBarIcon: ({ color, size }: { color: ColorValue; size: number }) => <Icon name={icon} size={size} color={color} />,
  tabBarAccessibilityLabel: `${title} tab`,
});

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.midnight },
        headerTintColor: colors.white,
        headerTitleStyle: { fontWeight: '700' },
        tabBarActiveTintColor: colors.tealInk,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.white, borderTopColor: colors.borderSecondary },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
      }}>
      <Tabs.Screen name="index" options={{ ...tab('Search', 'search'), title: 'Search' }} />
      <Tabs.Screen name="news" options={tab('News', 'news')} />
      <Tabs.Screen name="places" options={tab('Places', 'map')} />
      <Tabs.Screen name="companies" options={tab('Companies', 'building')} />
      <Tabs.Screen name="about" options={tab('About', 'info')} />
    </Tabs>
  );
}
