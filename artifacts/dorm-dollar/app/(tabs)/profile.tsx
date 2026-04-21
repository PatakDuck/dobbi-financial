import React, { useState, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform,
  Modal, TextInput, Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { DobbiCharacter } from "@/components/DobbiCharacter";
import colors from "@/constants/colors";

const LEVEL_XP: Record<number, number> = {
  1: 0, 2: 200, 3: 500, 4: 900, 5: 1400, 6: 2000, 7: 2700,
};
const LEVEL_PERKS: Record<number, string> = {
  2: "unlock deal alerts",
  3: "custom budget categories",
  4: "weekly money report",
  5: "exclusive sponsored deals",
  6: "Dobbi Pro badge 💎",
  7: "leaderboard access",
};

function xpFor(level: number) { return LEVEL_XP[level] ?? level * 300; }
function xpForNext(level: number) { return LEVEL_XP[level + 1] ?? (level + 1) * 300; }

const BADGES = [
  { id: "first-deal",   label: "First Deal",    emoji: "🎯",  desc: "claimed your first student deal",     unlocked: true  },
  { id: "budget-pro",   label: "Budget Pro",    emoji: "📊",  desc: "categorized a full week of spending", unlocked: true  },
  { id: "saver-streak", label: "Week Streak",   emoji: "🔥",  desc: "logged in 7 days straight",           unlocked: true  },
  { id: "deal-hunter",  label: "Deal Hunter",   emoji: "🏆",  desc: "claim 10 deals to unlock",            unlocked: false },
  { id: "penny",        label: "Penny Pincher", emoji: "💰",  desc: "save $100 in one month",              unlocked: false },
  { id: "level5",       label: "Level 5",       emoji: "⚡",  desc: "reach level 5",                      unlocked: false },
  { id: "scanner",      label: "Receipt Nerd",  emoji: "📸",  desc: "scan 5 receipts",                     unlocked: false },
  { id: "goalcrush",    label: "Goal Crusher",  emoji: "🎉",  desc: "complete 3 personal goals",           unlocked: false },
];

const RECENT_ACTIVITY = [
  { id: "a1", text: "Marked 'No Takeout Week' 5/7 days",  xp: 75, time: "2h ago",    icon: "check-circle" },
  { id: "a2", text: "Claimed Spotify student deal",       xp: 50, time: "Yesterday", icon: "tag"          },
  { id: "a3", text: "Logged 8 transactions this week",    xp: 40, time: "3 days ago", icon: "bar-chart-2" },
  { id: "a4", text: "Textbook Fund 62% funded",           xp: 0,  time: "4 days ago", icon: "trending-up" },
];

const AVATAR_OPTIONS = ["🎓", "🦊", "🐼", "🐸", "🦁", "🐯", "🐙", "🦄", "🐬", "🦋", "🌟", "🔥"];

const INTEREST_OPTIONS = [
  { id: "food",        label: "Food & Dining",   emoji: "🍕" },
  { id: "fitness",     label: "Fitness",         emoji: "💪" },
  { id: "gaming",      label: "Gaming",          emoji: "🎮" },
  { id: "fashion",     label: "Fashion",         emoji: "👗" },
  { id: "travel",      label: "Travel",          emoji: "✈️" },
  { id: "music",       label: "Music",           emoji: "🎵" },
  { id: "tech",        label: "Tech",            emoji: "💻" },
  { id: "wellness",    label: "Wellness",        emoji: "🧘" },
  { id: "coffee",      label: "Coffee",          emoji: "☕" },
  { id: "sports",      label: "Sports",          emoji: "⚽" },
  { id: "art",         label: "Art & Design",    emoji: "🎨" },
  { id: "education",   label: "Learning",        emoji: "📚" },
];

const CONNECTED_APPS = [
  { id: "strava",   name: "Strava",   icon: "activity",  color: "#FC4C02", connected: false, sub: "sync fitness challenges" },
  { id: "spotify",  name: "Spotify",  icon: "music",     color: "#1DB954", connected: true,  sub: "track subscription costs" },
  { id: "venmo",    name: "Venmo",    icon: "send",      color: "#008CFF", connected: false, sub: "import split payments" },
  { id: "apple",    name: "Apple Pay",icon: "smartphone",color: "#000000", connected: false, sub: "auto-import transactions" },
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout } = useAuth();
  const topPad = Platform.OS === "web" ? insets.top + 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? insets.bottom + 34 : insets.bottom;

  // Edit profile modal
  const [editModal, setEditModal] = useState(false);
  const [editName, setEditName] = useState(user?.name ?? "");
  const [editAvatar, setEditAvatar] = useState(user?.avatar ?? "🎓");
  const [editGoal, setEditGoal] = useState(String(user?.savingsGoal ?? ""));

  // Student ID state
  const [idModal, setIdModal] = useState(false);
  const [idSchool, setIdSchool] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [idSaved, setIdSaved] = useState(false);

  // Interests
  const [interests, setInterests] = useState<string[]>([]);
  const [interestModal, setInterestModal] = useState(false);

  // Connected apps
  const [connectedApps, setConnectedApps] = useState(
    CONNECTED_APPS.reduce<Record<string, boolean>>((acc, a) => { acc[a.id] = a.connected; return acc; }, {})
  );

  // Load persisted interests & ID on mount
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
    // In a real implementation this would call updateUser() on the context
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
    if (id === "strava" || id === "venmo" || id === "apple") {
      Alert.alert("Coming Soon", "This integration is almost ready! 🚀");
      return;
    }
    setConnectedApps((prev) => ({ ...prev, [id]: !prev[id] }));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 90 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header gradient ── */}
      <LinearGradient colors={["#2D1B69", "#3D2A8A"]} style={[styles.headerGrad, { paddingTop: topPad + 16 }]}>
        {/* Avatar + Dobbi */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={() => setEditModal(true)} activeOpacity={0.8}>
            <View style={styles.avatarRing}>
              <Text style={styles.avatarEmoji}>{editAvatar || user.avatar}</Text>
            </View>
            <View style={styles.editAvatarBadge}>
              <Feather name="edit-2" size={10} color="#fff" />
            </View>
          </TouchableOpacity>
          <View style={styles.dobbiSpeech}>
            <DobbiCharacter size="sm" mood="proud" />
            <View style={styles.speechBubble}>
              <Text style={styles.speechText}>
                {xpLeft} XP until Level {user.level + 1}!{"\n"}
                {LEVEL_PERKS[user.level + 1] ? `unlock: ${LEVEL_PERKS[user.level + 1]} 🔓` : "you're killing it 🔥"}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.nameRow}>
          <Text style={styles.userName}>{editName || user.name}</Text>
          <TouchableOpacity onPress={() => setEditModal(true)} style={styles.editNameBtn} activeOpacity={0.7}>
            <Feather name="edit-2" size={13} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>
        </View>
        <Text style={styles.userEmail}>{user.email}</Text>

        {/* Level + XP bar */}
        <View style={styles.levelWrap}>
          <View style={styles.levelRow}>
            <View style={styles.levelBadge}><Text style={styles.levelBadgeText}>LVL {user.level}</Text></View>
            <Text style={styles.xpFraction}>{user.xp - curXP} / {nextXP - curXP} XP</Text>
            <View style={styles.levelBadge}><Text style={styles.levelBadgeText}>LVL {user.level + 1}</Text></View>
          </View>
          <View style={styles.xpTrack}>
            <LinearGradient colors={["#00C896", "#6355E8"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={[styles.xpFill, { width: `${progress * 100}%` as any }]} />
          </View>
        </View>

        {/* Stats strip */}
        <View style={styles.statsStrip}>
          {[
            { icon: "zap",         val: `${user.xp}`,         lbl: "total XP" },
            { icon: "activity",    val: `${user.streak}d`,    lbl: "streak"   },
            { icon: "dollar-sign", val: `$${user.savedSoFar}`,lbl: "saved"    },
            { icon: "award",       val: `${unlockedCount}`,   lbl: "badges"   },
          ].map((s, i) => (
            <View key={i} style={styles.statItem}>
              <Feather name={s.icon as any} size={14} color="rgba(255,255,255,0.7)" />
              <Text style={styles.statVal}>{s.val}</Text>
              <Text style={styles.statLbl}>{s.lbl}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      {/* ── Leaderboard hint ── */}
      <View style={styles.leaderCard}>
        <Feather name="trending-up" size={16} color="#6355E8" />
        <Text style={styles.leaderText}>
          you're saving more than <Text style={styles.leaderHighlight}>67% of students</Text> your age 🔥
        </Text>
      </View>

      {/* ── Student ID card ── */}
      <View style={styles.section}>
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>student ID</Text>
          <TouchableOpacity onPress={() => setIdModal(true)} style={styles.editChip} activeOpacity={0.7}>
            <Feather name={idSaved ? "edit-2" : "plus"} size={12} color={colors.light.primary} />
            <Text style={styles.editChipText}>{idSaved ? "edit" : "add"}</Text>
          </TouchableOpacity>
        </View>
        {idSaved ? (
          <LinearGradient colors={["#2D1B69", "#4C3BCF"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.idCard}>
            <View style={styles.idCardTop}>
              <View style={styles.idSchoolBadge}>
                <Text style={styles.idSchoolText}>{idSchool}</Text>
              </View>
              <Text style={styles.idCardLabel}>Student Card</Text>
            </View>
            <View style={styles.idCardBottom}>
              <View style={styles.idAvatar}>
                <Text style={{ fontSize: 22 }}>{editAvatar || user.avatar}</Text>
              </View>
              <View>
                <Text style={styles.idName}>{editName || user.name}</Text>
                <Text style={styles.idNumber}>ID: {idNumber}</Text>
              </View>
              <View style={styles.idChip}>
                <View style={styles.idChipInner} />
              </View>
            </View>
          </LinearGradient>
        ) : (
          <TouchableOpacity style={styles.idEmptyCard} onPress={() => setIdModal(true)} activeOpacity={0.7}>
            <Feather name="credit-card" size={24} color={colors.light.mutedForeground} style={{ opacity: 0.5 }} />
            <Text style={styles.idEmptyText}>add your student ID card</Text>
            <Text style={styles.idEmptySub}>unlock student-only deals ✨</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Interests ── */}
      <View style={styles.section}>
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>your interests</Text>
          <TouchableOpacity onPress={() => setInterestModal(true)} style={styles.editChip} activeOpacity={0.7}>
            <Feather name="sliders" size={12} color={colors.light.primary} />
            <Text style={styles.editChipText}>edit</Text>
          </TouchableOpacity>
        </View>
        {interests.length > 0 ? (
          <View style={styles.interestPills}>
            {interests.map((id) => {
              const opt = INTEREST_OPTIONS.find((o) => o.id === id);
              if (!opt) return null;
              return (
                <View key={id} style={styles.interestPill}>
                  <Text style={styles.interestEmoji}>{opt.emoji}</Text>
                  <Text style={styles.interestLabel}>{opt.label}</Text>
                </View>
              );
            })}
            <TouchableOpacity style={styles.interestAddPill} onPress={() => setInterestModal(true)} activeOpacity={0.7}>
              <Feather name="plus" size={12} color={colors.light.primary} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.interestEmpty} onPress={() => setInterestModal(true)} activeOpacity={0.7}>
            <Text style={styles.interestEmptyText}>tap to pick your interests → personalized deals 🎯</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Savings goal ── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>savings goal</Text>
        <View style={styles.card}>
          <View style={styles.goalRow}>
            <View>
              <Text style={styles.goalName}>Textbook Fund 📚</Text>
              <Text style={styles.goalAmt}>
                <Text style={styles.goalAmtBig}>${user.savedSoFar}</Text>
                <Text style={styles.goalAmtOf}> of ${user.savingsGoal}</Text>
              </Text>
            </View>
            <View style={styles.goalPct}>
              <Text style={styles.goalPctText}>{savingsPct}%</Text>
            </View>
          </View>
          <View style={styles.goalTrack}>
            <LinearGradient colors={["#6355E8", "#00C896"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={[styles.goalFill, { width: `${savingsPct}%` as any }]} />
          </View>
          <Text style={styles.goalSub}>
            ${user.savingsGoal - user.savedSoFar} more to go — you got this fr 💜
          </Text>
        </View>
      </View>

      {/* ── Badges ── */}
      <View style={styles.section}>
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>achievements</Text>
          <Text style={styles.sectionSub}>{unlockedCount}/{BADGES.length} unlocked</Text>
        </View>
        <View style={styles.badgeGrid}>
          {BADGES.map((b) => (
            <TouchableOpacity
              key={b.id}
              style={[styles.badgeCard, !b.unlocked && styles.badgeLocked]}
              activeOpacity={0.75}
              onPress={() => Alert.alert(b.emoji + " " + b.label, b.desc)}
            >
              <Text style={[styles.badgeEmoji, !b.unlocked && { opacity: 0.35 }]}>{b.emoji}</Text>
              <Text style={[styles.badgeName, !b.unlocked && styles.badgeLockedText]}>{b.label}</Text>
              {!b.unlocked && <Feather name="lock" size={10} color={colors.light.mutedForeground} style={{ marginTop: 2 }} />}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── Connected apps ── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>connected apps</Text>
        <View style={styles.card}>
          {CONNECTED_APPS.map((app, i) => (
            <View key={app.id}>
              <View style={styles.appRow}>
                <View style={[styles.appIcon, { backgroundColor: app.color + "18" }]}>
                  <Feather name={app.icon as any} size={18} color={app.color} />
                </View>
                <View style={styles.appInfo}>
                  <Text style={styles.appName}>{app.name}</Text>
                  <Text style={styles.appSub}>{app.sub}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.appToggle, connectedApps[app.id] && styles.appToggleOn]}
                  onPress={() => handleToggleApp(app.id)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.appToggleText, connectedApps[app.id] && styles.appToggleTextOn]}>
                    {connectedApps[app.id] ? "connected" : "connect"}
                  </Text>
                </TouchableOpacity>
              </View>
              {i < CONNECTED_APPS.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>
      </View>

      {/* ── Recent activity ── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>recent activity</Text>
        <View style={styles.card}>
          {RECENT_ACTIVITY.map((a, i) => (
            <View key={a.id}>
              <View style={styles.actRow}>
                <View style={styles.actIcon}>
                  <Feather name={a.icon as any} size={15} color={colors.light.primary} />
                </View>
                <View style={styles.actInfo}>
                  <Text style={styles.actText}>{a.text}</Text>
                  <Text style={styles.actTime}>{a.time}</Text>
                </View>
                {a.xp > 0 && (
                  <View style={styles.actXP}>
                    <Text style={styles.actXPText}>+{a.xp} XP</Text>
                  </View>
                )}
              </View>
              {i < RECENT_ACTIVITY.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>
      </View>

      {/* ── Settings ── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>settings</Text>
        <View style={styles.card}>
          {[
            { icon: "bell",        label: "Notifications", sub: "daily check-ins on"    },
            { icon: "shield",      label: "Privacy",       sub: "your data stays yours" },
            { icon: "help-circle", label: "About Dobbi",   sub: "v2.0 · made with 💜"   },
          ].map((s, i, arr) => (
            <View key={s.label}>
              <TouchableOpacity style={styles.settingRow} activeOpacity={0.7}>
                <View style={styles.settingIcon}>
                  <Feather name={s.icon as any} size={16} color={colors.light.primary} />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>{s.label}</Text>
                  <Text style={styles.settingSub}>{s.sub}</Text>
                </View>
                <Feather name="chevron-right" size={16} color={colors.light.mutedForeground} />
              </TouchableOpacity>
              {i < arr.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>
      </View>

      {/* ── Sign out ── */}
      <TouchableOpacity style={styles.signoutBtn} onPress={logout} activeOpacity={0.8}>
        <Feather name="log-out" size={16} color={colors.light.coral} />
        <Text style={styles.signoutText}>sign out</Text>
      </TouchableOpacity>

      {/* ── Edit Profile Modal ── */}
      <Modal visible={editModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>edit profile</Text>
              <TouchableOpacity onPress={() => setEditModal(false)} style={styles.closeBtn}>
                <Feather name="x" size={20} color={colors.light.mutedForeground} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.fieldLabel}>choose your avatar</Text>
              <View style={styles.avatarGrid}>
                {AVATAR_OPTIONS.map((emoji) => (
                  <TouchableOpacity
                    key={emoji}
                    style={[styles.avatarOption, editAvatar === emoji && styles.avatarOptionSelected]}
                    onPress={() => setEditAvatar(emoji)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.avatarOptionEmoji}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>display name</Text>
              <TextInput
                style={styles.fieldInput}
                value={editName}
                onChangeText={setEditName}
                placeholder="Your name"
                placeholderTextColor={colors.light.mutedForeground}
              />

              <Text style={styles.fieldLabel}>savings goal ($)</Text>
              <TextInput
                style={styles.fieldInput}
                value={editGoal}
                onChangeText={setEditGoal}
                placeholder="e.g. 500"
                placeholderTextColor={colors.light.mutedForeground}
                keyboardType="numeric"
              />

              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile} activeOpacity={0.85}>
                <LinearGradient colors={["#6355E8", "#8B5CF6"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.saveBtnGrad}>
                  <Text style={styles.saveBtnText}>Save Changes</Text>
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Student ID Modal ── */}
      <Modal visible={idModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>student ID</Text>
              <TouchableOpacity onPress={() => setIdModal(false)} style={styles.closeBtn}>
                <Feather name="x" size={20} color={colors.light.mutedForeground} />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>university / college</Text>
            <TextInput
              style={styles.fieldInput}
              value={idSchool}
              onChangeText={setIdSchool}
              placeholder="e.g. University of Michigan"
              placeholderTextColor={colors.light.mutedForeground}
            />

            <Text style={styles.fieldLabel}>student ID number</Text>
            <TextInput
              style={styles.fieldInput}
              value={idNumber}
              onChangeText={setIdNumber}
              placeholder="e.g. U12345678"
              placeholderTextColor={colors.light.mutedForeground}
              autoCapitalize="characters"
            />

            <View style={styles.idNote}>
              <Feather name="lock" size={13} color={colors.light.mutedForeground} />
              <Text style={styles.idNoteText}>stored only on your device — never shared</Text>
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveID} activeOpacity={0.85}>
              <LinearGradient colors={["#6355E8", "#8B5CF6"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.saveBtnGrad}>
                <Text style={styles.saveBtnText}>Save ID</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Interests Modal ── */}
      <Modal visible={interestModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { maxHeight: "80%" }]}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>your interests</Text>
                <Text style={styles.modalSub}>used to personalize your deals 🎯</Text>
              </View>
              <TouchableOpacity onPress={() => setInterestModal(false)} style={styles.closeBtn}>
                <Feather name="x" size={20} color={colors.light.mutedForeground} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.interestGrid}>
                {INTEREST_OPTIONS.map((opt) => {
                  const selected = interests.includes(opt.id);
                  return (
                    <TouchableOpacity
                      key={opt.id}
                      style={[styles.interestGridItem, selected && styles.interestGridItemOn]}
                      onPress={() => toggleInterest(opt.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.interestGridEmoji}>{opt.emoji}</Text>
                      <Text style={[styles.interestGridLabel, selected && styles.interestGridLabelOn]}>{opt.label}</Text>
                      {selected && <Feather name="check" size={11} color={colors.light.primary} />}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity style={[styles.saveBtn, { marginTop: 8 }]} onPress={handleSaveInterests} activeOpacity={0.85}>
                <LinearGradient colors={["#6355E8", "#8B5CF6"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.saveBtnGrad}>
                  <Text style={styles.saveBtnText}>Save Interests ({interests.length})</Text>
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.light.background },
  content: { gap: 0 },
  headerGrad: { paddingHorizontal: 20, paddingBottom: 24 },
  avatarSection: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 12 },
  avatarRing: {
    width: 66, height: 66, borderRadius: 33,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center", alignItems: "center",
    borderWidth: 3, borderColor: "rgba(255,255,255,0.3)",
  },
  avatarEmoji: { fontSize: 30 },
  editAvatarBadge: {
    position: "absolute", bottom: 0, right: 0,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: "#6355E8", justifyContent: "center", alignItems: "center",
    borderWidth: 2, borderColor: "#2D1B69",
  },
  dobbiSpeech: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  speechBubble: {
    flex: 1, backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 14,
    padding: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.18)",
  },
  speechText: { fontSize: 12, color: "rgba(255,255,255,0.9)", fontFamily: "Inter_400Regular", lineHeight: 17 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  userName: { fontSize: 22, fontWeight: "800", color: "#fff", fontFamily: "Inter_700Bold" },
  editNameBtn: { padding: 4 },
  userEmail: { fontSize: 13, color: "rgba(255,255,255,0.55)", fontFamily: "Inter_400Regular", marginBottom: 16 },
  levelWrap: { gap: 8, marginBottom: 16 },
  levelRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  levelBadge: { backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4 },
  levelBadgeText: { fontSize: 11, fontWeight: "800", color: "#fff", fontFamily: "Inter_700Bold" },
  xpFraction: { fontSize: 12, color: "rgba(255,255,255,0.65)", fontFamily: "Inter_500Medium" },
  xpTrack: { height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.15)", overflow: "hidden" },
  xpFill: { height: "100%", borderRadius: 4 },
  statsStrip: { flexDirection: "row" },
  statItem: { flex: 1, alignItems: "center", gap: 3 },
  statVal: { fontSize: 16, fontWeight: "800", color: "#fff", fontFamily: "Inter_700Bold" },
  statLbl: { fontSize: 10, color: "rgba(255,255,255,0.55)", fontFamily: "Inter_400Regular" },
  leaderCard: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: colors.light.secondary, marginHorizontal: 16, marginTop: 14,
    borderRadius: 14, padding: 14, borderWidth: 1.5, borderColor: "#D8D3FA",
  },
  leaderText: { flex: 1, fontSize: 13, color: colors.light.foreground, fontFamily: "Inter_400Regular", lineHeight: 18 },
  leaderHighlight: { color: colors.light.primary, fontFamily: "Inter_700Bold" },
  section: { paddingHorizontal: 16, marginTop: 20 },
  sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: colors.light.foreground, fontFamily: "Inter_700Bold", marginBottom: 10 },
  sectionSub: { fontSize: 12, color: colors.light.mutedForeground, fontFamily: "Inter_400Regular" },
  editChip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: colors.light.secondary, borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1.5, borderColor: "#D8D3FA",
  },
  editChipText: { fontSize: 12, color: colors.light.primary, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  card: {
    backgroundColor: colors.light.card, borderRadius: 18, padding: 16,
    borderWidth: 1.5, borderColor: colors.light.border,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  idCard: { borderRadius: 20, padding: 20, shadowColor: "#2D1B69", shadowOpacity: 0.4, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
  idCardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  idSchoolBadge: { backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  idSchoolText: { fontSize: 11, color: "#fff", fontFamily: "Inter_600SemiBold" },
  idCardLabel: { fontSize: 11, color: "rgba(255,255,255,0.6)", fontFamily: "Inter_400Regular" },
  idCardBottom: { flexDirection: "row", alignItems: "center", gap: 14 },
  idAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: "rgba(255,255,255,0.15)", justifyContent: "center", alignItems: "center" },
  idName: { fontSize: 16, fontWeight: "800", color: "#fff", fontFamily: "Inter_700Bold" },
  idNumber: { fontSize: 12, color: "rgba(255,255,255,0.65)", fontFamily: "Inter_400Regular", marginTop: 2 },
  idChip: { marginLeft: "auto", width: 36, height: 28, borderRadius: 6, backgroundColor: "rgba(255,215,0,0.6)", justifyContent: "center", alignItems: "center" },
  idChipInner: { width: 24, height: 18, borderRadius: 4, backgroundColor: "rgba(255,215,0,0.8)", borderWidth: 1, borderColor: "rgba(255,200,0,0.9)" },
  idEmptyCard: {
    borderRadius: 20, borderWidth: 2, borderColor: colors.light.border, borderStyle: "dashed",
    padding: 28, alignItems: "center", gap: 8, backgroundColor: colors.light.muted,
  },
  idEmptyText: { fontSize: 14, fontWeight: "600", color: colors.light.foreground, fontFamily: "Inter_600SemiBold" },
  idEmptySub: { fontSize: 12, color: colors.light.mutedForeground, fontFamily: "Inter_400Regular" },
  interestPills: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  interestPill: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: colors.light.secondary, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 7,
    borderWidth: 1.5, borderColor: "#D8D3FA",
  },
  interestEmoji: { fontSize: 14 },
  interestLabel: { fontSize: 12, color: colors.light.primary, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  interestAddPill: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: colors.light.secondary, justifyContent: "center", alignItems: "center",
    borderWidth: 1.5, borderColor: "#D8D3FA",
  },
  interestEmpty: {
    backgroundColor: colors.light.secondary, borderRadius: 14,
    padding: 14, borderWidth: 1.5, borderColor: "#D8D3FA",
    borderStyle: "dashed",
  },
  interestEmptyText: { fontSize: 13, color: colors.light.primary, fontFamily: "Inter_500Medium" },
  goalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  goalName: { fontSize: 15, fontWeight: "700", color: colors.light.foreground, fontFamily: "Inter_700Bold" },
  goalAmt: { marginTop: 3 },
  goalAmtBig: { fontSize: 20, fontWeight: "800", color: colors.light.foreground, fontFamily: "Inter_700Bold" },
  goalAmtOf: { fontSize: 13, color: colors.light.mutedForeground, fontFamily: "Inter_400Regular" },
  goalPct: { backgroundColor: colors.light.secondary, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  goalPctText: { fontSize: 16, fontWeight: "800", color: colors.light.primary, fontFamily: "Inter_700Bold" },
  goalTrack: { height: 8, borderRadius: 4, backgroundColor: colors.light.muted, overflow: "hidden", marginBottom: 8 },
  goalFill: { height: "100%", borderRadius: 4 },
  goalSub: { fontSize: 12, color: colors.light.mutedForeground, fontFamily: "Inter_400Regular" },
  badgeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  badgeCard: {
    width: "22%", aspectRatio: 0.85,
    backgroundColor: colors.light.card, borderRadius: 14,
    alignItems: "center", justifyContent: "center", gap: 4,
    borderWidth: 1.5, borderColor: colors.light.border, paddingVertical: 10,
  },
  badgeLocked: { backgroundColor: colors.light.muted },
  badgeEmoji: { fontSize: 24 },
  badgeName: { fontSize: 10, fontWeight: "600", color: colors.light.foreground, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  badgeLockedText: { color: colors.light.mutedForeground },
  appRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8 },
  appIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  appInfo: { flex: 1 },
  appName: { fontSize: 14, fontWeight: "600", color: colors.light.foreground, fontFamily: "Inter_600SemiBold" },
  appSub: { fontSize: 12, color: colors.light.mutedForeground, fontFamily: "Inter_400Regular", marginTop: 1 },
  appToggle: {
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1.5, borderColor: colors.light.border,
  },
  appToggleOn: { backgroundColor: colors.light.secondary, borderColor: "#D8D3FA" },
  appToggleText: { fontSize: 12, fontWeight: "600", color: colors.light.mutedForeground, fontFamily: "Inter_600SemiBold" },
  appToggleTextOn: { color: colors.light.primary },
  actRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 6 },
  actIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: colors.light.secondary, justifyContent: "center", alignItems: "center" },
  actInfo: { flex: 1 },
  actText: { fontSize: 13, fontFamily: "Inter_500Medium", color: colors.light.foreground, lineHeight: 18 },
  actTime: { fontSize: 11, color: colors.light.mutedForeground, fontFamily: "Inter_400Regular", marginTop: 2 },
  actXP: { backgroundColor: "#FEF3C7", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  actXPText: { fontSize: 11, fontWeight: "700", color: "#92400E", fontFamily: "Inter_700Bold" },
  divider: { height: 1, backgroundColor: colors.light.border, marginVertical: 4 },
  settingRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8 },
  settingIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: colors.light.secondary, justifyContent: "center", alignItems: "center" },
  settingInfo: { flex: 1 },
  settingLabel: { fontSize: 14, fontWeight: "600", color: colors.light.foreground, fontFamily: "Inter_600SemiBold" },
  settingSub: { fontSize: 12, color: colors.light.mutedForeground, fontFamily: "Inter_400Regular" },
  signoutBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, marginHorizontal: 16, marginTop: 20,
    paddingVertical: 14, borderRadius: 14,
    backgroundColor: "#FEF2F2", borderWidth: 1.5, borderColor: "#FECACA",
  },
  signoutText: { fontSize: 14, fontWeight: "700", color: colors.light.coral, fontFamily: "Inter_700Bold" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalSheet: { backgroundColor: "#fff", borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingBottom: 36, maxHeight: "75%" },
  modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.light.border, alignSelf: "center", marginTop: 12, marginBottom: 16 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: "800", color: colors.light.foreground, fontFamily: "Inter_700Bold" },
  modalSub: { fontSize: 13, color: colors.light.mutedForeground, fontFamily: "Inter_400Regular", marginTop: 2 },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.light.muted, justifyContent: "center", alignItems: "center" },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: colors.light.mutedForeground, fontFamily: "Inter_600SemiBold", marginBottom: 8, marginTop: 14 },
  fieldInput: {
    backgroundColor: colors.light.muted, borderRadius: 12, paddingHorizontal: 14, height: 48,
    fontSize: 15, color: colors.light.foreground, fontFamily: "Inter_400Regular",
    borderWidth: 1.5, borderColor: colors.light.border,
  },
  avatarGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 4 },
  avatarOption: {
    width: 48, height: 48, borderRadius: 24,
    borderWidth: 2, borderColor: colors.light.border,
    justifyContent: "center", alignItems: "center",
    backgroundColor: colors.light.muted,
  },
  avatarOptionSelected: { borderColor: colors.light.primary, backgroundColor: colors.light.secondary },
  avatarOptionEmoji: { fontSize: 24 },
  idNote: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12 },
  idNoteText: { fontSize: 12, color: colors.light.mutedForeground, fontFamily: "Inter_400Regular" },
  interestGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, paddingBottom: 8 },
  interestGridItem: {
    flexDirection: "row", alignItems: "center", gap: 7,
    backgroundColor: colors.light.muted, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 9,
    borderWidth: 1.5, borderColor: colors.light.border,
  },
  interestGridItemOn: { backgroundColor: colors.light.secondary, borderColor: "#D8D3FA" },
  interestGridEmoji: { fontSize: 16 },
  interestGridLabel: { fontSize: 13, color: colors.light.mutedForeground, fontFamily: "Inter_500Medium" },
  interestGridLabelOn: { color: colors.light.primary, fontFamily: "Inter_600SemiBold" },
  saveBtn: { borderRadius: 16, overflow: "hidden", marginTop: 20, marginBottom: 4 },
  saveBtnGrad: { height: 52, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8 },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold" },
});
