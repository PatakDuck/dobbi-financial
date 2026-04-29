import React, { useState, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform,
  Modal, TextInput, Alert, Switch,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useColors } from "@/hooks/useColors";
import { displayFont } from "@/constants/fonts";

const LEVEL_XP: Record<number, number> = {
  1: 0, 2: 200, 3: 500, 4: 900, 5: 1400, 6: 2000, 7: 2700,
};
const LEVEL_PERKS: Record<number, string> = {
  2: "Unlock deal alerts",
  3: "Custom budget categories",
  4: "Weekly money report",
  5: "Exclusive sponsored deals",
  6: "Dobbi Pro badge",
  7: "Leaderboard access",
};

function xpFor(level: number) { return LEVEL_XP[level] ?? level * 300; }
function xpForNext(level: number) { return LEVEL_XP[level + 1] ?? (level + 1) * 300; }

const BADGES = [
  { id: "first-deal",   label: "First Deal",    icon: "target",      desc: "Claimed your first student deal",         unlocked: true  },
  { id: "budget-pro",   label: "Budget Pro",    icon: "pie-chart",   desc: "Categorized a full week of spending",     unlocked: true  },
  { id: "saver-streak", label: "Week Streak",   icon: "zap",         desc: "Logged in 7 days straight",               unlocked: true  },
  { id: "deal-hunter",  label: "Deal Hunter",   icon: "award",       desc: "Claim 10 deals to unlock",                unlocked: false },
  { id: "penny",        label: "Penny Pincher", icon: "trending-up", desc: "Save $100 in one month",                  unlocked: false },
  { id: "level5",       label: "Level 5",       icon: "star",        desc: "Reach level 5",                           unlocked: false },
  { id: "scanner",      label: "Receipt Nerd",  icon: "camera",      desc: "Scan 5 receipts",                         unlocked: false },
  { id: "goalcrush",    label: "Goal Crusher",  icon: "check-circle",desc: "Complete 3 personal goals",               unlocked: false },
];

const RECENT_ACTIVITY = [
  { id: "a1", text: "Marked 'No Takeout Week' 5 of 7 days", xp: 75, time: "2h ago",     icon: "check-circle" },
  { id: "a2", text: "Claimed Spotify student deal",          xp: 50, time: "Yesterday",  icon: "tag"          },
  { id: "a3", text: "Logged 8 transactions this week",       xp: 40, time: "3 days ago", icon: "bar-chart-2"  },
  { id: "a4", text: "Textbook Fund 62% funded",              xp: 0,  time: "4 days ago", icon: "trending-up"  },
];

const AVATAR_OPTIONS = ["🎓", "🦊", "🐼", "🐸", "🦁", "🐯", "🐙", "🦄", "🐬", "🦋", "🌟", "🔥"];

const INTEREST_OPTIONS = [
  { id: "food",      label: "Food & Dining", emoji: "🍕" },
  { id: "fitness",   label: "Fitness",       emoji: "💪" },
  { id: "gaming",    label: "Gaming",        emoji: "🎮" },
  { id: "fashion",   label: "Fashion",       emoji: "👗" },
  { id: "travel",    label: "Travel",        emoji: "✈️" },
  { id: "music",     label: "Music",         emoji: "🎵" },
  { id: "tech",      label: "Tech",          emoji: "💻" },
  { id: "wellness",  label: "Wellness",      emoji: "🧘" },
  { id: "coffee",    label: "Coffee",        emoji: "☕" },
  { id: "sports",    label: "Sports",        emoji: "⚽" },
  { id: "art",       label: "Art & Design",  emoji: "🎨" },
  { id: "education", label: "Learning",      emoji: "📚" },
];

