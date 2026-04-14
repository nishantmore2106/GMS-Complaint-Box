import { useRouter, useSegments } from "expo-router";
import { useApp } from "@/context/AppContext";
import { Feather } from "@expo/vector-icons";
import { LoadingScreen } from "@/components/LoadingScreen";
import { Platform, View, StyleSheet, Text } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import 'react-native-url-polyfill/auto';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  Inter_900Black,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { LinearGradient } from "expo-linear-gradient";
import { Colors } from "@/constants/colors";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppProvider } from "@/context/AppContext";
import { ToastProvider, useToast } from "@/components/Toast";
import { NotificationListener } from "@/components/NotificationListener";
import "@/services/i18n";
import * as Sentry from "@sentry/react-native";

const SENTRY_DSN = "https://your-dsn-here@sentry.io/project-id";

if (SENTRY_DSN && !SENTRY_DSN.includes("your-dsn-here")) {
  Sentry.init({
    dsn: SENTRY_DSN,
    debug: __DEV__,
  });
}

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function useOffline() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleOnline = () => setIsOffline(false);
      const handleOffline = () => setIsOffline(true);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      setIsOffline(!navigator.onLine);
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    } else {
      const checkStatus = async () => {
        try {
          const res = await fetch("https://www.google.com", { method: 'HEAD', cache: 'no-store' });
          setIsOffline(!res.ok);
        } catch (e) {
          setIsOffline(true);
        }
      };
      const id = setInterval(checkStatus, 30000);
      checkStatus();
      return () => clearInterval(id);
    }
  }, []);

  return isOffline;
}

function OfflineBanner() {
  const isOffline = useOffline();
  if (!isOffline) return null;

  return (
    <View style={styles.offlineBanner}>
      <Feather name="wifi-off" size={12} color="white" />
      <Text style={styles.offlineText}>Connection Lost • Working Offline</Text>
    </View>
  );
}

function MaintenanceOverlay() {
  const { systemSettings, currentUser } = useApp();
  const segments = useSegments();
  const isAdminPage = segments?.[0] === 'admin';
  const isFounder = currentUser?.role === 'founder';

  const isUnderMaintenance = systemSettings?.is_maintenance_mode;
  const isPaused = systemSettings?.is_paused;

  if (isFounder && isAdminPage) return null;
  if (!isUnderMaintenance && !isPaused) return null;

  return (
    <View style={styles.overlay}>
      <LinearGradient
        colors={isPaused ? ['#FEF2F2', '#FEE2E2'] : ['#F8FAFC', '#F1F5F9']}
        style={styles.overlayGradient}
      >
        <Feather 
          name={isPaused ? "pause-circle" : "tool"} 
          size={64} 
          color={isPaused ? "#EF4444" : "#6366F1"} 
        />
        <Text style={styles.overlayTitle}>
          {isPaused ? "System Paused" : "Under Maintenance"}
        </Text>
        <Text style={styles.overlayMessage}>
          {isPaused 
            ? "Operations are temporarily suspended by the administrator." 
            : "We're currently performing scheduled improvements. Please check back soon."}
        </Text>
        {isFounder && (
          <Text style={styles.founderHint}>
            Founder Tip: Navigate to Admin pages to bypass this screen.
          </Text>
        )}
      </LinearGradient>
    </View>
  );
}

function RootLayoutNav() {
  const { isAuthLoading, currentUser, loaded } = useApp();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isAuthLoading || !loaded) return;

    const rootSegment = segments?.[0] as string | undefined;
    const inProtectedGroup = !!rootSegment && ["(tabs)", "admin", "complaint", "profile", "analytics"].includes(rootSegment);
    const inPublicGroup = !!rootSegment && ["onboarding", "index"].includes(rootSegment) || !rootSegment;

    // 1. Authentication Check
    if (!currentUser && inProtectedGroup) {
      router.replace("/");
      return;
    } 
    
    if (currentUser && inPublicGroup && rootSegment !== "onboarding") {
      router.replace("/(tabs)");
      return;
    }

    // 2. Role-Based Authorization Check
    if (currentUser && rootSegment === "admin" && currentUser.role !== "founder") {
      console.warn(`[RootLayout] Access Denied: User role ${currentUser.role} attempted to access /admin`);
      router.replace("/(tabs)");
      return;
    }

    // 3. Client restrictions (Example: Clients can only see their own complaints, handled in AppContext, 
    // but we can block them from certain sub-routes if needed here)

  }, [currentUser, isAuthLoading, loaded, segments]);

  if (isAuthLoading || !loaded) {
    return <LoadingScreen />;
  }

  const rootSegment = segments?.[0] as string | undefined;
  const inProtectedGroup = !!rootSegment && ["(tabs)", "admin", "complaint", "profile", "analytics"].includes(rootSegment);
  
  // Final Auth Catch-all
  if (!currentUser && inProtectedGroup) {
    return <LoadingScreen />;
  }

  // Final Authz Catch-all (double protection)
  if (currentUser && rootSegment === "admin" && currentUser.role !== "founder") {
    return <LoadingScreen />;
  }

  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }} initialRouteName="index">
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="complaint/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="complaint/new" options={{ headerShown: false, presentation: "modal" }} />
        <Stack.Screen name="admin/supervisors" options={{ headerShown: false }} />
        <Stack.Screen name="admin/index" options={{ headerShown: false }} />
        <Stack.Screen name="admin/companies" options={{ headerShown: false }} />
        <Stack.Screen name="admin/company-new" options={{ headerShown: false }} />
        <Stack.Screen name="admin/site-new" options={{ headerShown: false }} />
        <Stack.Screen name="admin/site/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      </Stack>
      <MaintenanceOverlay />
      <OfflineBanner />
    </View>
  );
}

function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    Inter_900Black,
  });

  useEffect(() => {
    async function hide() {
      if (fontsLoaded || fontError) {
        try {
          await SplashScreen.hideAsync();
        } catch (e) {
          console.warn("[RootLayout] SplashScreen.hideAsync error:", e);
        }
      }
    }
    hide();
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            <AppProvider>
              <NotificationListener />
              <GestureHandlerRootView style={{ flex: 1 }}>
                <LinearGradient
                  colors={Colors.bgGradient as [string, string]}
                  style={{ flex: 1 }}
                >
                  <KeyboardProvider>
                    <RootLayoutNav />
                  </KeyboardProvider>
                </LinearGradient>
              </GestureHandlerRootView>
            </AppProvider>
          </ToastProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  overlayGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  overlayTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1F2937',
    marginTop: 24,
    textAlign: 'center',
  },
  overlayMessage: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 24,
  },
  founderHint: {
    position: 'absolute',
    bottom: 40,
    fontSize: 12,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  offlineBanner: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: '#EF4444',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    zIndex: 10000,
    ...Platform.select({
      web: { boxShadow: '0 4px 12px rgba(0,0,0,0.15)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8
      }
    })
  },
  offlineText: {
    color: 'white',
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
  }
});

export default Sentry.wrap(RootLayout);
