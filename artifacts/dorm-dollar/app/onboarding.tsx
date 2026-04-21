import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Animated,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { DobbiCharacter } from "@/components/DobbiCharacter";
import colors from "@/constants/colors";

// ── Questions ──────────────────────────────────────────────────────────────
interface Question {
  id: string;
  prompt: string;
  sub: string;
  emoji: string;
  options: { label: string; value: string; icon: string }[];
}

const QUESTIONS: Question[] = [
  {
    id: "budgeting_skill",
    prompt: "How's your budgeting game rn?",
    sub: "No judgment — Dobbi's here to help either way 💜",
    emoji: "📊",
    options: [
      { label: "I wing it every month 😬", value: "winging_it", icon: "wind" },
      { label: "Getting the hang of it", value: "learning", icon: "trending-up" },
      { label: "Pretty solid actually", value: "solid", icon: "check-circle" },
      { label: "I'm basically a CFO 🏆", value: "pro", icon: "award" },
    ],
  },
  {
    id: "main_use",
    prompt: "What'll you use Dobbi for most?",
    sub: "Pick the one that hits hardest right now",
    emoji: "🎯",
    options: [
      { label: "Track where my $ goes", value: "tracking", icon: "bar-chart-2" },
      { label: "Find student deals", value: "deals", icon: "tag" },
      { label: "Crush savings goals", value: "goals", icon: "target" },
      { label: "Get money advice", value: "advice", icon: "message-circle" },
    ],
  },
  {
    id: "struggle",
    prompt: "Biggest money struggle?",
    sub: "Real talk — knowing this helps Dobbi help you",
    emoji: "💀",
    options: [
      { label: "I overspend constantly", value: "overspending", icon: "alert-triangle" },
      { label: "Can't seem to save", value: "saving", icon: "dollar-sign" },
      { label: "Student loans stress", value: "loans", icon: "file-text" },
      { label: "No idea where it goes", value: "tracking_issue", icon: "help-circle" },
    ],
  },
  {
    id: "savings_target",
    prompt: "Monthly savings goal?",
    sub: "Even a little adds up — Dobbi will help you hit it",
    emoji: "🎉",
    options: [
      { label: "Any amount helps tbh", value: "any", icon: "heart" },
      { label: "$50–$100 / month", value: "50_100", icon: "trending-up" },
      { label: "$100–$200 / month", value: "100_200", icon: "star" },
      { label: "$200+ let's get it", value: "200_plus", icon: "zap" },
    ],
  },
  {
    id: "top_spend",
    prompt: "Where does most of your $ go?",
    sub: "Dobbi won't judge... okay maybe a little 👀",
    emoji: "🔍",
    options: [
      { label: "Food & drinks 🍕", value: "food", icon: "coffee" },
      { label: "Going out / events", value: "going_out", icon: "music" },
      { label: "Subscriptions", value: "subs", icon: "repeat" },
      { label: "Shopping & clothes", value: "shopping", icon: "shopping-bag" },
    ],
  },
];