const CONNECTED_APPS = [
  { id: "bank",  name: "Bank Account", icon: "credit-card", color: "#E8704A", connected: false, sub: "Link your bank to auto-import transactions" },
  { id: "apple", name: "Apple Pay",    icon: "smartphone",  color: "#555555", connected: false, sub: "Sync Apple Pay purchases instantly" },
  { id: "venmo", name: "Venmo",        icon: "send",        color: "#008CFF", connected: false, sub: "Import split payments from friends" },
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const tc = useColors();
  const topPad = Platform.OS === "web" ? insets.top + 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? insets.bottom + 34 : insets.bottom;

  const [editModal, setEditModal] = useState(false);
  const [editName, setEditName] = useState(user?.name ?? "");
  const [editAvatar, setEditAvatar] = useState(user?.avatar ?? "🎓");
  const [editGoal, setEditGoal] = useState(String(user?.savingsGoal ?? ""));

  const [idModal, setIdModal] = useState(false);
  const [idSchool, setIdSchool] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [idSaved, setIdSaved] = useState(false);

  const [interests, setInterests] = useState<string[]>([]);
  const [interestModal, setInterestModal] = useState(false);

  const [connectedApps, setConnectedApps] = useState(
    CONNECTED_APPS.reduce<Record<string, boolean>>((acc, a) => { acc[a.id] = a.connected; return acc; }, {})
  );

  useEffect(() => {
    AsyncStorage.getItem("dobbi_user_interests").then((raw) => {
      if (raw) setInterests(JSON.parse(raw));
    });
    AsyncStorage.getItem("dobbi_student_id").then((raw) => {
      if (raw) {
        const data = JSON.parse(raw);
        setIdSchool(data.school ?? "");
        setIdNumber(data.number ?? "");
        setIdSaved(true);
      }
    });
  }, []);

  if (!user) return null;

  const curXP = xpFor(user.level);
  const nextXP = xpForNext(user.level);
  const progress = Math.min((user.xp - curXP) / (nextXP - curXP), 1);
  const xpLeft = nextXP - user.xp;
  const unlockedCount = BADGES.filter((b) => b.unlocked).length;
  const savingsPct = Math.round((user.savedSoFar / user.savingsGoal) * 100);

  const handleSaveProfile = () => {
    setEditModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleSaveID = async () => {
    if (!idSchool.trim() || !idNumber.trim()) {
      Alert.alert("Fill both fields", "Enter your school name and student ID number.");
      return;
    }
    await AsyncStorage.setItem("dobbi_student_id", JSON.stringify({ school: idSchool, number: idNumber }));
    setIdSaved(true);
    setIdModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const toggleInterest = (id: string) => {
    setInterests((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  };

  const handleSaveInterests = async () => {
    await AsyncStorage.setItem("dobbi_user_interests", JSON.stringify(interests));
    setInterestModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleToggleApp = (id: string) => {
    if (id === "bank") {
      Alert.alert("Connect Bank Account", "We're building Plaid integration — securely link your bank to auto-import every transaction. Coming soon.");
      return;
    }
    Alert.alert("Coming Soon", "This integration is almost ready.");
  };

  const displayNameStr = editName || user.name;
  const initial = displayNameStr.charAt(0).toUpperCase();

  return (
    <View style={[styles.root, { backgroundColor: tc.background }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* App bar */}
        <View style={[styles.appbar, { paddingTop: topPad + 16, backgroundColor: tc.background }]}>
          <View>
            <Text style={[styles.eyebrow, { color: tc.primary }]}>Profile</Text>
            <Text style={[styles.appbarTitle, { color: tc.foreground }]}>{displayNameStr}</Text>
          </View>
          <TouchableOpacity
            style={[styles.settingsBtn, { backgroundColor: tc.muted, borderColor: tc.border }]}
            onPress={() => setEditModal(true)}
            activeOpacity={0.7}
          >
            <Feather name="settings" size={14} color={tc.mutedForeground} />
            <Text style={[styles.settingsBtnText, { color: tc.mutedForeground }]}>Settings</Text>
          </TouchableOpacity>
        </View>

        {/* Identity card */}
        <View style={styles.padded}>
          <View style={[styles.identityCard, { backgroundColor: tc.card, borderColor: tc.border }]}>
            <View style={[styles.avatar, { backgroundColor: tc.foreground }]}>
              <Text style={[styles.avatarInitial, { color: tc.onForeground, fontFamily: displayFont }]}>{initial}</Text>
            </View>
            <View style={styles.identityInfo}>
              <Text style={[styles.identityEmail, { color: tc.mutedForeground }]}>{user.email}</Text>
              <View style={styles.identityMeta}>
                <View style={[styles.levelPill, { backgroundColor: tc.foreground }]}>
                  <Text style={[styles.levelPillText, { color: tc.onForeground }]}>Level {user.level}</Text>
                </View>
                <Text style={[styles.identityStats, { color: tc.mutedForeground }]}>
                  {user.xp} XP · {user.streak}d streak
                </Text>
              </View>
            </View>
          </View>

          {/* Level progress */}
          <View style={[styles.card, { backgroundColor: tc.card, borderColor: tc.border, marginTop: 10 }]}>
            <View style={styles.levelProgressRow}>
              <Text style={[styles.levelProgressLabel, { color: tc.mutedForeground }]}>
                {xpLeft} XP to Level {user.level + 1}
              </Text>
              {LEVEL_PERKS[user.level + 1] && (
                <Text style={[styles.levelProgressPerk, { color: tc.foreground }]}>
                  Unlocks: {LEVEL_PERKS[user.level + 1]}
                </Text>
              )}
            </View>
            <View style={[styles.xpTrack, { backgroundColor: tc.muted }]}>
              <View style={[styles.xpFill, { width: `${progress * 100}%` as any, backgroundColor: tc.isDark ? tc.primary : tc.foreground }]} />
            </View>
          </View>

          {/* Stats grid */}
          <View style={styles.statsGrid}>
            {[
              { v: `$${user.savedSoFar}`, l: "Saved this year",  accent: tc.foreground },
              { v: String(user.xp),       l: "Total XP",         accent: tc.primary    },
              { v: `${user.streak}d`,     l: "Streak",           accent: tc.green      },
              { v: `${unlockedCount}`,    l: "Badges earned",    accent: tc.gold       },
            ].map((s, i) => (
              <View key={i} style={[styles.statCard, { backgroundColor: tc.card, borderColor: tc.border }]}>
                <Text style={[styles.statVal, { color: s.accent, fontFamily: displayFont }]}>{s.v}</Text>
                <Text style={[styles.statLabel, { color: tc.mutedForeground }]}>{s.l}</Text>
              </View>
            ))}
          </View>

          {/* Insight */}
          <View style={[styles.insightCard, { backgroundColor: tc.muted, borderColor: tc.border }]}>
            <Feather name="trending-up" size={15} color={tc.primary} />
            <Text style={[styles.insightText, { color: tc.foreground }]}>
              You're saving more than{" "}
              <Text style={{ fontFamily: "Inter_700Bold", color: tc.primary }}>67% of students</Text> your age.
            </Text>
          </View>

          {/* Student ID */}
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <Text style={[styles.sectionTitle, { color: tc.foreground }]}>Student ID</Text>
              <TouchableOpacity
                onPress={() => setIdModal(true)}
                style={[styles.editChip, { backgroundColor: tc.secondary, borderColor: tc.border }]}
                activeOpacity={0.7}
              >
                <Feather name={idSaved ? "edit-2" : "plus"} size={12} color={tc.primary} />
                <Text style={[styles.editChipText, { color: tc.primary }]}>{idSaved ? "Edit" : "Add"}</Text>
              </TouchableOpacity>
            </View>
            {idSaved ? (
              <View style={[styles.idCard, { backgroundColor: "#0E1A2B" }]}>
                <View style={styles.idCardTop}>
                  <View style={[styles.idSchoolBadge, { backgroundColor: "rgba(245,239,230,0.15)" }]}>
                    <Text style={styles.idSchoolText}>{idSchool}</Text>
                  </View>
                  <Text style={styles.idCardLabel}>Student Card</Text>
                </View>
                <View style={styles.idCardBottom}>
                  <View style={[styles.idAvatar, { backgroundColor: "rgba(245,239,230,0.15)" }]}>
                    <Text style={{ fontSize: 22 }}>{editAvatar || user.avatar}</Text>
                  </View>
                  <View>
                    <Text style={styles.idName}>{displayNameStr}</Text>
                    <Text style={styles.idNumber}>ID: {idNumber}</Text>
                  </View>
                  <View style={styles.idChip}><View style={styles.idChipInner} /></View>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.idEmptyCard, { borderColor: tc.border, backgroundColor: tc.muted }]}
                onPress={() => setIdModal(true)}
                activeOpacity={0.7}
              >
                <Feather name="credit-card" size={24} color={tc.mutedForeground} style={{ opacity: 0.5 }} />
                <Text style={[styles.idEmptyText, { color: tc.foreground }]}>Add your student ID card</Text>
                <Text style={[styles.idEmptySub, { color: tc.mutedForeground }]}>Unlock student-only deals</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Interests */}
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <Text style={[styles.sectionTitle, { color: tc.foreground }]}>Your Interests</Text>
              <TouchableOpacity
                onPress={() => setInterestModal(true)}
                style={[styles.editChip, { backgroundColor: tc.secondary, borderColor: tc.border }]}
                activeOpacity={0.7}
              >
                <Feather name="sliders" size={12} color={tc.primary} />
                <Text style={[styles.editChipText, { color: tc.primary }]}>Edit</Text>
              </TouchableOpacity>
            </View>
            {interests.length > 0 ? (
              <View style={styles.interestPills}>
                {interests.map((id) => {
                  const opt = INTEREST_OPTIONS.find((o) => o.id === id);
                  if (!opt) return null;
                  return (
                    <View key={id} style={[styles.interestPill, { backgroundColor: tc.muted, borderColor: tc.border }]}>
                      <Text style={styles.interestEmoji}>{opt.emoji}</Text>
                      <Text style={[styles.interestLabel, { color: tc.foreground }]}>{opt.label}</Text>
                    </View>
                  );
                })}
                <TouchableOpacity
                  style={[styles.interestAddPill, { backgroundColor: tc.muted, borderColor: tc.border }]}
                  onPress={() => setInterestModal(true)}
                  activeOpacity={0.7}
                >
                  <Feather name="plus" size={12} color={tc.primary} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.interestEmpty, { backgroundColor: tc.muted, borderColor: tc.border }]}
                onPress={() => setInterestModal(true)}
                activeOpacity={0.7}
              >
                <Text style={[styles.interestEmptyText, { color: tc.primary }]}>Select your interests for personalized deals</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Savings goal */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: tc.foreground }]}>Savings Goal</Text>
            <View style={[styles.card, { backgroundColor: tc.card, borderColor: tc.border }]}>
              <View style={styles.goalRow}>
                <View>
                  <Text style={[styles.goalName, { color: tc.foreground }]}>Textbook Fund</Text>
                  <View style={{ flexDirection: "row", alignItems: "baseline", gap: 3, marginTop: 4 }}>
                    <Text style={[styles.goalAmtBig, { color: tc.foreground, fontFamily: displayFont }]}>${user.savedSoFar}</Text>
                    <Text style={[styles.goalAmtOf, { color: tc.mutedForeground }]}>of ${user.savingsGoal}</Text>
                  </View>
                </View>
                <View style={[styles.goalPct, { backgroundColor: tc.muted }]}>
                  <Text style={[styles.goalPctText, { color: tc.primary, fontFamily: displayFont }]}>{savingsPct}%</Text>
                </View>
              </View>
              <View style={[styles.goalTrack, { backgroundColor: tc.muted }]}>
                <View style={[styles.goalFill, { width: `${savingsPct}%` as any, backgroundColor: tc.isDark ? tc.primary : tc.foreground }]} />
              </View>
              <Text style={[styles.goalSub, { color: tc.mutedForeground }]}>
                ${user.savingsGoal - user.savedSoFar} more to reach your goal
              </Text>
            </View>
          </View>

          {/* Badges */}
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <Text style={[styles.sectionTitle, { color: tc.foreground }]}>Achievements</Text>
              <Text style={[styles.sectionSub, { color: tc.mutedForeground }]}>{unlockedCount}/{BADGES.length} unlocked</Text>
            </View>
            <View style={styles.badgeGrid}>
              {BADGES.map((b) => (
                <TouchableOpacity
                  key={b.id}
                  style={[
                    styles.badgeCard,
                    { backgroundColor: tc.card, borderColor: tc.border },
                    !b.unlocked && { backgroundColor: tc.muted, opacity: 0.5 },
                  ]}
                  activeOpacity={0.75}
                  onPress={() => Alert.alert(b.label, b.desc)}
                >
                  <View style={[
                    styles.badgeIconWrap,
                    { backgroundColor: b.unlocked ? tc.foreground : tc.muted },
                  ]}>
                    <Feather
                      name={(b.unlocked ? b.icon : "lock") as any}
                      size={14}
                      color={b.unlocked ? tc.onForeground : tc.mutedForeground}
                    />
                  </View>
                  <Text style={[styles.badgeName, { color: b.unlocked ? tc.foreground : tc.mutedForeground }]}>{b.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Linked accounts */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: tc.foreground }]}>Linked Accounts</Text>
            <View style={[styles.card, { backgroundColor: tc.card, borderColor: tc.border }]}>
              {CONNECTED_APPS.map((app, i) => (
                <View key={app.id}>
                  <View style={styles.appRow}>
                    <View style={[styles.appIcon, { backgroundColor: app.color + "18" }]}>
                      <Feather name={app.icon as any} size={18} color={app.color} />
                    </View>
                    <View style={styles.appInfo}>
                      <Text style={[styles.appName, { color: tc.foreground }]}>{app.name}</Text>
                      <Text style={[styles.appSub, { color: tc.mutedForeground }]}>{app.sub}</Text>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.appToggle,
                        { borderColor: tc.border },
                        connectedApps[app.id] && { backgroundColor: tc.secondary, borderColor: tc.border },
                      ]}
                      onPress={() => handleToggleApp(app.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.appToggleText, { color: connectedApps[app.id] ? tc.primary : tc.mutedForeground }]}>
                        {connectedApps[app.id] ? "Connected" : "Connect"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  {i < CONNECTED_APPS.length - 1 && <View style={[styles.divider, { backgroundColor: tc.border }]} />}
                </View>
              ))}
            </View>
          </View>

          {/* Recent activity */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: tc.foreground }]}>Recent Activity</Text>
            <View style={[styles.card, { backgroundColor: tc.card, borderColor: tc.border }]}>
              {RECENT_ACTIVITY.map((a, i) => (
                <View key={a.id}>
                  <View style={styles.actRow}>
                    <View style={[styles.actIcon, { backgroundColor: tc.muted }]}>
                      <Feather name={a.icon as any} size={15} color={tc.mutedForeground} />
                    </View>
                    <View style={styles.actInfo}>
                      <Text style={[styles.actText, { color: tc.foreground }]}>{a.text}</Text>
                      <Text style={[styles.actTime, { color: tc.mutedForeground }]}>{a.time}</Text>
                    </View>
                    {a.xp > 0 && (
                      <View style={[styles.actXP, { backgroundColor: tc.muted }]}>
                        <Text style={[styles.actXPText, { color: tc.gold }]}>+{a.xp} XP</Text>
                      </View>
                    )}
                  </View>
                  {i < RECENT_ACTIVITY.length - 1 && <View style={[styles.divider, { backgroundColor: tc.border }]} />}
                </View>
              ))}
            </View>
          </View>

          {/* Settings */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: tc.foreground }]}>Settings</Text>
            <View style={[styles.card, { backgroundColor: tc.card, borderColor: tc.border }]}>
              <View style={styles.settingRow}>
                <View style={[styles.settingIcon, { backgroundColor: tc.muted }]}>
                  <Feather name={isDark ? "moon" : "sun"} size={16} color={tc.mutedForeground} />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingLabel, { color: tc.foreground }]}>
                    {isDark ? "Dark mode" : "Light mode"}
                  </Text>
                  <Text style={[styles.settingSub, { color: tc.mutedForeground }]}>
                    {isDark ? "Switch to light" : "Switch to dark"}
                  </Text>
                </View>
                <Switch
                  value={isDark}
                  onValueChange={toggleTheme}
                  trackColor={{ false: tc.border, true: tc.primary }}
                  thumbColor={tc.isDark ? "#fff" : "#fff"}
                />
              </View>
              <View style={[styles.divider, { backgroundColor: tc.border }]} />
              {[
                { icon: "bell",        label: "Notifications", sub: "Daily check-ins on"    },
                { icon: "shield",      label: "Privacy",       sub: "Your data stays yours" },
                { icon: "help-circle", label: "About Dobbi",   sub: "v2.0"                  },
              ].map((s, i, arr) => (
                <View key={s.label}>
                  <TouchableOpacity style={styles.settingRow} activeOpacity={0.7}>
                    <View style={[styles.settingIcon, { backgroundColor: tc.muted }]}>
                      <Feather name={s.icon as any} size={16} color={tc.mutedForeground} />
                    </View>
                    <View style={styles.settingInfo}>
                      <Text style={[styles.settingLabel, { color: tc.foreground }]}>{s.label}</Text>
                      <Text style={[styles.settingSub, { color: tc.mutedForeground }]}>{s.sub}</Text>
                    </View>
                    <Feather name="chevron-right" size={16} color={tc.mutedForeground} />
                  </TouchableOpacity>
                  {i < arr.length - 1 && <View style={[styles.divider, { backgroundColor: tc.border }]} />}
                </View>
              ))}
            </View>
          </View>

          {/* Sign out */}
          <TouchableOpacity
            style={[styles.signoutBtn, { backgroundColor: "#FEF2F2", borderColor: "#FECACA" }]}
            onPress={logout}
            activeOpacity={0.8}
          >
            <Feather name="log-out" size={16} color="#E8553E" />
            <Text style={[styles.signoutText, { color: "#E8553E" }]}>Sign out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={editModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: tc.isDark ? "#141428" : tc.card }]}>
            <View style={[styles.modalHandle, { backgroundColor: tc.border }]} />
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: tc.foreground }]}>Edit profile</Text>
              <TouchableOpacity onPress={() => setEditModal(false)} style={[styles.closeBtn, { backgroundColor: tc.muted }]}>
                <Feather name="x" size={20} color={tc.mutedForeground} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.fieldLabel, { color: tc.mutedForeground }]}>Avatar</Text>
              <View style={styles.avatarGrid}>
                {AVATAR_OPTIONS.map((emoji) => (
                  <TouchableOpacity
                    key={emoji}
                    style={[
                      styles.avatarOption,
                      { backgroundColor: tc.muted, borderColor: tc.border },
                      editAvatar === emoji && { borderColor: tc.foreground, backgroundColor: tc.secondary },
                    ]}
                    onPress={() => setEditAvatar(emoji)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.avatarOptionEmoji}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={[styles.fieldLabel, { color: tc.mutedForeground }]}>Display name</Text>
              <TextInput
                style={[styles.fieldInput, { backgroundColor: tc.muted, borderColor: tc.border, color: tc.foreground }]}
                value={editName}
                onChangeText={setEditName}
                placeholder="Your name"
                placeholderTextColor={tc.mutedForeground}
              />
              <Text style={[styles.fieldLabel, { color: tc.mutedForeground }]}>Savings goal ($)</Text>
              <TextInput
                style={[styles.fieldInput, { backgroundColor: tc.muted, borderColor: tc.border, color: tc.foreground }]}
                value={editGoal}
                onChangeText={setEditGoal}
                placeholder="e.g. 500"
                placeholderTextColor={tc.mutedForeground}
                keyboardType="numeric"
              />
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: tc.foreground }]}
                onPress={handleSaveProfile}
                activeOpacity={0.85}
              >
                <Text style={[styles.saveBtnText, { color: tc.onForeground }]}>Save Changes</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Student ID Modal */}
      <Modal visible={idModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: tc.isDark ? "#141428" : tc.card }]}>
            <View style={[styles.modalHandle, { backgroundColor: tc.border }]} />
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: tc.foreground }]}>Student ID</Text>
              <TouchableOpacity onPress={() => setIdModal(false)} style={[styles.closeBtn, { backgroundColor: tc.muted }]}>
                <Feather name="x" size={20} color={tc.mutedForeground} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.fieldLabel, { color: tc.mutedForeground }]}>University / College</Text>
            <TextInput
              style={[styles.fieldInput, { backgroundColor: tc.muted, borderColor: tc.border, color: tc.foreground }]}
              value={idSchool}
              onChangeText={setIdSchool}
              placeholder="e.g. University of Michigan"
              placeholderTextColor={tc.mutedForeground}
            />
            <Text style={[styles.fieldLabel, { color: tc.mutedForeground }]}>Student ID number</Text>
            <TextInput
              style={[styles.fieldInput, { backgroundColor: tc.muted, borderColor: tc.border, color: tc.foreground }]}
              value={idNumber}
              onChangeText={setIdNumber}
              placeholder="e.g. U12345678"
              placeholderTextColor={tc.mutedForeground}
              autoCapitalize="characters"
            />
            <View style={styles.idNote}>
              <Feather name="lock" size={13} color={tc.mutedForeground} />
              <Text style={[styles.idNoteText, { color: tc.mutedForeground }]}>Stored only on your device — never shared</Text>
            </View>
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: tc.foreground }]}
              onPress={handleSaveID}
              activeOpacity={0.85}
            >
              <Text style={[styles.saveBtnText, { color: tc.onForeground }]}>Save ID</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Interests Modal */}
      <Modal visible={interestModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: tc.isDark ? "#141428" : tc.card, maxHeight: "80%" }]}>
            <View style={[styles.modalHandle, { backgroundColor: tc.border }]} />
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: tc.foreground }]}>Your interests</Text>
                <Text style={[styles.modalSub, { color: tc.mutedForeground }]}>Used to personalize your deals</Text>
              </View>
              <TouchableOpacity onPress={() => setInterestModal(false)} style={[styles.closeBtn, { backgroundColor: tc.muted }]}>
                <Feather name="x" size={20} color={tc.mutedForeground} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.interestGrid}>
                {INTEREST_OPTIONS.map((opt) => {
                  const selected = interests.includes(opt.id);
                  return (
                    <TouchableOpacity
                      key={opt.id}
                      style={[
                        styles.interestGridItem,
                        { backgroundColor: tc.muted, borderColor: tc.border },
                        selected && { backgroundColor: tc.secondary, borderColor: tc.foreground + "40" },
                      ]}
                      onPress={() => toggleInterest(opt.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.interestGridEmoji}>{opt.emoji}</Text>
                      <Text style={[styles.interestGridLabel, { color: selected ? tc.foreground : tc.mutedForeground }]}>
                        {opt.label}
                      </Text>
                      {selected && <Feather name="check" size={11} color={tc.primary} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: tc.foreground, marginTop: 8 }]}
                onPress={handleSaveInterests}
                activeOpacity={0.85}
              >
                <Text style={[styles.saveBtnText, { color: tc.onForeground }]}>Save Interests ({interests.length})</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { gap: 0 },
  appbar: {
    paddingHorizontal: 22,
    paddingBottom: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  eyebrow: {
    fontSize: 10,
    letterSpacing: 1.8,
    textTransform: "uppercase",
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    marginBottom: 4,
  },
  appbarTitle: { fontSize: 30, fontFamily: displayFont, fontWeight: "500", letterSpacing: -0.5 },
  settingsBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    marginBottom: 4,
  },
  settingsBtnText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  padded: { paddingHorizontal: 16, paddingBottom: 12 },
  identityCard: {
    borderRadius: 18,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderWidth: 1,
    marginBottom: 0,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  avatarInitial: { fontSize: 22, fontWeight: "500" },
  identityInfo: { flex: 1 },
  identityEmail: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 6 },
  identityMeta: { flexDirection: "row", alignItems: "center", gap: 8 },
  levelPill: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  levelPillText: { fontSize: 11, fontWeight: "700", fontFamily: "Inter_700Bold" },
  identityStats: { fontSize: 12, fontFamily: "Inter_400Regular" },
  card: { borderRadius: 18, padding: 16, borderWidth: 1 },
  levelProgressRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  levelProgressLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  levelProgressPerk: { fontSize: 12, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  xpTrack: { height: 5, borderRadius: 3, overflow: "hidden" },
  xpFill: { height: "100%", borderRadius: 3 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 10 },
  statCard: { width: "47%", borderRadius: 16, padding: 14, borderWidth: 1 },
  statVal: { fontSize: 26, fontWeight: "400", letterSpacing: -0.5 },
  statLabel: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 4 },
  insightCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    marginTop: 10,
  },
  insightText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  section: { marginTop: 22 },
  sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  sectionTitle: { fontSize: 14, fontWeight: "700", fontFamily: "Inter_700Bold", marginBottom: 10 },
  sectionSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  editChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
  },
  editChipText: { fontSize: 12, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  idCard: { borderRadius: 20, padding: 20 },
  idCardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  idSchoolBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  idSchoolText: { fontSize: 11, color: "#F5EFE6", fontFamily: "Inter_600SemiBold" },
  idCardLabel: { fontSize: 11, color: "rgba(245,239,230,0.6)", fontFamily: "Inter_400Regular" },
  idCardBottom: { flexDirection: "row", alignItems: "center", gap: 14 },
  idAvatar: { width: 48, height: 48, borderRadius: 24, justifyContent: "center", alignItems: "center" },
  idName: { fontSize: 16, fontWeight: "700", color: "#F5EFE6", fontFamily: "Inter_700Bold" },
  idNumber: { fontSize: 12, color: "rgba(245,239,230,0.65)", fontFamily: "Inter_400Regular", marginTop: 2 },
  idChip: { marginLeft: "auto", width: 36, height: 28, borderRadius: 6, backgroundColor: "rgba(255,215,0,0.6)", justifyContent: "center", alignItems: "center" },
  idChipInner: { width: 24, height: 18, borderRadius: 4, backgroundColor: "rgba(255,215,0,0.8)" },
  idEmptyCard: { borderRadius: 20, borderWidth: 1, borderStyle: "dashed", padding: 28, alignItems: "center", gap: 8 },
  idEmptyText: { fontSize: 14, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  idEmptySub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  interestPills: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  interestPill: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1 },
  interestEmoji: { fontSize: 14 },
  interestLabel: { fontSize: 12, fontWeight: "500", fontFamily: "Inter_500Medium" },
  interestAddPill: { width: 34, height: 34, borderRadius: 17, justifyContent: "center", alignItems: "center", borderWidth: 1 },
  interestEmpty: { borderRadius: 14, padding: 14, borderWidth: 1 },
  interestEmptyText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  goalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  goalName: { fontSize: 15, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  goalAmtBig: { fontSize: 22, fontWeight: "400", letterSpacing: -0.4 },
  goalAmtOf: { fontSize: 13, fontFamily: "Inter_400Regular" },
  goalPct: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  goalPctText: { fontSize: 18, fontWeight: "400" },
  goalTrack: { height: 5, borderRadius: 3, overflow: "hidden", marginBottom: 8 },
  goalFill: { height: "100%", borderRadius: 3 },
  goalSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  badgeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  badgeCard: {
    width: "22%",
    aspectRatio: 0.85,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    paddingVertical: 10,
  },
  badgeIconWrap: { width: 32, height: 32, borderRadius: 16, justifyContent: "center", alignItems: "center" },
  badgeName: { fontSize: 10, fontWeight: "600", fontFamily: "Inter_600SemiBold", textAlign: "center" },
  appRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8 },
  appIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  appInfo: { flex: 1 },
  appName: { fontSize: 14, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  appSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  appToggle: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1 },
  appToggleText: { fontSize: 12, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  actRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 6 },
  actIcon: { width: 34, height: 34, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  actInfo: { flex: 1 },
  actText: { fontSize: 13, fontFamily: "Inter_500Medium", lineHeight: 18 },
  actTime: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  actXP: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  actXPText: { fontSize: 11, fontWeight: "700", fontFamily: "Inter_700Bold" },
  divider: { height: 1, marginVertical: 4 },
  settingRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8 },
  settingIcon: { width: 34, height: 34, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  settingInfo: { flex: 1 },
  settingLabel: { fontSize: 14, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  settingSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  signoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 22,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  signoutText: { fontSize: 14, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingBottom: 36, maxHeight: "75%" },
  modalHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: "center", marginTop: 12, marginBottom: 16 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  modalSub: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  closeBtn: { width: 32, height: 32, borderRadius: 16, justifyContent: "center", alignItems: "center" },
  fieldLabel: { fontSize: 13, fontWeight: "600", fontFamily: "Inter_600SemiBold", marginBottom: 8, marginTop: 14 },
  fieldInput: { borderRadius: 12, paddingHorizontal: 14, height: 48, fontSize: 15, fontFamily: "Inter_400Regular", borderWidth: 1 },
  avatarGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 4 },
  avatarOption: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, justifyContent: "center", alignItems: "center" },
  avatarOptionEmoji: { fontSize: 24 },
  idNote: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12 },
  idNoteText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  interestGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, paddingBottom: 8 },
  interestGridItem: { flexDirection: "row", alignItems: "center", gap: 7, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9, borderWidth: 1 },
  interestGridEmoji: { fontSize: 16 },
  interestGridLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
  saveBtn: { borderRadius: 14, height: 52, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 20, marginBottom: 4 },
  saveBtnText: { fontSize: 16, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
});
