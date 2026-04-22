import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ChatProvider } from "@/context/ChatContext";
import { ThemeProvider } from "@/context/ThemeContext";
import {
  requestNotificationPermissions,
  scheduleDailyCheckIn,
  scheduleRandomSavingTip,
} from "@/services/NotificationService";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;

    const inTabs = segments[0] === "(tabs)";
    const inOnboarding = segments[0] === "onboarding";
    const inLogin = segments[0] === "login";

    if (!user && inTabs) {
      // Not logged in but trying to access tabs → go to login
      router.replace("/login");
    } else if (user && (inLogin || inOnboarding)) {
      // Already logged in but on auth screens → go to app
      router.replace("/(tabs)/discounts");
    }
  }, [user, isLoading, segments]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const granted = await requestNotificationPermissions();
      if (granted) {
        await scheduleDailyCheckIn();
        await scheduleRandomSavingTip();
      }
    })();
  }, [user]);

  return <>{children}</>;
}

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen
        name="onboarding"
        options={{
          headerShown: false,
          // Slide up from bottom for a "new chapter" feel
          presentation: "modal",
        }}
      />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
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
          <ThemeProvider>
          <AuthProvider>
            <ChatProvider>
              <GestureHandlerRootView>
                <KeyboardProvider>
                  <AuthGuard>
                    <RootLayoutNav />
                  </AuthGuard>
                </KeyboardProvider>
              </GestureHandlerRootView>
            </ChatProvider>
          </AuthProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