// ── Component ──────────────────────────────────────────────────────────────
export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signup, login, completeOnboarding } = useAuth();

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const topPad = Platform.OS === "web" ? insets.top + 67 : insets.top;
  const q = QUESTIONS[step];
  const isLast = step === QUESTIONS.length - 1;
  const progress = (step + (selected ? 1 : 0)) / QUESTIONS.length;

  const animateTransition = (next: () => void) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -30,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      next();
      slideAnim.setValue(30);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const handleSelect = (value: string) => {
    setSelected(value);
  };

  const handleNext = async () => {
    if (!selected) return;

    const newAnswers = { ...answers, [q.id]: selected };
    setAnswers(newAnswers);

    if (isLast) {
      setAnswers(newAnswers);
      animateTransition(() => setShowAccount(true));
      setSelected(null);
      return;
    }

    animateTransition(() => {
      setStep((s) => s + 1);
      setSelected(null);
    });
  };

  const handleBack = () => {
    if (step === 0) {
      router.back();
      return;
    }
    animateTransition(() => {
      setStep((s) => s - 1);
      setSelected(answers[QUESTIONS[step - 1].id] ?? null);
    });
  };

  const handleCreateAccount = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert("Missing info", "Please fill in all fields.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Weak password", "Password must be at least 6 characters.");
      return;
    }
    setFinishing(true);
    const { error } = await signup(email.trim(), password, name.trim());
    if (error) {
      setFinishing(false);
      Alert.alert("Sign up failed", error);
      return;
    }
    await completeOnboarding(answers);
    router.replace("/(tabs)/discounts");
  };

  if (showAccount) {
    return (
      <View style={styles.root}>
        <LinearGradient
          colors={["#0D0F1A", "#1A1640", "#251E5C"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: topPad + 32, paddingBottom: insets.bottom + 32 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.mascotRow}>
            <DobbiCharacter size="md" mood="excited" />
          </View>
          <Text style={[styles.emoji, { textAlign: "center" }]}>🎉</Text>
          <Text style={styles.questionText}>Last step — create your account</Text>
          <Text style={styles.questionSub}>So your data stays safe and synced</Text>

          <View style={{ gap: 12, marginTop: 24 }}>
            <View style={styles.inputField}>
              <Feather name="user" size={16} color="rgba(255,255,255,0.5)" style={{ marginRight: 10 }} />
              <TextInput
                style={styles.inputText}
                placeholder="Your name"
                placeholderTextColor="rgba(255,255,255,0.35)"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>
            <View style={styles.inputField}>
              <Feather name="mail" size={16} color="rgba(255,255,255,0.5)" style={{ marginRight: 10 }} />
              <TextInput
                style={styles.inputText}
                placeholder="Email"
                placeholderTextColor="rgba(255,255,255,0.35)"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
            <View style={styles.inputField}>
              <Feather name="lock" size={16} color="rgba(255,255,255,0.5)" style={{ marginRight: 10 }} />
              <TextInput
                style={styles.inputText}
                placeholder="Password (min 6 characters)"
                placeholderTextColor="rgba(255,255,255,0.35)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.continueBtn, { marginTop: 28 }]}
            onPress={handleCreateAccount}
            disabled={finishing}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={["#6355E8", "#8B5CF6"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.continueGrad}
            >
              <Text style={styles.continueBtnText}>
                {finishing ? "Creating account..." : "Let's go 🚀"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={["#0D0F1A", "#1A1640", "#251E5C"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Glow orb */}
      <View
        style={[
          styles.orb,
          {
            width: 240,
            height: 240,
            borderRadius: 120,
            top: -60,
            right: -60,
            backgroundColor: "rgba(99, 85, 232, 0.2)",
          },
        ]}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: topPad + 16, paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Top bar ── */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
            <Feather name="arrow-left" size={20} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>

          <View style={styles.progressWrap}>
            <View style={styles.progressTrack}>
              <Animated.View
                style={[
                  styles.progressFill,
                  { width: `${progress * 100}%` },
                ]}
              />
            </View>
            <Text style={styles.progressLabel}>
              {step + 1} of {QUESTIONS.length}
            </Text>
          </View>
        </View>

        {/* ── Dobbi intro ── */}
        <View style={styles.mascotRow}>
          <DobbiCharacter
            size="md"
            mood={step === 4 ? "excited" : step >= 2 ? "thinking" : "happy"}
          />
        </View>

        {/* ── Question ── */}
        <Animated.View
          style={[
            styles.questionBlock,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <Text style={styles.emoji}>{q.emoji}</Text>
          <Text style={styles.questionText}>{q.prompt}</Text>
          <Text style={styles.questionSub}>{q.sub}</Text>

          {/* ── Options ── */}
          <View style={styles.optionsGrid}>
            {q.options.map((opt) => {
              const isChosen = selected === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.optionCard, isChosen && styles.optionCardSelected]}
                  onPress={() => handleSelect(opt.value)}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.optionIcon,
                      isChosen && styles.optionIconSelected,
                    ]}
                  >
                    <Feather
                      name={opt.icon as any}
                      size={16}
                      color={isChosen ? "#FFFFFF" : colors.light.primary}
                    />
                  </View>
                  <Text
                    style={[
                      styles.optionLabel,
                      isChosen && styles.optionLabelSelected,
                    ]}
                  >
                    {opt.label}
                  </Text>
                  {isChosen && (
                    <Feather
                      name="check-circle"
                      size={18}
                      color={colors.light.primary}
                      style={styles.checkIcon}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>

        {/* ── Continue button ── */}
        <TouchableOpacity
          style={[styles.continueBtn, !selected && styles.continueBtnDisabled]}
          onPress={handleNext}
          disabled={!selected || finishing}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={
              selected
                ? ["#6355E8", "#8B5CF6"]
                : ["#2D2F45", "#2D2F45"]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.continueGrad}
          >
            <Text style={[styles.continueBtnText, !selected && styles.continueBtnTextDim]}>
              {finishing
                ? "Setting up your account..."
                : isLast
                ? "Let's get it 🚀"
                : "Continue"}
            </Text>
            {!finishing && selected && (
              <Feather name="arrow-right" size={18} color="#FFFFFF" />
            )}
          </LinearGradient>
        </TouchableOpacity>

        {step === 0 && (
          <Text style={styles.skipNote}>
            Takes 30 seconds · Personalizes your experience
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  orb: { position: "absolute" },
  scroll: {
    paddingHorizontal: 20,
    gap: 20,
    flexGrow: 1,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  progressWrap: {
    flex: 1,
    gap: 5,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.12)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
    backgroundColor: "#6355E8",
  },
  progressLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.45)",
    fontFamily: "Inter_400Regular",
  },
  mascotRow: {
    alignItems: "center",
    paddingVertical: 4,
  },
  questionBlock: {
    gap: 14,
  },
  emoji: {
    fontSize: 36,
    textAlign: "center",
  },
  questionText: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    letterSpacing: -0.5,
    lineHeight: 32,
  },
  questionSub: {
    fontSize: 14,
    color: "rgba(255,255,255,0.55)",
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginBottom: 4,
  },
  optionsGrid: {
    gap: 10,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.1)",
  },
  optionCardSelected: {
    backgroundColor: "rgba(99, 85, 232, 0.18)",
    borderColor: "#6355E8",
  },
  optionIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(99, 85, 232, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  optionIconSelected: {
    backgroundColor: "#6355E8",
  },
  optionLabel: {
    flex: 1,
    fontSize: 15,
    color: "rgba(255,255,255,0.85)",
    fontFamily: "Inter_500Medium",
    lineHeight: 20,
  },
  optionLabelSelected: {
    color: "#FFFFFF",
    fontFamily: "Inter_600SemiBold",
  },
  checkIcon: {
    marginLeft: "auto",
  },
  continueBtn: {
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 4,
  },
  continueBtnDisabled: {
    opacity: 0.7,
  },
  continueGrad: {
    height: 54,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  continueBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  continueBtnTextDim: {
    color: "rgba(255,255,255,0.4)",
  },
  skipNote: {
    textAlign: "center",
    fontSize: 12,
    color: "rgba(255,255,255,0.35)",
    fontFamily: "Inter_400Regular",
  },
  inputField: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.15)",
  },
  inputText: {
    flex: 1,
    fontSize: 15,
    color: "#FFFFFF",
    fontFamily: "Inter_400Regular",
  },
});
