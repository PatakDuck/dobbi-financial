import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { useColors } from "@/hooks/useColors";

function ClassicTabLayout() {
  const tc = useColors();
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: tc.primary,
        tabBarInactiveTintColor: tc.mutedForeground,
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : tc.isDark ? "rgba(10,11,21,0.95)" : tc.card,
          borderTopWidth: 1,
          borderTopColor: tc.border,
          elevation: 0,
          height: isWeb ? 84 : 62,
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={tc.isDark ? 80 : 100}
              tint={tc.isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          ) : isWeb ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: tc.isDark ? "rgba(10,11,21,0.97)" : tc.card }]} />
          ) : null,
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: "Inter_600SemiBold",
          marginBottom: isWeb ? 10 : 4,
        },
      }}
    >
      <Tabs.Screen name="discounts" options={{ title: "Deals", tabBarIcon: ({ color }) => <Feather name="tag" size={22} color={color} /> }} />
      <Tabs.Screen name="budget" options={{ title: "Budget", tabBarIcon: ({ color }) => <Feather name="pie-chart" size={22} color={color} /> }} />
      <Tabs.Screen name="goals" options={{ title: "Goals", tabBarIcon: ({ color }) => <Feather name="target" size={22} color={color} /> }} />
      <Tabs.Screen name="chat" options={{ title: "Dobbi", tabBarIcon: ({ color }) => <Feather name="message-circle" size={22} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: "Me", tabBarIcon: ({ color }) => <Feather name="user" size={22} color={color} /> }} />
    </Tabs>
  );
}

export default function TabLayout() {
  return <ClassicTabLayout />;
}
