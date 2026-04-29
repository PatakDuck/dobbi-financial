import React, { useState, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Platform, TextInput,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { displayFont } from "@/constants/fonts";

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
  { id: "1",  brand: "Microsoft 365",    category: "Tech",          tag: "FREE",         tagType: "free",     description: "Full Office suite — Word, Excel, PowerPoint, Teams. Just use your .edu email.", originalPrice: "$9.99/mo",   studentPrice: "$0.00",       emoji: "💻", accentColor: "#0078D4", xpReward: 100, hot: true,  interests: ["Tech"] },
  { id: "2",  brand: "Spotify",          category: "Music",         tag: "50% OFF",      tagType: "discount", description: "Premium music, no ads, offline downloads. Half price because you're in school.", originalPrice: "$11.99/mo", studentPrice: "$5.99/mo",    emoji: "🎵", accentColor: "#1DB954", xpReward: 50,  hot: true,  interests: ["Music"] },
  { id: "3",  brand: "Amazon Prime",     category: "Shopping",      tag: "6 MO FREE",    tagType: "trial",    description: "Free same-day delivery and Prime Video. Six months free with .edu, then $7.49/mo.", originalPrice: "$14.99/mo", studentPrice: "6mo free",    emoji: "📦", accentColor: "#FF9900", xpReward: 75,  hot: false, interests: ["Shopping", "Food"] },
  { id: "4",  brand: "Adobe CC",         category: "Design",        tag: "65% OFF",      tagType: "discount", description: "Photoshop, Premiere, Illustrator, 20+ apps. The full suite.", originalPrice: "$59.99/mo", studentPrice: "$19.99/mo",   emoji: "🎨", accentColor: "#FF0000", xpReward: 80,  hot: false, interests: ["Tech", "Design"] },
  { id: "5",  brand: "Apple Music",      category: "Music",         tag: "50% OFF",      tagType: "discount", description: "100M songs, spatial audio, no ads. Half price for students.", originalPrice: "$10.99/mo", studentPrice: "$5.99/mo",    emoji: "🍎", accentColor: "#FA243C", xpReward: 50,  hot: false, interests: ["Music"] },
  { id: "6",  brand: "Chipotle",         category: "Food",          tag: "$2 OFF",       tagType: "cash",     description: "Any bowl or burrito. Show your student ID. Stack with their rewards app.", originalPrice: "$10.75",    studentPrice: "$8.75",       emoji: "🌯", accentColor: "#A51C1B", xpReward: 30,  hot: true,  interests: ["Food"] },
  { id: "7",  brand: "Notion",           category: "Productivity",  tag: "FREE",         tagType: "free",     description: "The personal plan is free forever with a .edu email. Notes, databases, AI assistant.", originalPrice: "$16/mo",    studentPrice: "$0.00",       emoji: "📓", accentColor: "#191919", xpReward: 60,  hot: false, interests: ["Tech", "Productivity"] },
  { id: "8",  brand: "GitHub Copilot",   category: "Tech",          tag: "FREE",         tagType: "free",     description: "AI coding assistant and GitHub Pro. Free for students via GitHub Education Pack.", originalPrice: "$19/mo",    studentPrice: "$0.00",       emoji: "⚡", accentColor: "#6e40c9", xpReward: 90,  hot: true,  interests: ["Tech"] },
  { id: "9",  brand: "Headspace",        category: "Wellness",      tag: "85% OFF",      tagType: "discount", description: "Meditation and sleep tools. Stress is free, Headspace shouldn't be.", originalPrice: "$12.99/mo", studentPrice: "$1.99/mo",    emoji: "🧘", accentColor: "#F47D31", xpReward: 40,  hot: false, interests: ["Wellness", "Fitness"] },
  { id: "10", brand: "New York Times",   category: "News",          tag: "$1 FOR 6 MO",  tagType: "trial",    description: "Full digital access. Great for assignments and research. $1 intro, then $4/mo.", originalPrice: "$17/mo",    studentPrice: "$1 intro",    emoji: "📰", accentColor: "#222222", xpReward: 40,  hot: false, interests: ["Productivity"] },
  { id: "11", brand: "Nike",             category: "Sports",        tag: "10% OFF",      tagType: "discount", description: "Student discount on shoes, apparel, and gear. Verify via UNiDAYS.", originalPrice: "Full price", studentPrice: "10% off",     emoji: "👟", accentColor: "#111111", xpReward: 60,  hot: true,  interests: ["Fitness", "Sports"] },
  { id: "12", brand: "Adidas",           category: "Sports",        tag: "15% OFF",      tagType: "discount", description: "15% off sitewide for students. Use your .edu email to verify.", originalPrice: "Full price", studentPrice: "15% off",     emoji: "🏃", accentColor: "#000000", xpReward: 55,  hot: false, interests: ["Fitness", "Sports"] },
  { id: "13", brand: "Planet Fitness",   category: "Fitness",       tag: "$10/MO",       tagType: "discount", description: "Classic membership — cardio, weights, free fitness training. No contract.", originalPrice: "$24.99/mo", studentPrice: "$10/mo",      emoji: "💪", accentColor: "#7B2D8B", xpReward: 70,  hot: true,  interests: ["Fitness", "Sports"] },
  { id: "14", brand: "Peloton",          category: "Fitness",       tag: "3 MO FREE",    tagType: "trial",    description: "App-only plan: 1000+ classes — cycling, running, strength, yoga.", originalPrice: "$12.99/mo", studentPrice: "3mo free",    emoji: "🚴", accentColor: "#D43F3A", xpReward: 80,  hot: false, interests: ["Fitness"] },
  { id: "15", brand: "YouTube Premium",  category: "Entertainment", tag: "50% OFF",      tagType: "discount", description: "No ads, background play, YouTube Music included. Half price with student verification.", originalPrice: "$13.99/mo", studentPrice: "$7.99/mo",    emoji: "▶️", accentColor: "#FF0000", xpReward: 45,  hot: false, interests: ["Music", "Gaming"] },
  { id: "16", brand: "DoorDash",         category: "Food",          tag: "1 MO FREE",    tagType: "trial",    description: "DashPass free for 1 month — free delivery on orders over $12. Cancel anytime.", originalPrice: "$9.99/mo",  studentPrice: "1mo free",    emoji: "🛵", accentColor: "#FF3008", xpReward: 35,  hot: true,  interests: ["Food"] },
  { id: "17", brand: "Discord Nitro",    category: "Gaming",        tag: "3 MO FREE",    tagType: "trial",    description: "Custom emojis, HD streaming, server boosts. Free via GitHub Student Pack.", originalPrice: "$9.99/mo",  studentPrice: "3mo free",    emoji: "🎮", accentColor: "#5865F2", xpReward: 65,  hot: false, interests: ["Gaming"] },
  { id: "18", brand: "Xbox Game Pass",   category: "Gaming",        tag: "$1 FIRST MO",  tagType: "trial",    description: "100+ games day one, EA Play included, cloud gaming. $1 intro for your first month.", originalPrice: "$14.99/mo", studentPrice: "$1 intro",    emoji: "🕹️", accentColor: "#107C10", xpReward: 55,  hot: false, interests: ["Gaming"] },
  { id: "19", brand: "Calm",             category: "Wellness",      tag: "40% OFF",      tagType: "discount", description: "Sleep stories, meditation, breathwork. Your finals week survival kit.", originalPrice: "$69.99/yr", studentPrice: "$41.99/yr",   emoji: "🌙", accentColor: "#4A6FA5", xpReward: 40,  hot: false, interests: ["Wellness"] },
  { id: "20", brand: "ASOS",             category: "Fashion",       tag: "10% OFF",      tagType: "discount", description: "Student discount on thousands of brands. Verify through Student Beans.", originalPrice: "Full price", studentPrice: "10% off",     emoji: "👗", accentColor: "#333333", xpReward: 45,  hot: false, interests: ["Fashion"] },
  { id: "21", brand: "StudentUniverse",  category: "Travel",        tag: "UP TO 35% OFF", tagType: "discount", description: "Flights, hotels, tours — student-exclusive prices.", originalPrice: "Full fare",  studentPrice: "Up to 35% off", emoji: "✈️", accentColor: "#0066CC", xpReward: 85,  hot: true,  interests: ["Travel"] },
  { id: "22", brand: "Audible",          category: "Education",     tag: "30% OFF",      tagType: "discount", description: "Audiobooks, podcasts, originals. Great for commutes and studying.", originalPrice: "$14.95/mo", studentPrice: "$9.95/mo",    emoji: "🎧", accentColor: "#F8991D", xpReward: 45,  hot: false, interests: ["Music", "Productivity"] },
  { id: "23", brand: "Coursera Plus",    category: "Education",     tag: "7 DAYS FREE",  tagType: "trial",    description: "7,000+ courses from Google, IBM, Yale. Certificates that land jobs.", originalPrice: "$59/mo",    studentPrice: "7 days free", emoji: "🎓", accentColor: "#0056D2", xpReward: 70,  hot: false, interests: ["Tech", "Productivity"] },
  { id: "24", brand: "Duolingo Super",   category: "Education",     tag: "20% OFF",      tagType: "discount", description: "No ads, unlimited hearts, streak repair. Don't let ads kill your flow.", originalPrice: "$6.99/mo",  studentPrice: "$5.59/mo",    emoji: "🦉", accentColor: "#58CC02", xpReward: 35,  hot: false, interests: ["Productivity"] },
  { id: "25", brand: "Hostelworld",      category: "Travel",        tag: "10% OFF",      tagType: "discount", description: "Book hostels, budget hotels, guesthouses worldwide. Student discount auto-applied.", originalPrice: "Full price", studentPrice: "10% off",     emoji: "🌍", accentColor: "#FF6600", xpReward: 50,  hot: false, interests: ["Travel"] },
];

