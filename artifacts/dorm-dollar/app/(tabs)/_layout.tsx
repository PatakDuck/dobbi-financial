import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { useColors } from "@/hooks/useColors";

type FeatherName = React.ComponentProps<typeof Feather>["name"];

function TabIcon({
  name,
  focused,
  tc,
}: {
  name: FeatherName;
  focused: boolean;
  tc: ReturnType<typeof useColors>;
}) {
  const pillBg = tc.isDark ? tc.primary : tc.foreground;
  const iconColor = focused ? tc.onForeground : tc.mutedForeground;
  return (
    <View style={[styles.tabIconWrap, focused && { backgroundColor: pillBg }]}>
      <Feather name={name} size={19} color={iconColor} />
    </View>
  );
}

function ClassicTabLayout() {
  const tc = useColors();
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  const tabBg = tc.isDark ? "rgba(10,11,21,0.95)" : tc.card;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: tc.isDark ? tc.primary : tc.foreground,
        tabBarInactiveTintColor: tc.mutedForeground,
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : tabBg,
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
      <Tabs.Screen
        name="discounts"
        options={{
          title: "Deals",
          tabBarIcon: ({ focused }) => <TabIcon name="tag" focused={focused} tc={tc} />,
        }}
      />
      <Tabs.Screen
        name="budget"
        options={{
          title: "Budget",
          tabBarIcon: ({ focused }) => <TabIcon name="pie-chart" focused={focused} tc={tc} />,
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          title: "Goals",
          tabBarIcon: ({ focused }) => <TabIcon name="target" focused={focused} tc={tc} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Dobbi",
          tabBarIcon: ({ focused }) => <TabIcon name="message-circle" focused={focused} tc={tc} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Me",
          tabBarIcon: ({ focused }) => <TabIcon name="user" focused={focused} tc={tc} />,
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  return <ClassicTabLayout />;
}

const styles = StyleSheet.create({
  tabIconWrap: {
    width: 46,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
});
