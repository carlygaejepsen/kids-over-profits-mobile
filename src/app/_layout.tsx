import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DisclaimerGate } from '@/components/DisclaimerGate';
import { colors } from '@/theme/colors';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

const theme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: colors.bgPrimary, card: colors.midnight, text: colors.white, primary: colors.teal, border: colors.borderSecondary },
};

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider value={theme}>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: colors.midnight },
              headerTintColor: colors.white,
              headerTitleStyle: { fontWeight: '700' },
              headerBackButtonDisplayMode: 'minimal',
              contentStyle: { backgroundColor: colors.bgPrimary },
            }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="facility/[slug]" options={{ title: 'Facility' }} />
            <Stack.Screen name="operator/[slug]" options={{ title: 'Company' }} />
            <Stack.Screen name="place/[slug]" options={{ title: 'Place' }} />
          </Stack>
          <DisclaimerGate />
        </ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
