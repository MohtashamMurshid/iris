import {
  Rajdhani_400Regular,
  Rajdhani_500Medium,
  Rajdhani_600SemiBold,
  Rajdhani_700Bold,
  useFonts,
} from "@expo-google-fonts/rajdhani";
import { DarkTheme, Stack, ThemeProvider } from "expo-router";
import Head from "expo-router/head";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";

import { IrisColors } from "@/constants/theme";

void SplashScreen.preventAutoHideAsync().catch(() => undefined);

const irisNavigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: IrisColors.opticalBlack,
    border: IrisColors.line,
    card: IrisColors.carbon,
    primary: IrisColors.signalRed,
    text: IrisColors.chalk,
  },
};

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Rajdhani_400Regular,
    Rajdhani_500Medium,
    Rajdhani_600SemiBold,
    Rajdhani_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      void SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [fontError, fontsLoaded]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <ThemeProvider value={irisNavigationTheme}>
      <Head>
        <title>Iris Camera</title>
        <meta
          name="description"
          content="A private camera with manual controls and original Iris Looks."
        />
        <meta name="theme-color" content="#050506" />
      </Head>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="explore" />
      </Stack>
    </ThemeProvider>
  );
}
