import React, { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { displayFont } from "@/constants/fonts";

type Difficulty = "easy" | "medium" | "hard";
type GoalStatus = "active" | "completed" | "locked";

interface Goal {
  id: string; title: string; description: string;
  xpReward: number;
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
  { id: "p1", title: "Textbook Fund", description: "Save $300 for next semester's textbooks", xpReward: 250, progress: 187, target: 300, unit: "$", status: "active", difficulty: "medium" },
  { id: "p2", title: "No Takeout Week", description: "Cook all meals for 7 days straight", xpReward: 150, progress: 5, target: 7, unit: "days", status: "active", difficulty: "easy" },
  { id: "p3", title: "Emergency Fund", description: "Build a $500 safety net", xpReward: 400, progress: 50, target: 500, unit: "$", status: "active", difficulty: "hard" },
  { id: "p4", title: "Budget Master", description: "Stay under budget for 3 months", xpReward: 500, progress: 1, target: 3, unit: "months", status: "locked", difficulty: "hard" },
];

const FITNESS_CHALLENGES: FitnessChallenge[] = [
  {
    id: "f1", brand: "Nike Running Club", brandColor: "#111111",
    title: "7-Day Run Streak",
    description: "Run every day for 7 days. Nike will send you an exclusive discount code for your next pair.",
    reward: "20% off Nike order", rewardDetail: "Reward unlocked after 7 consecutive days",
    progress: 3, target: 7, unit: "days", daysLeft: 4, connected: false, type: "fitness",
  },
  {
    id: "f2", brand: "Peloton", brandColor: "#D43F3A",
    title: "5 Rides This Week",
    description: "Complete 5 Peloton rides (any length) before Sunday. Unlock 1 free month added to your account.",
    reward: "1 Month Free", rewardDetail: "Added automatically when you hit 5 rides",
    progress: 2, target: 5, unit: "rides", daysLeft: 3, connected: false, type: "fitness",
  },
  {
    id: "f3", brand: "Planet Fitness", brandColor: "#7B2D8B",
    title: "Gym Rat Month",
    description: "Visit Planet Fitness 12 times in one month — that's 3 times per week.",
    reward: "1 Month Free", rewardDetail: "Membership credit applied to your account",
    progress: 7, target: 12, unit: "visits", daysLeft: 12, connected: false, type: "fitness",
  },
  {
    id: "f4", brand: "Dobbi Budget", brandColor: "#E8704A",
    title: "No Takeout Challenge",
    description: "Go 14 days without a single takeout or food delivery order. Cook at home, save money.",
    reward: "+500 XP + Badge", rewardDetail: "Receipt Nerd badge and major XP boost",
    progress: 6, target: 14, unit: "days", daysLeft: 8, connected: true, type: "budget",
  },
  {
    id: "f5", brand: "Adidas", brandColor: "#000000",
    title: "10K Steps Daily",
    description: "Hit 10,000 steps every day for 10 days. Connect your health app to track automatically.",
    reward: "15% off Adidas", rewardDetail: "One-time discount code sent to your email",
    progress: 4, target: 10, unit: "days", daysLeft: 6, connected: false, type: "fitness",
  },
  {
    id: "f6", brand: "Dobbi Budget", brandColor: "#5C8A6E",
    title: "Coffee Shop Detox",
    description: "No coffee shop purchases for 10 days. Brew at home, keep the cash.",
    reward: "+300 XP", rewardDetail: "Automatically tracked from your transactions",
    progress: 3, target: 10, unit: "days", daysLeft: 7, connected: true, type: "budget",
  },
];

const DIFF: Record<Difficulty, { label: string; bg: string; color: string }> = {
  easy:   { label: "Easy",   bg: "#E8F5EE", color: "#2D6A4F" },
  medium: { label: "Medium", bg: "#FEF3C7", color: "#92400E" },
  hard:   { label: "Hard",   bg: "#FDE8E8", color: "#C53030" },
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
      isLocked && { opacity: 0.5 },
      isCompleted && { borderColor: "#A7C4B5" },
    ]}>
      {isLocked && (
        <View style={[styles.lockBanner, { backgroundColor: tc.muted }]}>
          <Feather name="lock" size={12} color={tc.mutedForeground} />
          <Text style={[styles.lockText, { color: tc.mutedForeground }]}>Complete easier goals first</Text>
        </View>
      )}
      <View style={styles.cardTop}>
        <View style={[styles.diffBadge, { backgroundColor: diff.bg }]}>
          <Text style={[styles.diffText, { color: diff.color }]}>{diff.label}</Text>
        </View>
        <Text style={[styles.cardTitle, { color: tc.foreground }]}>{goal.title}</Text>
        <Text style={[styles.cardDesc, { color: tc.mutedForeground }]}>{goal.description}</Text>
      </View>

      <View style={styles.progressBlock}>
        <View style={styles.progressRow}>
          <Text style={[styles.progressLabel, { color: tc.mutedForeground }]}>
            {goal.unit === "$" ? `$${goal.progress} of $${goal.target}` : `${goal.progress} / ${goal.target} ${goal.unit}`}
          </Text>
          <Text style={[styles.progressPct, { color: tc.foreground }]}>{Math.round(pct)}%</Text>
        </View>
        <View style={[styles.progressTrack, { backgroundColor: tc.muted }]}>
          <View style={[styles.progressFill, { width: `${pct}%` as any, backgroundColor: tc.primary }]} />
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.actionBtn,
          isCompleted
            ? { backgroundColor: "#E8F5EE", borderWidth: 1, borderColor: "#A7C4B5" }
            : isLocked
            ? { backgroundColor: tc.muted }
            : { backgroundColor: tc.foreground },
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
            <Feather name="check-circle" size={15} color="#2D6A4F" />
            <Text style={[styles.doneText, { color: "#2D6A4F" }]}>+{goal.xpReward} XP earned</Text>
          </View>
        ) : (
          <View style={styles.btnRow}>
            <Feather name="zap" size={15} color={isLocked ? tc.mutedForeground : tc.onForeground} />
            <Text style={[styles.btnText, { color: isLocked ? tc.mutedForeground : tc.onForeground }]}>
              Mark complete · +{goal.xpReward} XP
            </Text>
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
        <View style={styles.challengeTop}>
          <View style={[styles.challengeIconWrap, { backgroundColor: challenge.brandColor + "15" }]}>
            <Feather name={isBudget ? "dollar-sign" : "activity"} size={18} color={challenge.brandColor} />
          </View>
          <View style={styles.challengeInfo}>
            <Text style={[styles.challengeBrand, { color: tc.mutedForeground }]}>{challenge.brand}</Text>
            <Text style={[styles.challengeName, { color: tc.foreground }]}>{challenge.title}</Text>
          </View>
          <View style={[styles.challengeTypeBadge, { backgroundColor: isBudget ? "#FDE8E8" : "#E8F5EE" }]}>
            <Text style={[styles.challengeTypeTxt, { color: isBudget ? "#C53030" : "#2D6A4F" }]}>
              {isBudget ? "budget" : "fitness"}
            </Text>
          </View>
        </View>

        <Text style={[styles.challengeDesc, { color: tc.mutedForeground }]}>{challenge.description}</Text>

        <View style={[styles.rewardRow, { backgroundColor: tc.muted, borderRadius: 10, padding: 10 }]}>
          <Feather name="gift" size={13} color={tc.gold} />
          <Text style={[styles.rewardText, { color: tc.foreground }]}>{challenge.reward}</Text>
          <Text style={[styles.rewardDetail, { color: tc.mutedForeground }]}> · {challenge.rewardDetail}</Text>
        </View>

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
            <View style={[styles.progressFill, { width: `${pct}%` as any, backgroundColor: challenge.brandColor }]} />
          </View>
        </View>

        {challenge.connected ? (
          <View style={[styles.connectedRow, { backgroundColor: "#E8F5EE", borderColor: "#A7C4B5" }]}>
            <Feather name="check-circle" size={14} color="#2D6A4F" />
            <Text style={[styles.connectedText, { color: "#2D6A4F" }]}>Tracking automatically</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.connectBtn, { borderColor: tc.isDark ? tc.border : challenge.brandColor }]}
            onPress={() => onConnect(challenge.id)}
            activeOpacity={0.8}
          >
            <Feather name="link" size={14} color={tc.isDark ? tc.mutedForeground : challenge.brandColor} />
            <Text style={[styles.connectBtnText, { color: tc.isDark ? tc.foreground : challenge.brandColor }]}>
              {challenge.type === "fitness" ? "Connect app to track" : "Start challenge"}
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
        `Connecting your ${challenge.brand} account lets Dobbi track progress automatically. This feature is coming soon.`,
        [{ text: "Got it" }]
      );
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setChallenges((prev) => prev.map((c) => c.id === id ? { ...c, connected: true } : c));
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: tc.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 16, backgroundColor: tc.background, borderBottomColor: tc.border }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.eyebrow, { color: tc.primary }]}>Habits & Goals</Text>
            <Text style={[styles.headerTitle, { color: tc.foreground }]}>Build the streak</Text>
          </View>
          <View style={[styles.xpPill, { backgroundColor: tc.muted, borderColor: tc.border }]}>
            <Feather name="zap" size={13} color={tc.gold} />
            <Text style={[styles.xpText, { color: tc.foreground }]}>{user?.xp ?? 0} XP</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          {[
            { v: String(PERSONAL_GOALS.filter((g) => g.status === "active").length), l: "Active" },
            { v: `${user?.level ?? 1}`, l: "Level" },
            { v: `${user?.streak ?? 0}d`, l: "Streak" },
          ].map((s, i) => (
            <View key={i} style={styles.statItem}>
              <Text style={[styles.statVal, { color: tc.foreground, fontFamily: displayFont }]}>{s.v}</Text>
              <Text style={[styles.statLbl, { color: tc.mutedForeground }]}>{s.l}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.tabRow, { backgroundColor: tc.muted }]}>
          {(["personal", "challenges"] as const).map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.tabBtn, tab === t && { backgroundColor: tc.isDark ? tc.primary : tc.foreground }]}
              onPress={() => setTab(t)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, { color: tab === t ? (tc.isDark ? "#fff" : tc.onForeground) : tc.mutedForeground }]}>
                {t === "personal" ? "My Goals" : "Challenges"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.list, { paddingBottom: bottomPad + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        {tab === "personal" ? (
          <>
            {/* Daily challenges */}
            <View style={[styles.dailyCard, { backgroundColor: tc.card, borderColor: tc.border }]}>
              <View style={styles.dailyCardHeader}>
                <View>
                  <Text style={[styles.sectionTitle, { color: tc.foreground }]}>Today</Text>
                  <Text style={[styles.sectionSub, { color: tc.mutedForeground }]}>
                    {completeDailyCount}/{dailies.length} done · resets at midnight
                  </Text>
                </View>
                <View style={[styles.xpChip, { backgroundColor: tc.muted }]}>
                  <Text style={[styles.xpChipText, { color: tc.gold }]}>+100 XP</Text>
                </View>
              </View>

              <View style={[styles.dailyTrack, { backgroundColor: tc.muted }]}>
                <View style={[styles.dailyFill, { width: `${dailyPct}%` as any, backgroundColor: tc.primary }]} />
              </View>

              {dailies.map((d) => (
                <TouchableOpacity
                  key={d.id}
                  style={[styles.dailyRow, d.done && { opacity: 0.55 }]}
                  onPress={() => !d.done && handleDaily(d.id)}
                  activeOpacity={0.75}
                  disabled={d.done}
                >
                  <View style={[
                    styles.dailyCheck,
                    { borderColor: tc.border },
                    d.done && { backgroundColor: tc.foreground, borderColor: tc.foreground },
                  ]}>
                    {d.done && <Feather name="check" size={12} color={tc.card} />}
                  </View>
                  <Feather name={d.icon as any} size={15} color={d.done ? tc.mutedForeground : tc.primary} />
                  <Text style={[
                    styles.dailyText,
                    { color: tc.foreground },
                    d.done && { textDecorationLine: "line-through", color: tc.mutedForeground },
                  ]}>{d.title}</Text>
                  <View style={[styles.dailyXP, { backgroundColor: tc.muted }]}>
                    <Text style={[styles.dailyXPText, { color: tc.gold }]}>+{d.xp} XP</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {(user?.streak ?? 0) >= 3 && (
              <View style={[styles.streakBonus, { backgroundColor: "#FFF7ED", borderColor: "#FED7AA" }]}>
                <Feather name="zap" size={16} color="#C9A961" />
                <View style={styles.streakBonusInfo}>
                  <Text style={[styles.streakBonusTitle, { color: "#92400E" }]}>{user?.streak}-day streak bonus active</Text>
                  <Text style={[styles.streakBonusSub, { color: "#B45309" }]}>+10% XP on all completed goals</Text>
                </View>
              </View>
            )}

            <View style={[styles.hint, { backgroundColor: tc.secondary, borderColor: tc.border }]}>
              <Feather name="info" size={13} color={tc.primary} />
              <Text style={[styles.hintText, { color: tc.foreground }]}>
                Mark goals complete when you reach them — XP accumulates quickly.
              </Text>
            </View>

            {PERSONAL_GOALS.map((g) => <GoalCard key={g.id} goal={g} onComplete={handleComplete} />)}
          </>
        ) : (
          <>
            <View style={[styles.hint, { backgroundColor: tc.muted, borderColor: tc.border }]}>
              <Feather name="clock" size={13} color={tc.mutedForeground} />
              <Text style={[styles.hintText, { color: tc.mutedForeground }]}>
                Strava and fitness app sync is coming soon. Connect your accounts to track challenges automatically.
              </Text>
            </View>

            <View style={[styles.hint, { backgroundColor: tc.secondary, borderColor: tc.border }]}>
              <Feather name="gift" size={13} color={tc.primary} />
              <Text style={[styles.hintText, { color: tc.foreground }]}>Complete challenges to unlock real rewards from brands.</Text>
            </View>

            <View style={styles.sectionRow2}>
              <Text style={[styles.sectionTitle, { color: tc.foreground }]}>Fitness challenges</Text>
            </View>
            {challenges.filter((c) => c.type === "fitness").map((c) => (
              <ChallengeCard key={c.id} challenge={c} onConnect={handleConnect} />
            ))}

            <View style={styles.sectionRow2}>
              <Text style={[styles.sectionTitle, { color: tc.foreground }]}>Spending challenges</Text>
            </View>
            {challenges.filter((c) => c.type === "budget").map((c) => (
              <ChallengeCard key={c.id} challenge={c} onConnect={handleConnect} />
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 22,
    paddingBottom: 0,
    borderBottomWidth: 1,
  },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 },
  eyebrow: {
    fontSize: 10,
    letterSpacing: 1.8,
    textTransform: "uppercase",
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    marginBottom: 4,
  },
  headerTitle: { fontSize: 30, fontFamily: displayFont, fontWeight: "500", letterSpacing: -0.5, lineHeight: 34 },
  xpPill: { flexDirection: "row", alignItems: "center", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, gap: 5, borderWidth: 1 },
  xpText: { fontSize: 13, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  statsRow: { flexDirection: "row", marginBottom: 16 },
  statItem: { flex: 1, alignItems: "center" },
  statVal: { fontSize: 24, fontWeight: "500", letterSpacing: -0.5 },
  statLbl: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  tabRow: { flexDirection: "row", borderRadius: 14, padding: 3, marginBottom: 0 },
  tabBtn: { flex: 1, paddingVertical: 9, borderRadius: 11, alignItems: "center" },
  tabText: { fontSize: 13, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  list: { padding: 16, gap: 10 },
  hint: { flexDirection: "row", alignItems: "flex-start", gap: 8, borderRadius: 12, padding: 12, borderWidth: 1 },
  hintText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  dailyCard: { borderRadius: 18, padding: 16, borderWidth: 1, gap: 12 },
  dailyCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  sectionTitle: { fontSize: 16, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  sectionSub: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  xpChip: { borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4 },
  xpChipText: { fontSize: 12, fontWeight: "700", fontFamily: "Inter_700Bold" },
  dailyTrack: { height: 4, borderRadius: 2, overflow: "hidden" },
  dailyFill: { height: "100%", borderRadius: 2 },
  dailyRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8, paddingHorizontal: 4, borderRadius: 10 },
  dailyCheck: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, justifyContent: "center", alignItems: "center" },
  dailyText: { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium" },
  dailyXP: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  dailyXPText: { fontSize: 11, fontWeight: "700", fontFamily: "Inter_700Bold" },
  streakBonus: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 14, padding: 14, borderWidth: 1 },
  streakBonusInfo: { flex: 1 },
  streakBonusTitle: { fontSize: 14, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  streakBonusSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  card: { borderRadius: 18, padding: 16, gap: 12, borderWidth: 1 },
  lockBanner: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, alignSelf: "flex-start" },
  lockText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  cardTop: { gap: 5 },
  diffBadge: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, alignSelf: "flex-start" },
  diffText: { fontSize: 10, fontWeight: "700", fontFamily: "Inter_700Bold" },
  cardTitle: { fontSize: 16, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  cardDesc: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  progressBlock: { gap: 5 },
  progressRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  progressLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  progressPct: { fontSize: 12, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  progressTrack: { height: 5, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3 },
  actionBtn: { borderRadius: 12, height: 44, justifyContent: "center", alignItems: "center" },
  btnRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  btnText: { fontSize: 14, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  doneText: { fontSize: 14, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  sectionRow2: { marginTop: 8, marginBottom: 4 },
  challengeCard2: { borderRadius: 18, flexDirection: "row", overflow: "hidden", borderWidth: 1 },
  challengeAccent: { width: 4 },
  challengeBody: { flex: 1, padding: 14, gap: 10 },
  challengeTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  challengeIconWrap: { width: 40, height: 40, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  challengeInfo: { flex: 1 },
  challengeBrand: { fontSize: 10, fontFamily: "Inter_500Medium", textTransform: "uppercase", letterSpacing: 0.8 },
  challengeName: { fontSize: 14, fontWeight: "600", fontFamily: "Inter_600SemiBold", marginTop: 1 },
  challengeTypeBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  challengeTypeTxt: { fontSize: 10, fontWeight: "700", fontFamily: "Inter_700Bold" },
  challengeDesc: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  rewardRow: { flexDirection: "row", alignItems: "center", gap: 5, flexWrap: "wrap" },
  rewardText: { fontSize: 13, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  rewardDetail: { fontSize: 11, fontFamily: "Inter_400Regular", flex: 1 },
  daysLeftPill: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  daysLeftText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  connectedRow: { flexDirection: "row", alignItems: "center", gap: 7, borderRadius: 10, padding: 10, borderWidth: 1 },
  connectedText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  connectBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, borderRadius: 12, borderWidth: 2, paddingVertical: 11 },
  connectBtnText: { fontSize: 14, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
});
