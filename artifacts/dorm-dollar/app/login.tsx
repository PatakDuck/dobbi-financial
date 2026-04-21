import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { DobbiCharacter } from "@/components/DobbiCharacter";
import colors from "@/constants/colors";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { login, loginDemo } = useAuth();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const handleLogin = async () => {
    if (!email.trim()) {
      setError("Enter your email");
      return;
    }
    if (!password.trim()) {
      setError("Enter your password");
      return;
    }
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

  const handleSignUp = () => {
    router.push("/onboarding");
  };

  const topPad = Platform.OS === "web" ? insets.top + 67 : insets.top;

  return (
    <View style={styles.root}>
      {/* Background gradient — deep indigo night */}
      <LinearGradient
        colors={["#0D0F1A", "#1A1640", "#251E5C"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.6, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Subtle glow orbs */}
      <View
        style={[
          styles.orb,
          {
            width: 280,
            height: 280,
            borderRadius: 140,
            top: -80,
            right: -60,
            backgroundColor: "rgba(99, 85, 232, 0.22)",
          },
        ]}
      />
      <View
        style={[
          styles.orb,
          {
            width: 180,
            height: 180,
            borderRadius: 90,
            bottom: 160,
            left: -60,
            backgroundColor: "rgba(0, 200, 150, 0.12)",
          },
        ]}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={[
            styles.container,
            { paddingTop: topPad + 32, paddingBottom: insets.bottom + 32 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Brand header ── */}
          <View style={styles.brand}>
            <DobbiCharacter size="lg" mood="excited" />
            <Text style={styles.brandName}>dobbi</Text>
            <Text style={styles.brandTagline}>
              stop overspending. built for students.
            </Text>
          </View>

          {/* ── Login card ── */}
          <View style={styles.card}>
            <Text style={styles.cardHeading}>Welcome back</Text>
            <Text style={styles.cardSub}>
              Sign in to keep your streak alive
            </Text>

            {/* Email */}
            <View style={[styles.field, error ? styles.fieldError : null]}>
              <Feather
                name="mail"
                size={17}
                color={colors.light.mutedForeground}
                style={styles.fieldIcon}
              />
              <TextInput
                style={styles.fieldInput}
                placeholder="Email"
                placeholderTextColor={colors.light.mutedForeground}
                value={email}
                onChangeText={(v) => {
                  setEmail(v);
                  setError("");
                }}
                autoCapitalize="none"
                keyboardType="email-address"
                returnKeyType="next"
              />
            </View>

            {/* Password */}
            <View style={styles.field}>
              <Feather
                name="lock"
                size={17}
                color={colors.light.mutedForeground}
                style={styles.fieldIcon}
              />
              <TextInput
                style={[styles.fieldInput, { flex: 1 }]}
                placeholder="Password"
                placeholderTextColor={colors.light.mutedForeground}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity
                onPress={() => setShowPassword((v) => !v)}
                style={styles.eyeBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Feather
                  name={showPassword ? "eye-off" : "eye"}
                  size={17}
                  color={colors.light.mutedForeground}
                />
              </TouchableOpacity>
            </View>

            {error ? (
              <View style={styles.errorRow}>
                <Feather name="alert-circle" size={13} color={colors.light.coral} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Login button */}
            <TouchableOpacity
              style={styles.loginBtn}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={["#6355E8", "#8B5CF6"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.loginGrad}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.loginBtnText}>Sign in</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Demo hint */}
            <View style={styles.demoRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.demoLabel}>just exploring?</Text>
              <View style={styles.dividerLine} />
            </View>
            <TouchableOpacity
              style={styles.demoBtn}
              onPress={() => {
                loginDemo();
                router.replace("/(tabs)/discounts");
              }}
              activeOpacity={0.7}
            >
              <Feather name="zap" size={14} color={colors.light.primary} />
              <Text style={styles.demoBtnText}>Continue with demo account</Text>
            </TouchableOpacity>
          </View>

          {/* ── Sign up section ── */}
          <View style={styles.signupSection}>
            <Text style={styles.signupPrompt}>New here?</Text>
            <TouchableOpacity
              style={styles.signupBtn}
              onPress={handleSignUp}
              activeOpacity={0.85}
            >
              <Text style={styles.signupBtnText}>Create your account →</Text>
            </TouchableOpacity>
          </View>

          {/* ── Feature pills ── */}
          <View style={styles.pills}>
            {[
              { icon: "trending-up", label: "Track spending" },
              { icon: "tag", label: "Find deals" },
              { icon: "target", label: "Hit goals" },
            ].map((p, i) => (
              <View key={i} style={styles.pill}>
                <Feather name={p.icon as any} size={12} color="rgba(255,255,255,0.7)" />
                <Text style={styles.pillText}>{p.label}</Text>
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
  orb: { position: "absolute" },
  container: {
    paddingHorizontal: 24,
    flexGrow: 1,
    justifyContent: "space-between",
    gap: 24,
  },
  brand: {
    alignItems: "center",
    gap: 8,
    paddingTop: 8,
  },
  brandName: {
    fontSize: 42,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -1.5,
    fontFamily: "Inter_700Bold",
  },
  brandTagline: {
    fontSize: 14,
    color: "rgba(255,255,255,0.65)",
    fontFamily: "Inter_400Regular",
    letterSpacing: 0.2,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.22,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 12 },
    elevation: 14,
    gap: 12,
  },
  cardHeading: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.light.foreground,
    fontFamily: "Inter_700Bold",
    marginBottom: 0,
  },
  cardSub: {
    fontSize: 14,
    color: colors.light.mutedForeground,
    fontFamily: "Inter_400Regular",
    marginBottom: 4,
  },
  field: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.light.muted,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 52,
    borderWidth: 1.5,
    borderColor: colors.light.border,
  },
  fieldError: {
    borderColor: colors.light.coral,
  },
  fieldIcon: { marginRight: 10 },
  fieldInput: {
    flex: 1,
    fontSize: 15,
    color: colors.light.foreground,
    fontFamily: "Inter_400Regular",
  },
  eyeBtn: { padding: 4 },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: -4,
  },
  errorText: {
    fontSize: 13,
    color: colors.light.coral,
    fontFamily: "Inter_400Regular",
  },
  loginBtn: {
    borderRadius: 14,
    overflow: "hidden",
    marginTop: 4,
  },
  loginGrad: {
    height: 52,
    justifyContent: "center",
    alignItems: "center",
  },
  loginBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.3,
  },
  demoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: 2,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.light.border,
  },
  demoLabel: {
    fontSize: 12,
    color: colors.light.mutedForeground,
    fontFamily: "Inter_400Regular",
  },
  demoBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.light.secondary,
    borderRadius: 12,
    paddingVertical: 11,
    borderWidth: 1.5,
    borderColor: "#D8D3FA",
  },
  demoBtnText: {
    fontSize: 13,
    color: colors.light.primary,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  signupSection: {
    alignItems: "center",
    gap: 10,
  },
  signupPrompt: {
    fontSize: 14,
    color: "rgba(255,255,255,0.55)",
    fontFamily: "Inter_400Regular",
  },
  signupBtn: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 14,
    paddingHorizontal: 28,
    paddingVertical: 13,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.2)",
  },
  signupBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  pills: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    flexWrap: "wrap",
    paddingBottom: 4,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  pillText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
});