const CATEGORIES = ["All", "Tech", "Music", "Food", "Sports", "Fitness", "Fashion", "Gaming", "Wellness", "Travel", "Design", "Productivity", "Entertainment", "Education", "News", "Shopping"];

const TAG_STYLES: Record<string, { bg: string; text: string }> = {
  free:     { bg: "#E8F5EE", text: "#2D6A4F" },
  discount: { bg: "#EEF2FF", text: "#2A3FAE" },
  cash:     { bg: "#FEF3C7", text: "#92400E" },
  trial:    { bg: "#FAF5EC",  text: "#B85330" },
};

const INTEREST_ICONS: Record<string, string> = {
  Tech: "cpu", Music: "music", Food: "coffee", Fitness: "activity",
  Sports: "zap", Fashion: "shopping-bag", Gaming: "monitor",
  Wellness: "heart", Travel: "map", Design: "pen-tool",
  Productivity: "briefcase",
};

function getPersonalizedDeals(deals: Deal[], topSpend: string, interests: string[]): Deal[] {
  const spendToInterest: Record<string, string> = {
    food: "Food", clothes: "Fashion", entertainment: "Gaming",
    tech: "Tech", travel: "Travel", fitness: "Fitness",
  };
  const all = [spendToInterest[topSpend], ...interests].filter(Boolean);
  if (all.length === 0) return [];
  return deals.filter((d) => d.interests.some((i) => all.includes(i)));
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
      { backgroundColor: tc.card, borderColor: isClaimed ? "#A7C4B5" : tc.border },
      highlighted && { borderColor: tc.primary + "60" },
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
          <View style={[styles.xpChip, { backgroundColor: tc.muted }]}>
            <Feather name="zap" size={11} color={tc.gold} />
            <Text style={[styles.xpChipText, { color: tc.gold }]}>+{deal.xpReward} XP</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.claimBtn,
            isClaimed
              ? { backgroundColor: "#E8F5EE", borderWidth: 1, borderColor: "#A7C4B5" }
              : { backgroundColor: tc.foreground },
          ]}
          onPress={() => onClaim(deal)}
          disabled={isClaimed}
          activeOpacity={0.8}
        >
          {isClaimed ? (
            <View style={styles.btnRow}>
              <Feather name="check-circle" size={15} color="#2D6A4F" />
              <Text style={[styles.claimDoneText, { color: "#2D6A4F" }]}>Saved · +{deal.xpReward} XP</Text>
            </View>
          ) : (
            <View style={styles.btnRow}>
              <Text style={[styles.claimText, { color: tc.onForeground }]}>Claim deal</Text>
              <Feather name="arrow-right" size={15} color={tc.onForeground} />
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
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
  const topPad = Platform.OS === "web" ? insets.top + 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? insets.bottom + 34 : insets.bottom;

  useEffect(() => {
    const loadPersonalization = async () => {
      try {
        const [answersRaw, interestsRaw] = await Promise.all([
          AsyncStorage.getItem("dobbi_onboarding_answers"),
          AsyncStorage.getItem("dobbi_user_interests"),
        ]);
        const answers = answersRaw ? JSON.parse(answersRaw) : {};
        const interests: string[] = interestsRaw ? JSON.parse(interestsRaw) : [];
        setUserInterests(interests);
        const personalized = getPersonalizedDeals(DEALS, answers.top_spend ?? "", interests);
        setForYouDeals(personalized.slice(0, 4));
      } catch { /* ignore */ }
    };
    loadPersonalization();
  }, []);

  const totalClaimed = Object.keys(claimed).length;

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
    <View style={[styles.root, { backgroundColor: tc.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 16, backgroundColor: tc.background, borderBottomColor: tc.border }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.eyebrow, { color: tc.primary }]}>Picked for you</Text>
            <Text style={[styles.headerTitle, { color: tc.foreground }]}>Student deals</Text>
          </View>
        </View>

        {totalClaimed > 0 && (
          <View style={[styles.savingsBanner, { backgroundColor: tc.muted, borderColor: tc.border }]}>
            <Feather name="trending-up" size={13} color={tc.green} />
            <Text style={[styles.savingsBannerText, { color: tc.foreground }]}>
              {totalClaimed} deal{totalClaimed !== 1 ? "s" : ""} claimed — keep going
            </Text>
          </View>
        )}

        <View style={[styles.searchRow, { backgroundColor: tc.muted, borderColor: tc.border }]}>
          <Feather name="search" size={16} color={tc.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: tc.foreground }]}
            placeholder="Search brands or categories..."
            placeholderTextColor={tc.mutedForeground}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Feather name="x" size={16} color={tc.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category filter */}
      <View style={[styles.catWrap, { backgroundColor: tc.background, borderBottomColor: tc.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catScroll}>
          {CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c}
              style={[
                styles.catPill,
                { backgroundColor: tc.muted, borderColor: tc.border },
                c === category && {
                  backgroundColor: tc.isDark ? tc.primary : tc.foreground,
                  borderColor: tc.isDark ? tc.primary : tc.foreground,
                },
              ]}
              onPress={() => setCategory(c)}
              activeOpacity={0.75}
            >
              <Text style={[
                styles.catText,
                { color: c === category ? (tc.isDark ? "#fff" : tc.onForeground) : tc.mutedForeground },
                c === category && { fontFamily: "Inter_600SemiBold" },
              ]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={[styles.list, { paddingBottom: bottomPad + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Featured card */}
        {category === "All" && !search && (
          <View style={[styles.featuredCard, { backgroundColor: tc.muted, borderColor: tc.border }]}>
            <Text style={[styles.featuredEyebrow, { color: tc.primary }]}>Featured</Text>
            <Text style={[styles.featuredTitle, { color: tc.foreground }]}>
              6 months of Amazon Prime, on the house.
            </Text>
            <Text style={[styles.featuredSub, { color: tc.mutedForeground }]}>
              Free with your .edu email. Then $7.49/month — half the regular price.
            </Text>
            <TouchableOpacity
              style={[styles.featuredBtn, { backgroundColor: tc.foreground }]}
              onPress={() => handleClaim(DEALS.find((d) => d.brand === "Amazon Prime")!)}
              activeOpacity={0.85}
            >
              <Text style={[styles.featuredBtnText, { color: tc.onForeground }]}>Claim deal</Text>
              <Feather name="arrow-up-right" size={14} color={tc.onForeground} />
            </TouchableOpacity>
          </View>
        )}

        {/* Personalized picks */}
        {forYouDeals.length > 0 && category === "All" && !search && (
          <>
            <View style={styles.sectionRow}>
              <Text style={[styles.sectionTitle, { color: tc.foreground }]}>Picked for you</Text>
              {userInterests.length > 0 && (
                <View style={styles.interestPills}>
                  {userInterests.slice(0, 2).map((interest) => (
                    <View key={interest} style={[styles.interestPill, { backgroundColor: tc.muted }]}>
                      <Feather name={(INTEREST_ICONS[interest] ?? "tag") as any} size={10} color={tc.mutedForeground} />
                      <Text style={[styles.interestPillText, { color: tc.mutedForeground }]}>{interest}</Text>
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

        {/* Popular */}
        {hotDeals.length > 0 && (
          <>
            <View style={styles.sectionRow}>
              <Text style={[styles.sectionTitle, { color: tc.foreground }]}>Popular</Text>
              <Text style={[styles.sectionCount, { color: tc.mutedForeground }]}>{hotDeals.length} deals</Text>
            </View>
            {hotDeals.map((d) => (
              <DealCard key={d.id} deal={d} isClaimed={!!claimed[d.id]} onClaim={handleClaim} tc={tc} />
            ))}
            {otherDeals.length > 0 && (
              <View style={styles.sectionRow}>
                <Text style={[styles.sectionTitle, { color: tc.foreground }]}>All deals</Text>
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
            <Feather name="search" size={28} color={tc.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: tc.foreground }]}>No deals found</Text>
            <Text style={[styles.emptySub, { color: tc.mutedForeground }]}>Try a different search or category</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 22,
    paddingBottom: 14,
    gap: 10,
    borderBottomWidth: 1,
  },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  eyebrow: {
    fontSize: 10,
    letterSpacing: 1.8,
    textTransform: "uppercase",
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    marginBottom: 4,
  },
  headerTitle: { fontSize: 30, fontFamily: displayFont, fontWeight: "500", letterSpacing: -0.5, lineHeight: 34 },
  savingsBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
  },
  savingsBannerText: { fontSize: 12, fontFamily: "Inter_500Medium", flex: 1 },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 44,
    gap: 8,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  catWrap: { paddingVertical: 10, borderBottomWidth: 1 },
  catScroll: { paddingHorizontal: 16, gap: 8 },
  catPill: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  catText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  list: { padding: 16, gap: 10 },
  featuredCard: {
    borderRadius: 22,
    padding: 22,
    borderWidth: 1,
    gap: 8,
    marginBottom: 4,
  },
  featuredEyebrow: {
    fontSize: 10,
    letterSpacing: 1.8,
    textTransform: "uppercase",
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  featuredTitle: {
    fontSize: 22,
    fontFamily: displayFont,
    fontWeight: "500",
    letterSpacing: -0.4,
    lineHeight: 28,
  },
  featuredSub: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  featuredBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginTop: 4,
  },
  featuredBtnText: { fontSize: 14, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4, marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  sectionCount: { fontSize: 12, fontFamily: "Inter_400Regular" },
  interestPills: { flexDirection: "row", gap: 5 },
  interestPill: { flexDirection: "row", alignItems: "center", gap: 3, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 },
  interestPillText: { fontSize: 10, fontFamily: "Inter_500Medium" },
  divider: { height: 1, marginVertical: 8 },
  card: {
    borderRadius: 18,
    flexDirection: "row",
    overflow: "hidden",
    borderWidth: 1,
  },
  cardAccent: { width: 4 },
  cardBody: { flex: 1, padding: 14, gap: 10 },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  brandIcon: { width: 42, height: 42, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  brandEmoji: { fontSize: 20 },
  brandInfo: { flex: 1 },
  brandName: { fontSize: 15, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  brandCat: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
  tagBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  tagText: { fontSize: 11, fontWeight: "700", fontFamily: "Inter_700Bold", letterSpacing: 0.3 },
  dealDesc: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  priceRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  priceBlock: { flexDirection: "row", alignItems: "center", gap: 8 },
  priceBefore: { fontSize: 12, textDecorationLine: "line-through", fontFamily: "Inter_400Regular" },
  priceAfter: { fontSize: 15, fontWeight: "700", fontFamily: "Inter_700Bold" },
  xpChip: { flexDirection: "row", alignItems: "center", gap: 3, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  xpChipText: { fontSize: 11, fontWeight: "700", fontFamily: "Inter_700Bold" },
  claimBtn: { borderRadius: 12, height: 44, justifyContent: "center", alignItems: "center" },
  btnRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  claimText: { fontSize: 14, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  claimDoneText: { fontSize: 14, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  emptyState: { alignItems: "center", paddingVertical: 48, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  emptySub: { fontSize: 14, fontFamily: "Inter_400Regular" },
});
