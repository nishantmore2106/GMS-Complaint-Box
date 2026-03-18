import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppProvider } from "@/context/AppContext";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="complaint/[id]"
        options={{
          headerShown: true,
          headerTitle: "Complaint Details",
          headerBackTitle: "Back",
          headerStyle: { backgroundColor: "#F4F6FB" },
          headerTitleStyle: {
            fontFamily: "Inter_600SemiBold",
            color: "#0B1F3A",
            fontSize: 16,
          },
          headerTintColor: "#2A6FFF",
        }}
      />
      <Stack.Screen
        name="complaint/new"
        options={{
          headerShown: true,
          headerTitle: "New Complaint",
          headerBackTitle: "Back",
          presentation: "modal",
          headerStyle: { backgroundColor: "#F4F6FB" },
          headerTitleStyle: {
            fontFamily: "Inter_600SemiBold",
            color: "#0B1F3A",
            fontSize: 16,
          },
          headerTintColor: "#2A6FFF",
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <AppProvider>
            <GestureHandlerRootView>
              <KeyboardProvider>
                <RootLayoutNav />
              </KeyboardProvider>
            </GestureHandlerRootView>
          </AppProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
