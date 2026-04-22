import React, { useState, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Platform, TextInput,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

interface Deal {
  id: string;
  brand: string;
  category: string;
  tag: string;
  tagType: "free" | "discount" | "cash" | "trial";
  description: string;
  originalPrice: string;
  studentPrice: string;
  emoji: string;
  accentColor: string;
  xpReward: number;
  hot: boolean;
  interests: string[];
}

const DEALS: Deal[] = [
  {
    id: "1", brand: "Microsoft 365", category: "Tech",
    tag: "FREE", tagType: "free",
    description: "Full Office suite — Word, Excel, PowerPoint, Teams — on us. Just use your .edu email.",
    originalPrice: "$9.99/mo", studentPrice: "$0.00",
    emoji: "💻", accentColor: "#0078D4", xpReward: 100, hot: true,
    interests: ["Tech"],
  },
  {
    id: "2", brand: "Spotify", category: "Music",
    tag: "50% OFF", tagType: "discount",
    description: "Premium music, no ads, offline downloads. Half price because you're in school.",
    originalPrice: "$11.99/mo", studentPrice: "$5.99/mo",
    emoji: "🎵", accentColor: "#1DB954", xpReward: 50, hot: true,
    interests: ["Music"],
  },
  {
    id: "3", brand: "Amazon Prime", category: "Shopping",
    tag: "6 MO FREE", tagType: "trial",
    description: "Free same-day delivery + Prime Video. Six months free with .edu, then just $7.49/mo.",
    originalPrice: "$14.99/mo", studentPrice: "6mo free",
    emoji: "📦", accentColor: "#FF9900", xpReward: 75, hot: false,
    interests: ["Shopping", "Food"],
  },
  {
    id: "4", brand: "Adobe Creative Cloud", category: "Design",
    tag: "65% OFF", tagType: "discount",
    description: "Photoshop, Premiere, Illustrator, 20+ apps. The whole suite, not a watered-down version.",
    originalPrice: "$59.99/mo", studentPrice: "$19.99/mo",
    emoji: "🎨", accentColor: "#FF0000", xpReward: 80, hot: false,
    interests: ["Tech", "Design"],
  },
  {
    id: "5", brand: "Apple Music", category: "Music",
    tag: "50% OFF", tagType: "discount",
    description: "100M songs, spatial audio, no ads. Half price for students — same as Spotify.",
    originalPrice: "$10.99/mo", studentPrice: "$5.99/mo",
    emoji: "🍎", accentColor: "#FA243C", xpReward: 50, hot: false,
    interests: ["Music"],
  },
  {
    id: "6", brand: "Chipotle", category: "Food",
    tag: "$2 OFF", tagType: "cash",
    description: "Any bowl or burrito. Show your student ID. Stack with their rewards app for extra points.",
    originalPrice: "$10.75", studentPrice: "$8.75",
    emoji: "🌯", accentColor: "#A51C1B", xpReward: 30, hot: true,
    interests: ["Food"],
  },
  {
    id: "7", brand: "Notion", category: "Productivity",
    tag: "FREE", tagType: "free",
    description: "The personal plan is free forever with an .edu email. Notes, databases, AI assistant included.",
    originalPrice: "$16/mo", studentPrice: "$0.00",
    emoji: "📓", accentColor: "#191919", xpReward: 60, hot: false,
    interests: ["Tech", "Productivity"],
  },
  {
    id: "8", brand: "GitHub Copilot", category: "Tech",
    tag: "FREE", tagType: "free",
    description: "AI coding assistant + GitHub Pro. Free for students via GitHub Education Pack.",
    originalPrice: "$19/mo", studentPrice: "$0.00",
    emoji: "⚡", accentColor: "#6e40c9", xpReward: 90, hot: true,
    interests: ["Tech"],
  },
  {
    id: "9", brand: "Headspace", category: "Wellness",
    tag: "85% OFF", tagType: "discount",
    description: "Meditation and sleep tools. Stress is free, Headspace shouldn't be.",
    originalPrice: "$12.99/mo", studentPrice: "$1.99/mo",
    emoji: "🧘", accentColor: "#F47D31", xpReward: 40, hot: false,
    interests: ["Wellness", "Fitness"],
  },
  {
    id: "10", brand: "New York Times", category: "News",
    tag: "$1 FOR 6 MO", tagType: "trial",
    description: "Full digital access. Great for assignments, research, staying informed. $1 intro, then $4/mo.",
    originalPrice: "$17/mo", studentPrice: "$1 intro",
    emoji: "📰", accentColor: "#222222", xpReward: 40, hot: false,
    interests: ["Productivity"],
  },
  {
    id: "11", brand: "Nike", category: "Sports",
    tag: "10% OFF", tagType: "discount",
    description: "Student discount on shoes, apparel, and gear. Verify via UNiDAYS and save on every order.",
    originalPrice: "Full price", studentPrice: "10% off",
    emoji: "👟", accentColor: "#111111", xpReward: 60, hot: true,
    interests: ["Fitness", "Sports", "Fashion"],
  },
  {
    id: "12", brand: "Adidas", category: "Sports",
    tag: "15% OFF", tagType: "discount",
    description: "15% off sitewide for students. From running shoes to hoodies — use your .edu to verify.",
    originalPrice: "Full price", studentPrice: "15% off",
    emoji: "🏃", accentColor: "#000000", xpReward: 55, hot: false,
    interests: ["Fitness", "Sports", "Fashion"],
  },
  {
    id: "13", brand: "Planet Fitness", category: "Fitness",
    tag: "$10/MO", tagType: "discount",
    description: "Classic membership — cardio, weights, free fitness training. No contract required.",
    originalPrice: "$24.99/mo", studentPrice: "$10/mo",
    emoji: "💪", accentColor: "#7B2D8B", xpReward: 70, hot: true,
    interests: ["Fitness", "Sports"],
  },
  {
    id: "14", brand: "Peloton", category: "Fitness",
    tag: "3 MO FREE", tagType: "trial",
    description: "App-only plan: 1000+ classes — cycling, running, strength, yoga. Free for 3 months.",
    originalPrice: "$12.99/mo", studentPrice: "3mo free",
    emoji: "🚴", accentColor: "#D43F3A", xpReward: 80, hot: false,
    interests: ["Fitness"],
  },
  {
    id: "15", brand: "YouTube Premium", category: "Entertainment",
    tag: "50% OFF", tagType: "discount",
    description: "No ads, background play, YouTube Music included. Half price with student verification.",
    originalPrice: "$13.99/mo", studentPrice: "$7.99/mo",
    emoji: "▶️", accentColor: "#FF0000", xpReward: 45, hot: false,
    interests: ["Music", "Gaming", "Fitness"],
  },
  {
    id: "16", brand: "DoorDash", category: "Food",
    tag: "1 MO FREE", tagType: "trial",
    description: "DashPass free for 1 month — free delivery on every order over $12. Cancel anytime.",
    originalPrice: "$9.99/mo", studentPrice: "1mo free",
    emoji: "🛵", accentColor: "#FF3008", xpReward: 35, hot: true,
    interests: ["Food"],
  },
  {
    id: "17", brand: "Discord Nitro", category: "Gaming",
    tag: "3 MO FREE", tagType: "trial",
    description: "Custom emojis, HD streaming, server boosts, bigger uploads. Free via GitHub Student Pack.",
    originalPrice: "$9.99/mo", studentPrice: "3mo free",
    emoji: "🎮", accentColor: "#5865F2", xpReward: 65, hot: false,
    interests: ["Gaming"],
  },
  {
    id: "18", brand: "Xbox Game Pass", category: "Gaming",
    tag: "$1 FIRST MO", tagType: "trial",
    description: "100+ games day one, EA Play included, cloud gaming. $1 intro for your first month.",
    originalPrice: "$14.99/mo", studentPrice: "$1 intro",
    emoji: "🕹️", accentColor: "#107C10", xpReward: 55, hot: false,
    interests: ["Gaming"],
  },
  {
    id: "19", brand: "Calm", category: "Wellness",
    tag: "40% OFF", tagType: "discount",
    description: "Sleep stories, meditation, breathwork. Finals week survival kit fr.",
    originalPrice: "$69.99/yr", studentPrice: "$41.99/yr",
    emoji: "🌙", accentColor: "#4A6FA5", xpReward: 40, hot: false,
    interests: ["Wellness"],
  },
  {
    id: "20", brand: "ASOS", category: "Fashion",
    tag: "10% OFF", tagType: "discount",
    description: "Student discount on thousands of brands. Verify through Student Beans — stays active all year.",
    originalPrice: "Full price", studentPrice: "10% off",
    emoji: "👗", accentColor: "#333333", xpReward: 45, hot: false,
    interests: ["Fashion", "Shopping"],
  },
  {
    id: "21", brand: "StudentUniverse", category: "Travel",
    tag: "UP TO 35% OFF", tagType: "discount",
    description: "Flights, hotels, tours — student-exclusive prices. Cheaper than Google Flights, no cap.",
    originalPrice: "Full fare", studentPrice: "Up to 35% off",
    emoji: "✈️", accentColor: "#0066CC", xpReward: 85, hot: true,
    interests: ["Travel"],
  },
  {
    id: "22", brand: "Audible", category: "Education",
    tag: "30% OFF", tagType: "discount",
    description: "Audiobooks, podcasts, originals. Great for commutes, studying, or just vibing.",
    originalPrice: "$14.95/mo", studentPrice: "$9.95/mo",
    emoji: "🎧", accentColor: "#F8991D", xpReward: 45, hot: false,
    interests: ["Music", "Productivity"],
  },
  {
    id: "23", brand: "Coursera Plus", category: "Education",
    tag: "7 DAYS FREE", tagType: "trial",
    description: "7,000+ courses from Google, IBM, Yale. Certificates that actually land jobs.",
    originalPrice: "$59/mo", studentPrice: "7 days free",
    emoji: "🎓", accentColor: "#0056D2", xpReward: 70, hot: false,
    interests: ["Tech", "Productivity"],
  },
  {
    id: "24", brand: "Duolingo Super", category: "Education",
    tag: "20% OFF", tagType: "discount",
    description: "No ads, unlimited hearts, streak repair. Learning a language? Don't let ads kill your flow.",
    originalPrice: "$6.99/mo", studentPrice: "$5.59/mo",
    emoji: "🦉", accentColor: "#58CC02", xpReward: 35, hot: false,
    interests: ["Productivity"],
  },
  {
    id: "25", brand: "Hostelworld", category: "Travel",
    tag: "10% OFF", tagType: "discount",
    description: "Book hostels, budget hotels, guesthouses worldwide. Student discount auto-applied.",
    originalPrice: "Full price", studentPrice: "10% off",
    emoji: "🌍", accentColor: "#FF6600", xpReward: 50, hot: false,
    interests: ["Travel"],
  },
];

const CATEGORIES = ["All", "Tech", "Music", "Food", "Sports", "Fitness", "Fashion", "Gaming", "Wellness", "Travel", "Design", "Productivity", "Entertainment", "Education", "News", "Shopping"];

const TAG_STYLES: Record<string, { bg: string; text: string }> = {
  free:     { bg: "#D1FAE5", text: "#065F46" },
  discount: { bg: "#DBEAFE", text: "#1E40AF" },
  cash:     { bg: "#FEF3C7", text: "#92400E" },
  trial:    { bg: "#F3E8FF", text: "#6B21A8" },
};

const INTEREST_ICONS: Record<string, string> = {
  Tech: "cpu", Music: "music", Food: "coffee", Fitness: "activity",
  Sports: "zap", Fashion: "shopping-bag", Gaming: "monitor",
  Wellness: "heart", Travel: "map", Design: "pen-tool",
  Productivity: "briefcase",
};

const SAVING_QUIPS = [
  "no cap, this one actually slaps 💜",
  "lowkey this saves you more than you think",
  "bestie this is FREE. free. as in $0.",
  "fr this is worth the 30 seconds to sign up",
  "your wallet said thank you 💸",
];

function getPersonalizedDeals(deals: Deal[], topSpend: string, interests: string[]): Deal[] {
  const spendToInterest: Record<string, string> = {
    food: "Food", clothes: "Fashion", entertainment: "Gaming",
    tech: "Tech", travel: "Travel", fitness: "Fitness",
  };
  const all = [spendToInterest[topSpend], ...interests].filter(Boolean);
  if (all.length === 0) return [];
  return deals.filter((d) => d.interests.some((i) => all.includes(i)));
}

export default function DiscountsScreen() {
  const insets = useSafeAreaInsets();
  const { user, updateXP } = useAuth();
  const tc = useColors();
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [claimed, setClaimed] = useState<Record<string, boolean>>({});
  const [forYouDeals, setForYouDeals] = useState<Deal[]>([]);
  const [userInterests, setUserInterests] = useState<string[]>([]);
  const [showBanner, setShowBanner] = useState(false);
  const topPad = Platform.OS === "web" ? insets.top + 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? insets.bottom + 34 : insets.bottom;

  useEffect(() => {
    const loadPersonalization = async () => {
      try {
        const [answersRaw, interestsRaw, bannerDismissed] = await Promise.all([
          AsyncStorage.getItem("dobbi_onboarding_answers"),
          AsyncStorage.getItem("dobbi_user_interests"),
          AsyncStorage.getItem("dobbi_quickstart_dismissed"),
        ]);
        const answers = answersRaw ? JSON.parse(answersRaw) : {};
        const interests: string[] = interestsRaw ? JSON.parse(interestsRaw) : [];
        setUserInterests(interests);
        const personalized = getPersonalizedDeals(DEALS, answers.top_spend ?? "", interests);
        setForYouDeals(personalized.slice(0, 4));
        if (!bannerDismissed) setShowBanner(true);
      } catch { /* ignore */ }
    };
    loadPersonalization();
  }, []);

  const dismissBanner = async () => {
    await AsyncStorage.setItem("dobbi_quickstart_dismissed", "true");
    setShowBanner(false);
  };

  const totalSaved = Object.keys(claimed).length * 8.5;
  const quip = SAVING_QUIPS[Math.floor(totalSaved / 10) % SAVING_QUIPS.length];

  const filtered = DEALS.filter((d) => {
    const matchCat = category === "All" || d.category === category || d.interests.includes(category);
    const matchSearch =
      !search ||
      d.brand.toLowerCase().includes(search.toLowerCase()) ||
      d.category.toLowerCase().includes(search.toLowerCase()) ||
      d.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const hotDeals = filtered.filter((d) => d.hot);
  const otherDeals = filtered.filter((d) => !d.hot);

  const handleClaim = (deal: Deal) => {
    if (claimed[deal.id]) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setClaimed((prev) => ({ ...prev, [deal.id]: true }));
    updateXP(deal.xpReward);
  };

  return (
    <LinearGradient colors={tc.backgroundGradient as [string, string, ...string[]]} style={styles.root}>
      <LinearGradient
        colors={["#2D1B69", "#3D2A8A"]}
        style={[styles.header, { paddingTop: topPad + 16 }]}
      >
        <Text style={styles.headerTitle}>Deals</Text>
        <Text style={styles.headerSub}>deals that actually slap 💸</Text>

        {Object.keys(claimed).length > 0 && (
          <View style={styles.savingsBanner}>
            <Feather name="trending-up" size={13} color="#10B981" />
            <Text style={styles.savingsBannerText}>
              {Object.keys(claimed).length} deals claimed · {quip}
            </Text>
          </View>
        )}

        <View style={styles.searchRow}>
          <Feather name="search" size={16} color="rgba(255,255,255,0.5)" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="search brands or categories..."
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Feather name="x" size={16} color="rgba(255,255,255,0.5)" />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      <View style={[styles.catWrap, { backgroundColor: tc.card, borderBottomColor: tc.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catScroll}>
          {CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c}
              style={[
                styles.catPill,
                { backgroundColor: tc.muted, borderColor: tc.border },
                c === category && { backgroundColor: tc.secondary, borderColor: tc.primary },
              ]}
              onPress={() => setCategory(c)}
              activeOpacity={0.75}
            >
              <Text style={[
                styles.catText,
                { color: tc.mutedForeground },
                c === category && { color: tc.primary },
              ]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={[styles.list, { paddingBottom: bottomPad + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick start banner */}
        {showBanner && (
          <View style={[styles.quickStartCard, { backgroundColor: tc.card, borderColor: tc.border }]}>
            <TouchableOpacity style={styles.quickStartDismiss} onPress={dismissBanner} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Feather name="x" size={15} color={tc.mutedForeground} />
            </TouchableOpacity>
            <Text style={[styles.quickStartTitle, { color: tc.foreground }]}>👋 here's how dobbi works</Text>
            <View style={styles.quickStartSteps}>
              {[
                { num: "1", icon: "camera",       text: "Scan a receipt to log spending" },
                { num: "2", icon: "bar-chart-2",  text: "See exactly where your money goes" },
                { num: "3", icon: "tag",           text: "Claim student deals and save" },
              ].map((s) => (
                <View key={s.num} style={styles.quickStartStep}>
                  <View style={[styles.quickStartNum, { backgroundColor: tc.secondary }]}>
                    <Text style={[styles.quickStartNumText, { color: tc.primary }]}>{s.num}</Text>
                  </View>
                  <Feather name={s.icon as any} size={15} color={tc.primary} />
                  <Text style={[styles.quickStartStepText, { color: tc.foreground }]}>{s.text}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity style={[styles.quickStartBtn, { backgroundColor: tc.secondary, borderColor: tc.border }]} onPress={dismissBanner} activeOpacity={0.8}>
              <Text style={[styles.quickStartBtnText, { color: tc.primary }]}>got it, let's go →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* For You section */}
        {forYouDeals.length > 0 && category === "All" && !search && (
          <>
            <View style={[styles.forYouHeader, { backgroundColor: tc.muted, borderColor: tc.border }]}>
              <View style={styles.forYouTitleRow}>
                <Text style={styles.forYouEmoji}>✨</Text>
                <View>
                  <Text style={[styles.forYouTitle, { color: tc.foreground }]}>picked for you</Text>
                  <Text style={[styles.forYouSub, { color: tc.mutedForeground }]}>based on your interests</Text>
                </View>
              </View>
              {userInterests.length > 0 && (
                <View style={styles.interestPills}>
                  {userInterests.slice(0, 3).map((interest) => (
                    <View key={interest} style={[styles.interestPill, { backgroundColor: tc.secondary }]}>
                      <Feather name={(INTEREST_ICONS[interest] ?? "tag") as any} size={10} color={tc.primary} />
                      <Text style={[styles.interestPillText, { color: tc.primary }]}>{interest}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
            {forYouDeals.map((d) => (
              <DealCard key={`fy-${d.id}`} deal={d} isClaimed={!!claimed[d.id]} onClaim={handleClaim} highlighted tc={tc} />
            ))}
            <View style={[styles.divider, { backgroundColor: tc.border }]} />
          </>
        )}

        {hotDeals.length > 0 && (
          <>
            <View style={styles.sectionRow}>
              <Text style={[styles.sectionTitle, { color: tc.foreground }]}>🔥 hot right now</Text>
              <Text style={[styles.sectionCount, { color: tc.mutedForeground }]}>{hotDeals.length} deals</Text>
            </View>
            {hotDeals.map((d) => (
              <DealCard key={d.id} deal={d} isClaimed={!!claimed[d.id]} onClaim={handleClaim} tc={tc} />
            ))}
            {otherDeals.length > 0 && (
              <View style={styles.sectionRow}>
                <Text style={[styles.sectionTitle, { color: tc.foreground }]}>✦ all deals</Text>
                <Text style={[styles.sectionCount, { color: tc.mutedForeground }]}>{otherDeals.length} more</Text>
              </View>
            )}
          </>
        )}

        {otherDeals.map((d) => (
          <DealCard key={d.id} deal={d} isClaimed={!!claimed[d.id]} onClaim={handleClaim} tc={tc} />
        ))}

        {filtered.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🔍</Text>
            <Text style={[styles.emptyTitle, { color: tc.foreground }]}>no deals found</Text>
            <Text style={[styles.emptySub, { color: tc.mutedForeground }]}>try a different search or category bestie</Text>
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

function DealCard({
  deal, isClaimed, onClaim, highlighted, tc,
}: {
  deal: Deal;
  isClaimed: boolean;
  onClaim: (d: Deal) => void;
  highlighted?: boolean;
  tc: ReturnType<typeof useColors>;
}) {
  const tagStyle = TAG_STYLES[deal.tagType];

  return (
    <View style={[
      styles.card,
      { backgroundColor: tc.card, borderColor: tc.border },
      isClaimed && styles.cardClaimed,
      highlighted && styles.cardHighlighted,
    ]}>
      <View style={[styles.cardAccent, { backgroundColor: deal.accentColor }]} />
      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <View style={[styles.brandIcon, { backgroundColor: deal.accentColor + "18" }]}>
            <Text style={styles.brandEmoji}>{deal.emoji}</Text>
          </View>
          <View style={styles.brandInfo}>
            <Text style={[styles.brandName, { color: tc.foreground }]}>{deal.brand}</Text>
            <Text style={[styles.brandCat, { color: tc.mutedForeground }]}>{deal.category}</Text>
          </View>
          <View style={[styles.tagBadge, { backgroundColor: tagStyle.bg }]}>
            <Text style={[styles.tagText, { color: tagStyle.text }]}>{deal.tag}</Text>
          </View>
        </View>

        <Text style={[styles.dealDesc, { color: tc.mutedForeground }]}>{deal.description}</Text>

        <View style={styles.priceRow}>
          <View style={styles.priceBlock}>
            <Text style={[styles.priceBefore, { color: tc.mutedForeground }]}>{deal.originalPrice}</Text>
            <Text style={[styles.priceAfter, { color: tc.primary }]}>{deal.studentPrice}</Text>
          </View>
          <View style={styles.xpChip}>
            <Feather name="zap" size={11} color={tc.gold} />
            <Text style={styles.xpChipText}>+{deal.xpReward} XP</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.claimBtn, isClaimed && styles.claimBtnDone]}
          onPress={() => onClaim(deal)}
          disabled={isClaimed}
          activeOpacity={0.8}
        >
          {isClaimed ? (
            <View style={styles.btnRow}>
              <Feather name="check-circle" size={15} color="#059669" />
              <Text style={styles.claimDoneText}>saved · +{deal.xpReward} XP</Text>
            </View>
          ) : (
            <LinearGradient
              colors={["#6355E8", "#8B5CF6"]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.claimGrad}
            >
              <Text style={styles.claimText}>Claim Deal</Text>
              <Feather name="arrow-right" size={15} color="#fff" />
            </LinearGradient>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  quickStartCard: {
    borderRadius: 18, padding: 18,
    borderWidth: 1.5, marginBottom: 16,
    shadowColor: "#6355E8", shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  quickStartDismiss: { position: "absolute", top: 14, right: 14, zIndex: 1 },
  quickStartTitle: { fontSize: 15, fontWeight: "800", fontFamily: "Inter_700Bold", marginBottom: 14 },
  quickStartSteps: { gap: 12, marginBottom: 16 },
  quickStartStep: { flexDirection: "row", alignItems: "center", gap: 10 },
  quickStartNum: { width: 22, height: 22, borderRadius: 11, justifyContent: "center", alignItems: "center" },
  quickStartNumText: { fontSize: 11, fontWeight: "800", fontFamily: "Inter_700Bold" },
  quickStartStepText: { fontSize: 14, fontFamily: "Inter_500Medium", flex: 1 },
  quickStartBtn: { borderRadius: 12, paddingVertical: 10, alignItems: "center", borderWidth: 1.5 },
  quickStartBtnText: { fontSize: 13, fontWeight: "700", fontFamily: "Inter_700Bold" },
  header: { paddingHorizontal: 20, paddingBottom: 16, gap: 6 },
  headerTitle: { fontSize: 26, fontWeight: "800", color: "#fff", fontFamily: "Inter_700Bold" },
  headerSub: { fontSize: 13, color: "rgba(255,255,255,0.6)", fontFamily: "Inter_400Regular" },
  savingsBanner: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "rgba(16,185,129,0.15)", borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: "rgba(16,185,129,0.3)",
  },
  savingsBannerText: { fontSize: 12, color: "#6EE7B7", fontFamily: "Inter_500Medium", flex: 1 },
  searchRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 14,
    paddingHorizontal: 14, height: 44, gap: 8,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.14)",
  },
  searchIcon: {},
  searchInput: { flex: 1, fontSize: 14, color: "#fff", fontFamily: "Inter_400Regular" },
  catWrap: { paddingVertical: 10, borderBottomWidth: 1 },
  catScroll: { paddingHorizontal: 16, gap: 8 },
  catPill: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5 },
  catText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  list: { padding: 16, gap: 10 },
  forYouHeader: { borderRadius: 16, padding: 14, marginBottom: 4, borderWidth: 1.5 },
  forYouTitleRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  forYouEmoji: { fontSize: 22 },
  forYouTitle: { fontSize: 15, fontWeight: "700", fontFamily: "Inter_700Bold" },
  forYouSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  interestPills: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  interestPill: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  interestPillText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  divider: { height: 1, marginVertical: 8 },
  sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4, marginTop: 8 },
  sectionTitle: { fontSize: 14, fontWeight: "700", fontFamily: "Inter_700Bold" },
  sectionCount: { fontSize: 12, fontFamily: "Inter_400Regular" },
  card: {
    borderRadius: 18,
    flexDirection: "row", overflow: "hidden",
    borderWidth: 1.5,
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  cardClaimed: { borderColor: "#A7F3D0", backgroundColor: "#F9FFFD" },
  cardHighlighted: { borderColor: "#C4B5FD", borderWidth: 2 },
  cardAccent: { width: 4 },
  cardBody: { flex: 1, padding: 14, gap: 10 },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  brandIcon: { width: 42, height: 42, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  brandEmoji: { fontSize: 20 },
  brandInfo: { flex: 1 },
  brandName: { fontSize: 15, fontWeight: "700", fontFamily: "Inter_700Bold" },
  brandCat: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
  tagBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  tagText: { fontSize: 11, fontWeight: "800", fontFamily: "Inter_700Bold", letterSpacing: 0.3 },
  dealDesc: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  priceRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  priceBlock: { flexDirection: "row", alignItems: "center", gap: 8 },
  priceBefore: { fontSize: 12, textDecorationLine: "line-through", fontFamily: "Inter_400Regular" },
  priceAfter: { fontSize: 15, fontWeight: "700", fontFamily: "Inter_700Bold" },
  xpChip: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "#FEF3C7", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  xpChipText: { fontSize: 11, fontWeight: "700", color: "#92400E", fontFamily: "Inter_700Bold" },
  claimBtn: { borderRadius: 12, overflow: "hidden" },
  claimBtnDone: { backgroundColor: "#F0FDF4", borderWidth: 1.5, borderColor: "#A7F3D0", height: 44, justifyContent: "center", alignItems: "center" },
  claimGrad: { height: 44, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 7 },
  claimText: { color: "#fff", fontSize: 14, fontWeight: "700", fontFamily: "Inter_700Bold" },
  claimDoneText: { color: "#059669", fontSize: 14, fontWeight: "700", fontFamily: "Inter_700Bold" },
  btnRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  emptyState: { alignItems: "center", paddingVertical: 48, gap: 8 },
  emptyEmoji: { fontSize: 40 },
  emptyTitle: { fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold" },
  emptySub: { fontSize: 14, fontFamily: "Inter_400Regular" },
});
