import React from "react";
import { View, Text } from "react-native";

interface DobbiCharacterProps {
  size?: "sm" | "md" | "lg";
  mood?: "happy" | "excited" | "thinking" | "proud";
}

export function DobbiCharacter({
  size = "md",
  mood = "happy",
}: DobbiCharacterProps) {
  const D = size === "sm" ? 36 : size === "lg" ? 76 : 52; // body diameter
  const AW = Math.round(D * 0.21); // arm width
  const AH = Math.round(D * 0.37); // arm height
  const LW = Math.round(D * 0.19); // leg width
  const LH = Math.round(D * 0.29); // leg height
  const GAP = Math.round(D * 0.04);

  const totalW = D + AW * 2 + GAP * 2 + 2;
  const totalH = D + LH + GAP;
  const bodyLeft = AW + GAP + 1;

  // Mood → eyes / mouth as text glyphs
  const eyes =
    mood === "excited" ? "◕ ◕" :
    mood === "thinking" ? "◔ ◔" :
    mood === "proud"    ? "^ ^" : "• •";
  const mouth =
    mood === "excited" ? "▲" :
    mood === "thinking" ? "~" : "‿";

  const BODY   = "#6355E8";
  const LIGHT  = "#8B78FF";
  const LIMB   = "#5248D4";
  const COIN   = "#F59E0B";

  return (
    <View style={{ width: totalW, height: totalH }}>
      {/* ── Left arm ── */}
      <View style={{
        position: "absolute", left: 0, top: D * 0.32,
        width: AW, height: AH,
        backgroundColor: LIMB, borderRadius: AW / 2,
        transform: [{ rotate: "16deg" }],
        shadowColor: BODY, shadowOpacity: 0.22,
        shadowRadius: 3, shadowOffset: { width: 0, height: 2 }, elevation: 2,
      }} />

      {/* ── Right arm ── */}
      <View style={{
        position: "absolute", right: 0, top: D * 0.32,
        width: AW, height: AH,
        backgroundColor: LIMB, borderRadius: AW / 2,
        transform: [{ rotate: "-16deg" }],
        shadowColor: BODY, shadowOpacity: 0.22,
        shadowRadius: 3, shadowOffset: { width: 0, height: 2 }, elevation: 2,
      }} />

      {/* ── Left leg ── */}
      <View style={{
        position: "absolute",
        left: bodyLeft + Math.round(D * 0.2),
        bottom: 0,
        width: LW, height: LH,
        backgroundColor: LIMB, borderRadius: LW / 2,
        transform: [{ rotate: "-9deg" }],
        shadowColor: BODY, shadowOpacity: 0.18,
        shadowRadius: 2, shadowOffset: { width: 0, height: 2 }, elevation: 2,
      }} />

      {/* ── Right leg ── */}
      <View style={{
        position: "absolute",
        right: bodyLeft + Math.round(D * 0.2) - 2,
        bottom: 0,
        width: LW, height: LH,
        backgroundColor: LIMB, borderRadius: LW / 2,
        transform: [{ rotate: "9deg" }],
        shadowColor: BODY, shadowOpacity: 0.18,
        shadowRadius: 2, shadowOffset: { width: 0, height: 2 }, elevation: 2,
      }} />

      {/* ── Body (circle) ── */}
      <View style={{
        position: "absolute", left: bodyLeft, top: 0,
        width: D, height: D, borderRadius: D / 2,
        backgroundColor: BODY,
        justifyContent: "center", alignItems: "center",
        overflow: "hidden",
        shadowColor: BODY, shadowOpacity: 0.42,
        shadowRadius: D * 0.2, shadowOffset: { width: 0, height: D * 0.06 },
        elevation: 10,
      }}>
        {/* Top highlight arc */}
        <View style={{
          position: "absolute", top: -D * 0.18, left: -D * 0.1,
          width: D * 1.2, height: D * 0.55,
          borderRadius: D * 0.6, backgroundColor: LIGHT, opacity: 0.35,
        }} />

        {/* Shine dot */}
        <View style={{
          position: "absolute", top: D * 0.1, right: D * 0.16,
          width: D * 0.15, height: D * 0.15,
          borderRadius: D * 0.075, backgroundColor: "rgba(255,255,255,0.50)",
        }} />

        {/* Left blush */}
        <View style={{
          position: "absolute", bottom: D * 0.2, left: D * 0.08,
          width: D * 0.17, height: D * 0.09,
          borderRadius: 8, backgroundColor: "rgba(255,140,200,0.60)",
        }} />
        {/* Right blush */}
        <View style={{
          position: "absolute", bottom: D * 0.2, right: D * 0.08,
          width: D * 0.17, height: D * 0.09,
          borderRadius: 8, backgroundColor: "rgba(255,140,200,0.60)",
        }} />

        {/* Face */}
        <View style={{ alignItems: "center", marginTop: D * 0.04 }}>
          <Text style={{
            color: "#fff", fontSize: D * 0.2, fontWeight: "900",
            letterSpacing: D * 0.042, lineHeight: D * 0.27,
          }}>{eyes}</Text>
          <Text style={{
            color: "#fff", fontSize: D * 0.18, fontWeight: "700",
            marginTop: -D * 0.04, lineHeight: D * 0.24,
          }}>{mouth}</Text>
        </View>

        {/* Gold coin accent (bottom right) */}
        <View style={{
          position: "absolute", bottom: D * 0.07, right: D * 0.07,
          width: D * 0.22, height: D * 0.22, borderRadius: D * 0.11,
          backgroundColor: COIN,
          justifyContent: "center", alignItems: "center",
          borderWidth: 1.5, borderColor: "rgba(255,255,255,0.35)",
        }}>
          <Text style={{ fontSize: D * 0.11, color: "#fff", fontWeight: "900" }}>✦</Text>
        </View>
      </View>
    </View>
  );
}
