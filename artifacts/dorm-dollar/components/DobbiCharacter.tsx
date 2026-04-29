import React from "react";
import { View, Text } from "react-native";
import { displayFont } from "@/constants/fonts";

interface DobbiCharacterProps {
  size?: "sm" | "md" | "lg";
  mood?: "happy" | "excited" | "thinking" | "proud";
}

export function DobbiCharacter({ size = "md" }: DobbiCharacterProps) {
  const D = size === "sm" ? 36 : size === "lg" ? 64 : 52;
  return (
    <View style={{
      width: D, height: D, borderRadius: D / 2,
      backgroundColor: "#0E1A2B",
      justifyContent: "center", alignItems: "center",
    }}>
      <Text style={{
        fontFamily: displayFont,
        fontSize: Math.round(D * 0.44),
        color: "#F5EFE6",
        fontWeight: "500",
      }}>D</Text>
    </View>
  );
}
