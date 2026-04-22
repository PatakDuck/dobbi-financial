import React, { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

type Difficulty = "easy" | "medium" | "hard";
type GoalStatus = "active" | "completed" | "locked";

interface Goal {
  id: string; title: string; description: string;
  xpReward: number; emoji: string;
  progress: number; target: number; unit: string;
  status: GoalStatus; difficulty: Difficulty;
}

interface DailyChallenge {
  id: string; title: string; xp: number; icon: string; done: boolean;
}

interface FitnessChallenge {
  id: string;
  brand: string;
  brandColor: string;
  emoji: string;
  title: string;
  description: string;
  reward: string;
  rewardDetail: string;
  progress: number;
  target: number;
  unit: string;
  daysLeft: number;
  connected: boolean;
  type: "fitness" | "budget" | "social";
}

const DAILY_CHALLENGES: DailyChallenge[] = [
  { id: "d1", title: "Log one expense today", xp: 50, icon: "plus-circle", done: false },
  { id: "d2", title: "Check your budget breakdown", xp: 25, icon: "bar-chart-2", done: true },
  { id: "d3", title: "Browse the deals tab", xp: 25, icon: "tag", done: false },
  { id: "d4", title: "Skip one takeout order today", xp: 75, icon: "coffee", done: false },
];

const PERSONAL_GOALS: Goal[] = [
  { id: "p1", title: "Textbook Fund", description: "Save $300 for next semester's textbooks", xpReward: 250, emoji: "📚", progress: 187, target: 300, unit: "$", status: "active", difficulty: "medium" },
  { id: "p2", title: "No Takeout Week", description: "Cook all meals for 7 days straight", xpReward: 150, emoji: "🍳", progress: 5, target: 7, unit: "days", status: "active", difficulty: "easy" },
  { id: "p3", title: "Emergency Fund", description: "Build a $500 safety net", xpReward: 400, emoji: "🛡️", progress: 50, target: 500, unit: "$", status: "active", difficulty: "hard" },
  { id: "p4", title: "Budget Master", description: "Stay under budget for 3 months", xpReward: 500, emoji: "🏆", progress: 1, target: 3, unit: "months", status: "locked", difficulty: "hard" },
];

const FITNESS_CHALLENGES: FitnessChallenge[] = [
  {
    id: "f1",
    brand: "Nike Running Club",
    brandColor: "#111111",
    emoji: "👟",
    title: "7-Day Run Streak",
    description: "Run every day for 7 days in a row. Nike will send you an exclusive reward — a discount code for your next pair.",
    reward: "20% OFF Nike order",
    rewardDetail: "Reward unlocked after 7 consecutive days",
    progress: 3,
    target: 7,
    unit: "days",
    daysLeft: 4,
    connected: false,
    type: "fitness",
  },
  {
    id: "f2",
    brand: "Peloton",
    brandColor: "#D43F3A",
    emoji: "🚴",
    title: "5 Rides This Week",
    description: "Complete 5 Peloton rides (any length) before Sunday. Unlock 1 free month added to your account.",
    reward: "1 Month Free",
    rewardDetail: "Added automatically when you hit 5 rides",
    progress: 2,
    target: 5,
    unit: "rides",
    daysLeft: 3,
    connected: false,
    type: "fitness",
  },
  {
    id: "f3",
    brand: "Planet Fitness",
    brandColor: "#7B2D8B",
    emoji: "💪",
    title: "Gym Rat Month",
    description: "Visit Planet Fitness 12 times in one month. That's 3x per week — you'll thank yourself later.",
    reward: "1 Month Free",
    rewardDetail: "Membership credit applied to your account",
    progress: 7,
    target: 12,
    unit: "visits",
    daysLeft: 12,
    connected: false,
    type: "fitness",
  },
  {
    id: "f4",
    brand: "Dobbi Budget",
    brandColor: "#6355E8",
    emoji: "💸",
    title: "No Takeout Challenge",
    description: "Go 14 days without a single takeout or food delivery order. Cook at home, save money, level up.",
    reward: "+500 XP + Badge",
    rewardDetail: "Receipt Nerd badge + major XP boost",
    progress: 6,
    target: 14,
    unit: "days",
    daysLeft: 8,
    connected: true,
    type: "budget",
  },
  {
    id: "f5",
    brand: "Adidas",
    brandColor: "#000000",
    emoji: "🏃",
    title: "10K Steps Daily",
    description: "Hit 10,000 steps every day for 10 days. Connect your health app and we'll track it automatically.",
    reward: "15% OFF Adidas",
    rewardDetail: "One-time discount code sent to your email",
    progress: 4,
    target: 10,
    unit: "days",
    daysLeft: 6,
    connected: false,
    type: "fitness",
  },
  {
    id: "f6",
    brand: "Dobbi Budget",
    brandColor: "#00B894",
    emoji: "☕",
    title: "Coffee Shop Detox",
    description: "No coffee shop purchases for 10 days. Brew at home, keep the cash. Track via your linked budget.",
    reward: "+300 XP",
    rewardDetail: "Automatically tracked from your transactions",
    progress: 3,
    target: 10,
    unit: "days",
    daysLeft: 7,
    connected: true,
    type: "budget",
  },
];

const DIFF: Record<Difficulty, { label: string; bg: string; color: string }> = {
  easy:   { label: "Easy",   bg: "#D1FAE5", color: "#065F46" },
  medium: { label: "Medium", bg: "#FEF3C7", color: "#92400E" },
  hard:   { label: "Hard",   bg: "#FEE2E2", color: "#DC2626" },
};

function GoalCard({ goal, onComplete }: { goal: Goal; onComplete: (id: string, xp: number) => void }) {
  const tc = useColors();
  const [done, setDone] = useState(false);
  const pct = Math.min((goal.progress / goal.target) * 100, 100);
  const diff = DIFF[goal.difficulty];
  const isLocked = goal.status === "locked";
  const isCompleted = done || goal.status === "completed";

  return (
    <View style={[
      styles.card,
      { backgroundColor: tc.card, borderColor: tc.border },
      isLocked && styles.cardLocked,
      isCompleted && { borderColor: "#A7F3D0", backgroundColor: tc.isDark ? "rgba(5,150,105,0.1)" : "#F9FFFD" },
    ]}>
      {isLocked && (
        <View style={[styles.lockBanner, { backgroundColor: tc.muted }]}>
          <Feather name="lock" size={12} color={tc.mutedForeground} />
          <Text style={[styles.lockText, { color: tc.mutedForeground }]}>finish easier goals first</Text>
        </View>
      )}
      <View style={styles.cardTop}>
        <View style={[styles.emojiBox, { backgroundColor: tc.secondary }]}>
          <Text style={styles.emoji}>{goal.emoji}</Text>
        </View>
        <View style={styles.cardMeta}>
          <View style={styles.titleRow}>
            <Text style={[styles.cardTitle, { color: tc.foreground }]}>{goal.title}</Text>
            <View style={[styles.diffBadge, { backgroundColor: diff.bg }]}>
              <Text style={[styles.diffText, { color: diff.color }]}>{diff.label}</Text>
            </View>
          </View>
          <Text style={[styles.cardDesc, { color: tc.mutedForeground }]}>{goal.description}</Text>
        </View>
      </View>

      <View style={styles.progressBlock}>
        <View style={styles.progressRow}>
          <Text style={[styles.progressLabel, { color: tc.mutedForeground }]}>
            {goal.unit === "$" ? `$${goal.progress} of $${goal.target}` : `${goal.progress} / ${goal.target} ${goal.unit}`}
          </Text>
          <Text style={[styles.progressPct, { color: tc.foreground }]}>{Math.round(pct)}%</Text>
        </View>
        <View style={[styles.progressTrack, { backgroundColor: tc.muted }]}>
          <LinearGradient colors={["#6355E8", "#00C896"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={[styles.progressFill, { width: `${pct}%` as any }]} />
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.actionBtn,
          { backgroundColor: tc.primary },
          isCompleted && styles.actionBtnDone,
          isLocked && { backgroundColor: tc.muted },
        ]}
        onPress={() => {
          if (isLocked || isCompleted) return;
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setDone(true);
          onComplete(goal.id, goal.xpReward);
        }}
        disabled={isLocked || isCompleted}
        activeOpacity={0.8}
      >
        {isCompleted ? (
          <View style={styles.btnRow}>
            <Feather name="check-circle" size={15} color="#059669" />
            <Text style={styles.doneText}>+{goal.xpReward} XP earned! 🎉</Text>
          </View>
        ) : (
          <View style={styles.btnRow}>
            <Feather name="zap" size={15} color="#fff" />
            <Text style={styles.btnText}>Mark Complete · +{goal.xpReward} XP</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

function ChallengeCard({ challenge, onConnect }: { challenge: FitnessChallenge; onConnect: (id: string) => void }) {
  const tc = useColors();
  const pct = Math.min((challenge.progress / challenge.target) * 100, 100);
  const isBudget = challenge.type === "budget";

  return (
    <View style={[styles.challengeCard2, { backgroundColor: tc.card, borderColor: tc.border }]}>
      <View style={[styles.challengeAccent, { backgroundColor: challenge.brandColor }]} />
      <View style={styles.challengeBody}>
        {/* Header */}
        <View style={styles.challengeTop}>
          <View style={[styles.challengeIconWrap, { backgroundColor: challenge.brandColor + "15" }]}>
            <Text style={styles.challengeIcon}>{challenge.emoji}</Text>
          </View>
          <View style={styles.challengeInfo}>
            <Text style={[styles.challengeBrand, { color: tc.mutedForeground }]}>{challenge.brand}</Text>
            <Text style={[styles.challengeName, { color: tc.foreground }]}>{challenge.title}</Text>
          </View>
          <View style={[styles.challengeTypeBadge, { backgroundColor: isBudget ? "#EDE9FE" : "#ECFDF5" }]}>
            <Text style={[styles.challengeTypeTxt, { color: isBudget ? "#7C3AED" : "#059669" }]}>
              {isBudget ? "💰 budget" : "🏃 fitness"}
            </Text>
          </View>
        </View>

        <Text style={[styles.challengeDesc, { color: tc.mutedForeground }]}>{challenge.description}</Text>

        {/* Reward */}
        <View style={styles.rewardRow}>
          <Feather name="gift" size={13} color="#F59E0B" />
          <Text style={styles.rewardText}>{challenge.reward}</Text>
          <Text style={styles.rewardDetail}> · {challenge.rewardDetail}</Text>
        </View>

        {/* Progress */}
        <View style={styles.progressBlock}>
          <View style={styles.progressRow}>
            <Text style={[styles.progressLabel, { color: tc.mutedForeground }]}>
              {challenge.progress} / {challenge.target} {challenge.unit}
            </Text>
            <View style={[styles.daysLeftPill, { backgroundColor: tc.muted }]}>
              <Feather name="clock" size={10} color={tc.mutedForeground} />
              <Text style={[styles.daysLeftText, { color: tc.mutedForeground }]}>{challenge.daysLeft}d left</Text>
            </View>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: tc.muted }]}>
            <View
              style={[
                styles.progressFill2,
                { width: `${pct}%` as any, backgroundColor: challenge.brandColor },
              ]}
            />
          </View>
        </View>

        {/* Connect / Status */}
        {challenge.connected ? (
          <View style={styles.connectedRow}>
            <Feather name="check-circle" size={14} color="#059669" />
            <Text style={styles.connectedText}>tracking automatically</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.connectBtn, { borderColor: challenge.brandColor }]}
            onPress={() => onConnect(challenge.id)}
            activeOpacity={0.8}
          >
            <Feather name="link" size={14} color={challenge.brandColor} />
            <Text style={[styles.connectBtnText, { color: challenge.brandColor }]}>
              {challenge.type === "fitness" ? "Connect App to Track" : "Start Challenge"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default function GoalsScreen() {
  const tc = useColors();
  const insets = useSafeAreaInsets();
  const { user, updateXP } = useAuth();
  const [tab, setTab] = useState<"personal" | "challenges">("personal");
  const [dailies, setDailies] = useState(DAILY_CHALLENGES);
  const [challenges, setChallenges] = useState(FITNESS_CHALLENGES);
  const topPad = Platform.OS === "web" ? insets.top + 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? insets.bottom + 34 : insets.bottom;

  const completeDailyCount = dailies.filter((d) => d.done).length;
  const dailyPct = (completeDailyCount / dailies.length) * 100;

  const handleComplete = (_id: string, xp: number) => updateXP(xp);

  const handleDaily = (id: string) => {
    setDailies((prev) => prev.map((d) => d.id === id ? { ...d, done: true } : d));
    updateXP(25);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleConnect = (id: string) => {
    const challenge = challenges.find((c) => c.id === id);
    if (!challenge) return;

    if (challenge.type === "fitness") {
      Alert.alert(
        `Connect ${challenge.brand}`,
        `Connecting your ${challenge.brand} account lets Dobbi track your progress automatically.\n\nThis feature is coming soon — we're building integrations with Nike Run Club, Peloton, and Strava. 🏃`,
        [{ text: "Can't wait!", style: "default" }]
      );
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setChallenges((prev) =>
        prev.map((c) => c.id === id ? { ...c, connected: true } : c)
      );
    }
  };

  return (
    <LinearGradient colors={tc.backgroundGradient as [string, string, ...string[]]} style={styles.root}>
      <LinearGradient colors={["#2D1B69", "#3D2A8A"]} style={[styles.header, { paddingTop: topPad + 16 }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Goals</Text>
            <Text style={styles.headerSub}>level up your money game 🎮</Text>
          </View>
          <View style={styles.xpPill}>
            <Feather name="zap" size={13} color="#FFD700" />
            <Text style={styles.xpText}>{user?.xp ?? 0} XP</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          {[
            { v: String(PERSONAL_GOALS.filter((g) => g.status === "active").length), l: "Active" },
            { v: `${user?.level ?? 1}`, l: "Level" },
            { v: `${user?.streak ?? 0}d`, l: "Streak" },
          ].map((s, i) => (
            <View key={i} style={styles.statItem}>
              <Text style={styles.statVal}>{s.v}</Text>
              <Text style={styles.statLbl}>{s.l}</Text>
            </View>
          ))}
        </View>

        <View style={styles.tabRow}>
          {(["personal", "challenges"] as const).map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.tab, tab === t && styles.tabActive]}
              onPress={() => setTab(t)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                {t === "personal" ? "My Goals" : "Challenges"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[styles.list, { paddingBottom: bottomPad + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        {tab === "personal" ? (
          <>
            <View style={[styles.challengeCard, { backgroundColor: tc.card, borderColor: tc.border }]}>
              <View style={styles.challengeHeader}>
                <View style={styles.challengeTitle}>
                  <Text style={styles.challengeEmoji}>⚡</Text>
                  <View>
                    <Text style={[styles.challengeTitleText, { color: tc.foreground }]}>daily challenges</Text>
                    <Text style={[styles.challengeSub, { color: tc.mutedForeground }]}>resets at midnight · {completeDailyCount}/{dailies.length} done</Text>
                  </View>
                </View>
                <Text style={styles.challengeXP}>+100 XP</Text>
              </View>

              <View style={[styles.challengeTrack, { backgroundColor: tc.muted }]}>
                <View style={[styles.challengeFill, { width: `${dailyPct}%` as any }]} />
              </View>

              {dailies.map((d) => (
                <TouchableOpacity
                  key={d.id}
                  style={[styles.dailyRow, d.done && styles.dailyDone]}
                  onPress={() => !d.done && handleDaily(d.id)}
                  activeOpacity={0.75}
                  disabled={d.done}
                >
                  <View style={[styles.dailyCheck, { borderColor: tc.border }, d.done && styles.dailyCheckDone]}>
                    {d.done && <Feather name="check" size={12} color="#fff" />}
                  </View>
                  <Feather name={d.icon as any} size={15} color={d.done ? "#059669" : tc.primary} />
                  <Text style={[styles.dailyText, { color: tc.foreground }, d.done && { color: tc.mutedForeground, textDecorationLine: "line-through" }]}>{d.title}</Text>
                  <View style={[styles.dailyXP, { backgroundColor: tc.secondary }]}>
                    <Text style={[styles.dailyXPText, { color: tc.primary }]}>+{d.xp} XP</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {(user?.streak ?? 0) >= 3 && (
              <View style={styles.streakBonus}>
                <Text style={styles.streakBonusEmoji}>🔥</Text>
                <View style={styles.streakBonusInfo}>
                  <Text style={styles.streakBonusTitle}>{user?.streak}d streak bonus active</Text>
                  <Text style={styles.streakBonusSub}>+10% XP on all completed goals no cap</Text>
                </View>
              </View>
            )}

            <View style={[styles.hint, { backgroundColor: tc.secondary, borderColor: tc.border }]}>
              <Feather name="info" size={13} color={tc.primary} />
              <Text style={[styles.hintText, { color: tc.foreground }]}>mark goals done when you hit them — XP adds up faster than you think 💜</Text>
            </View>

            {PERSONAL_GOALS.map((g) => <GoalCard key={g.id} goal={g} onComplete={handleComplete} />)}
          </>
        ) : (
          <>
            {/* Strava connect banner */}
            <View style={styles.stravaCard}>
              <View style={styles.stravaLeft}>
                <Text style={styles.stravaEmoji}>🏃</Text>
                <View>
                  <Text style={styles.stravaTitle}>Connect Strava</Text>
                  <Text style={styles.stravaSub}>auto-track fitness challenges</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.stravaBtn}
                onPress={() =>
                  Alert.alert("Strava Integration", "Strava sync is coming soon! We're building it now — you'll get a notification when it's live 🏃", [{ text: "Got it!" }])
                }
                activeOpacity={0.8}
              >
                <Text style={styles.stravaBtnText}>Coming Soon</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.hint, { backgroundColor: tc.secondary, borderColor: tc.border }]}>
              <Feather name="gift" size={13} color={tc.primary} />
              <Text style={[styles.hintText, { color: tc.foreground }]}>complete challenges to unlock real rewards from brands — not fake points 🎁</Text>
            </View>

            {/* Fitness challenges */}
            <View style={styles.sectionRow2}>
              <Text style={[styles.sectionTitle2, { color: tc.foreground }]}>🏋️ fitness challenges</Text>
            </View>
            {challenges.filter((c) => c.type === "fitness").map((c) => (
              <ChallengeCard key={c.id} challenge={c} onConnect={handleConnect} />
            ))}

            {/* Budget challenges */}
            <View style={styles.sectionRow2}>
              <Text style={[styles.sectionTitle2, { color: tc.foreground }]}>💸 spending challenges</Text>
            </View>
            {challenges.filter((c) => c.type === "budget").map((c) => (
              <ChallengeCard key={c.id} challenge={c} onConnect={handleConnect} />
            ))}
          </>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 0 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  headerTitle: { fontSize: 26, fontWeight: "800", color: "#fff", fontFamily: "Inter_700Bold" },
  headerSub: { fontSize: 13, color: "rgba(255,255,255,0.6)", fontFamily: "Inter_400Regular", marginTop: 2 },
  xpPill: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, gap: 5 },
  xpText: { color: "#fff", fontSize: 13, fontWeight: "700", fontFamily: "Inter_700Bold" },
  statsRow: { flexDirection: "row", marginBottom: 16 },
  statItem: { flex: 1, alignItems: "center" },
  statVal: { fontSize: 22, fontWeight: "800", color: "#fff", fontFamily: "Inter_700Bold" },
  statLbl: { fontSize: 11, color: "rgba(255,255,255,0.6)", fontFamily: "Inter_400Regular", marginTop: 2 },
  tabRow: { flexDirection: "row", backgroundColor: "rgba(0,0,0,0.2)", borderRadius: 14, padding: 3 },
  tab: { flex: 1, paddingVertical: 9, borderRadius: 11, alignItems: "center" },
  tabActive: { backgroundColor: "#fff" },
  tabText: { fontSize: 13, fontWeight: "600", color: "rgba(255,255,255,0.65)", fontFamily: "Inter_600SemiBold" },
  tabTextActive: { color: "#3730A3" },
  list: { padding: 16, gap: 10 },
  hint: { flexDirection: "row", alignItems: "flex-start", gap: 8, borderRadius: 12, padding: 12, borderWidth: 1 },
  hintText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  challengeCard: { borderRadius: 18, padding: 16, borderWidth: 1.5, gap: 12, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  challengeHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  challengeTitle: { flexDirection: "row", alignItems: "center", gap: 10 },
  challengeEmoji: { fontSize: 24 },
  challengeTitleText: { fontSize: 15, fontWeight: "700", fontFamily: "Inter_700Bold" },
  challengeSub: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  challengeXP: { fontSize: 13, fontWeight: "700", color: "#92400E", fontFamily: "Inter_700Bold", backgroundColor: "#FEF3C7", paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8 },
  challengeTrack: { height: 5, borderRadius: 3, overflow: "hidden" },
  challengeFill: { height: "100%", borderRadius: 3, backgroundColor: "#00C896" },
  dailyRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8, paddingHorizontal: 4, borderRadius: 10 },
  dailyDone: { opacity: 0.6 },
  dailyCheck: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, justifyContent: "center", alignItems: "center" },
  dailyCheckDone: { backgroundColor: "#059669", borderColor: "#059669" },
  dailyText: { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium" },
  dailyXP: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  dailyXPText: { fontSize: 11, fontWeight: "700", fontFamily: "Inter_700Bold" },
  streakBonus: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#FFF7ED", borderRadius: 14, padding: 14, borderWidth: 1.5, borderColor: "#FED7AA" },
  streakBonusEmoji: { fontSize: 28 },
  streakBonusInfo: { flex: 1 },
  streakBonusTitle: { fontSize: 14, fontWeight: "700", color: "#92400E", fontFamily: "Inter_700Bold" },
  streakBonusSub: { fontSize: 12, color: "#B45309", fontFamily: "Inter_400Regular", marginTop: 2 },
  card: { borderRadius: 18, padding: 16, gap: 12, borderWidth: 1.5, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  cardLocked: { opacity: 0.5 },
  cardDone: { borderColor: "#A7F3D0", backgroundColor: "#F9FFFD" },
  lockBanner: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, alignSelf: "flex-start" },
  lockText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  cardTop: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  emojiBox: { width: 44, height: 44, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  emoji: { fontSize: 22 },
  cardMeta: { flex: 1 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 3 },
  cardTitle: { fontSize: 15, fontWeight: "700", fontFamily: "Inter_700Bold", flex: 1 },
  diffBadge: { borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 },
  diffText: { fontSize: 10, fontWeight: "700", fontFamily: "Inter_700Bold" },
  cardDesc: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  progressBlock: { gap: 5 },
  progressRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  progressLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  progressPct: { fontSize: 12, fontWeight: "700", fontFamily: "Inter_700Bold" },
  progressTrack: { height: 7, borderRadius: 4, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 4 },
  progressFill2: { height: "100%", borderRadius: 4 },
  actionBtn: { borderRadius: 12, height: 44, justifyContent: "center", alignItems: "center" },
  actionBtnDone: { backgroundColor: "#F0FDF4", borderWidth: 1.5, borderColor: "#A7F3D0" },
  btnRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  btnText: { color: "#fff", fontSize: 14, fontWeight: "700", fontFamily: "Inter_700Bold" },
  doneText: { color: "#059669", fontSize: 14, fontWeight: "700", fontFamily: "Inter_700Bold" },
  stravaCard: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: "#FFF7ED", borderRadius: 16, padding: 14,
    borderWidth: 1.5, borderColor: "#FED7AA",
  },
  stravaLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  stravaEmoji: { fontSize: 24 },
  stravaTitle: { fontSize: 14, fontWeight: "700", color: "#92400E", fontFamily: "Inter_700Bold" },
  stravaSub: { fontSize: 12, color: "#B45309", fontFamily: "Inter_400Regular", marginTop: 1 },
  stravaBtn: { backgroundColor: "#FC4C02", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  stravaBtnText: { fontSize: 12, fontWeight: "700", color: "#fff", fontFamily: "Inter_700Bold" },
  sectionRow2: { marginTop: 8, marginBottom: 4 },
  sectionTitle2: { fontSize: 14, fontWeight: "700", fontFamily: "Inter_700Bold" },
  challengeCard2: { borderRadius: 18, flexDirection: "row", overflow: "hidden", borderWidth: 1.5, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  challengeAccent: { width: 4 },
  challengeBody: { flex: 1, padding: 14, gap: 10 },
  challengeTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  challengeIconWrap: { width: 42, height: 42, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  challengeIcon: { fontSize: 20 },
  challengeInfo: { flex: 1 },
  challengeBrand: { fontSize: 10, fontFamily: "Inter_500Medium", textTransform: "uppercase", letterSpacing: 0.8 },
  challengeName: { fontSize: 14, fontWeight: "700", fontFamily: "Inter_700Bold", marginTop: 1 },
  challengeTypeBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  challengeTypeTxt: { fontSize: 10, fontWeight: "700", fontFamily: "Inter_700Bold" },
  challengeDesc: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  rewardRow: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#FFFBEB", borderRadius: 10, padding: 10, flexWrap: "wrap" },
  rewardText: { fontSize: 13, fontWeight: "700", color: "#92400E", fontFamily: "Inter_700Bold" },
  rewardDetail: { fontSize: 11, color: "#B45309", fontFamily: "Inter_400Regular", flex: 1 },
  daysLeftPill: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  daysLeftText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  connectedRow: { flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: "#F0FDF4", borderRadius: 10, padding: 10, borderWidth: 1, borderColor: "#A7F3D0" },
  connectedText: { fontSize: 13, color: "#059669", fontFamily: "Inter_500Medium" },
  connectBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, borderRadius: 12, borderWidth: 2, paddingVertical: 11 },
  connectBtnText: { fontSize: 14, fontWeight: "700", fontFamily: "Inter_700Bold" },
});
