import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { displayFont } from "@/constants/fonts";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { login, loginDemo } = useAuth();
  const tc = useColors();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const topPad = Platform.OS === "web" ? insets.top + 67 : insets.top;

  const handleLogin = async () => {
    if (!email.trim()) { setError("Enter your email"); return; }
    if (!password.trim()) { setError("Enter your password"); return; }
    setLoading(true);
    setError("");
    const success = await login(email, password);
    setLoading(false);
    if (success) {
      router.replace("/(tabs)/discounts");
    } else {
      setError("Wrong email or password — try again");
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: tc.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.flex}>
        <ScrollView
          contentContainerStyle={[styles.container, { paddingTop: topPad + 32, paddingBottom: insets.bottom + 32 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Brand */}
          <View style={styles.brand}>
            <Text style={[styles.brandName, { color: tc.foreground }]}>Dobbi</Text>
            <Text style={[styles.brandTagline, { color: tc.mutedForeground }]}>
              Smarter spending for students.
            </Text>
          </View>

          {/* Login card */}
          <View style={[styles.card, { backgroundColor: tc.card, borderColor: tc.border }]}>
            <Text style={[styles.cardHeading, { color: tc.foreground }]}>Welcome back</Text>
            <Text style={[styles.cardSub, { color: tc.mutedForeground }]}>Sign in to your account</Text>

            <View style={[styles.field, { backgroundColor: tc.muted, borderColor: error ? tc.primary : tc.border }]}>
              <Feather name="mail" size={17} color={tc.mutedForeground} style={styles.fieldIcon} />
              <TextInput
                style={[styles.fieldInput, { color: tc.foreground }]}
                placeholder="Email"
                placeholderTextColor={tc.mutedForeground}
                value={email}
                onChangeText={(v) => { setEmail(v); setError(""); }}
                autoCapitalize="none"
                keyboardType="email-address"
                returnKeyType="next"
              />
            </View>

            <View style={[styles.field, { backgroundColor: tc.muted, borderColor: tc.border }]}>
              <Feather name="lock" size={17} color={tc.mutedForeground} style={styles.fieldIcon} />
              <TextInput
                style={[styles.fieldInput, { color: tc.foreground, flex: 1 }]}
                placeholder="Password"
                placeholderTextColor={tc.mutedForeground}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity onPress={() => setShowPassword((v) => !v)} style={styles.eyeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Feather name={showPassword ? "eye-off" : "eye"} size={17} color={tc.mutedForeground} />
              </TouchableOpacity>
            </View>

            {error ? (
              <View style={styles.errorRow}>
                <Feather name="alert-circle" size={13} color={tc.primary} />
                <Text style={[styles.errorText, { color: tc.primary }]}>{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.loginBtn, { backgroundColor: tc.foreground }]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={tc.onForeground} size="small" />
              ) : (
                <Text style={[styles.loginBtnText, { color: tc.onForeground }]}>Sign in</Text>
              )}
            </TouchableOpacity>

            <View style={styles.demoRow}>
              <View style={[styles.dividerLine, { backgroundColor: tc.border }]} />
              <Text style={[styles.demoLabel, { color: tc.mutedForeground }]}>Just exploring?</Text>
              <View style={[styles.dividerLine, { backgroundColor: tc.border }]} />
            </View>
            <TouchableOpacity
              style={[styles.demoBtn, { backgroundColor: tc.muted, borderColor: tc.border }]}
              onPress={() => { loginDemo(); router.replace("/(tabs)/discounts"); }}
              activeOpacity={0.7}
            >
              <Feather name="zap" size={14} color={tc.primary} />
              <Text style={[styles.demoBtnText, { color: tc.primary }]}>Continue with demo account</Text>
            </TouchableOpacity>
          </View>

          {/* Sign up */}
          <View style={styles.signupSection}>
            <Text style={[styles.signupPrompt, { color: tc.mutedForeground }]}>New here?</Text>
            <TouchableOpacity
              style={[styles.signupBtn, { backgroundColor: tc.foreground }]}
              onPress={() => router.push("/onboarding")}
              activeOpacity={0.85}
            >
              <Text style={[styles.signupBtnText, { color: tc.onForeground }]}>Create your account →</Text>
            </TouchableOpacity>
          </View>

          {/* Feature pills */}
          <View style={styles.pills}>
            {[
              { icon: "trending-up", label: "Track spending" },
              { icon: "tag", label: "Find deals" },
              { icon: "target", label: "Hit goals" },
            ].map((p, i) => (
              <View key={i} style={[styles.pill, { backgroundColor: tc.muted, borderColor: tc.border }]}>
                <Feather name={p.icon as any} size={12} color={tc.mutedForeground} />
                <Text style={[styles.pillText, { color: tc.mutedForeground }]}>{p.label}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  container: { paddingHorizontal: 24, flexGrow: 1, justifyContent: "space-between", gap: 24 },
  brand: { alignItems: "center", gap: 8, paddingTop: 8 },
  brandName: {
    fontSize: 52,
    fontFamily: displayFont,
    fontWeight: "500",
    letterSpacing: -1.5,
  },
  brandTagline: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    letterSpacing: 0.2,
  },
  card: {
    borderRadius: 24,
    padding: 24,
    shadowColor: "#1A1F36",
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
    gap: 12,
    borderWidth: 1,
  },
  cardHeading: { fontSize: 22, fontWeight: "800", fontFamily: "Inter_700Bold" },
  cardSub: { fontSize: 14, fontFamily: "Inter_400Regular", marginBottom: 4 },
  field: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 52,
    borderWidth: 1.5,
  },
  fieldIcon: { marginRight: 10 },
  fieldInput: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  eyeBtn: { padding: 4 },
  errorRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: -4 },
  errorText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  loginBtn: {
    borderRadius: 14,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
  },
  loginBtnText: { fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold", letterSpacing: 0.3 },
  demoRow: { flexDirection: "row", alignItems: "center", gap: 10, marginVertical: 2 },
  dividerLine: { flex: 1, height: 1 },
  demoLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  demoBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 12,
    paddingVertical: 11,
    borderWidth: 1.5,
  },
  demoBtnText: { fontSize: 13, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  signupSection: { alignItems: "center", gap: 10 },
  signupPrompt: { fontSize: 14, fontFamily: "Inter_400Regular" },
  signupBtn: { borderRadius: 14, paddingHorizontal: 28, paddingVertical: 13 },
  signupBtnText: { fontSize: 15, fontWeight: "700", fontFamily: "Inter_700Bold" },
  pills: { flexDirection: "row", justifyContent: "center", gap: 8, flexWrap: "wrap", paddingBottom: 4 },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
  },
  pillText: { fontSize: 12, fontFamily: "Inter_500Medium" },
});
