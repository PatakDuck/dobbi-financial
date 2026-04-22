import React, { useState, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Platform, Dimensions, Modal,
  ActivityIndicator, Alert, TextInput,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import Svg, { Rect, Text as SvgText, G, Path, Circle } from "react-native-svg";
import { useAuth } from "@/context/AuthContext";
import { useTransactions } from "@/hooks/useTransactions";
import { useColors } from "@/hooks/useColors";

const { width: SCREEN_W } = Dimensions.get("window");
const CHART_W = SCREEN_W - 48;

// ── Static sample data ────────────────────────────────────────────────────────

const WEEKLY_SPEND = [
  { day: "M", amount: 24 },
  { day: "T", amount: 8 },
  { day: "W", amount: 47 },
  { day: "T", amount: 12 },
  { day: "F", amount: 65 },
  { day: "S", amount: 31 },
  { day: "S", amount: 22, today: true },
];

const MONTHLY_TREND = [
  { month: "Nov", amount: 380 },
  { month: "Dec", amount: 520 },
  { month: "Jan", amount: 290 },
  { month: "Feb", amount: 410 },
  { month: "Mar", amount: 360 },
  { month: "Apr", amount: 534 },
];

const CATEGORIES = [
  { id: "food",      label: "Food & Drinks",  icon: "coffee",       amount: 247, budget: 300, color: "#6355E8" },
  { id: "transport", label: "Transport",       icon: "navigation",   amount: 63,  budget: 80,  color: "#00B894" },
  { id: "shopping",  label: "Shopping",        icon: "shopping-bag", amount: 135, budget: 100, color: "#F59E0B" },
  { id: "subs",      label: "Subscriptions",   icon: "repeat",       amount: 29,  budget: 40,  color: "#06B6D4" },
  { id: "education", label: "Education",       icon: "book",         amount: 60,  budget: 100, color: "#8B5CF6" },
];

interface Transaction {
  id: string;
  name: string;
  amount: number;
  category: string;
  icon: string;
  dateGroup: string;
  time: string;
  isExpense: boolean;
  scanned?: boolean;
}

const TRANSACTIONS: Transaction[] = [
  { id: "t1", name: "Chipotle",       amount: 14.50, category: "food",      icon: "coffee",        dateGroup: "Today",        time: "2:34 PM",   isExpense: true },
  { id: "t2", name: "Uber",           amount: 8.00,  category: "transport", icon: "navigation",    dateGroup: "Today",        time: "11:20 AM",  isExpense: true },
  { id: "t3", name: "Target",         amount: 45.20, category: "shopping",  icon: "shopping-bag",  dateGroup: "Yesterday",    time: "3:15 PM",   isExpense: true },
  { id: "t4", name: "Starbucks",      amount: 6.50,  category: "food",      icon: "coffee",        dateGroup: "Yesterday",    time: "9:00 AM",   isExpense: true },
  { id: "t5", name: "Dining Hall",    amount: 12.00, category: "food",      icon: "coffee",        dateGroup: "Mon Apr 18",   time: "12:30 PM",  isExpense: true },
  { id: "t6", name: "Spotify",        amount: 5.99,  category: "subs",      icon: "music",         dateGroup: "Mon Apr 18",   time: "Auto-pay",  isExpense: true },
  { id: "t7", name: "Textbook rental",amount: 35.00, category: "education", icon: "book",          dateGroup: "Sat Apr 16",   time: "1:00 PM",   isExpense: true },
  { id: "t8", name: "Instacart",      amount: 67.50, category: "food",      icon: "shopping-cart", dateGroup: "Fri Apr 15",   time: "4:20 PM",   isExpense: true },
];

const CAT_COLORS: Record<string, string> = {
  food: "#6355E8", transport: "#00B894", shopping: "#F59E0B",
  subs: "#06B6D4", education: "#8B5CF6",
};

const CAT_TIPS: Record<string, string> = {
  food:      "lowkey your food spend is a vibe but also 👀",
  shopping:  "this one hurts a little ngl",
  transport: "ride share habit going crazy fr",
  subs:      "how many streaming services does one person need 💀",
  education: "necessary pain bestie, we respect it",
};

const FUN_STATS = [
  { category: "food",      pct: 71, label: "food & drinks", emoji: "🍕" },
  { category: "shopping",  pct: 84, label: "shopping",      emoji: "🛍️" },
  { category: "transport", pct: 58, label: "transport",     emoji: "🚌" },
];

const SAVINGS_GOALS = [
  { id: "g1", name: "Thailand Trip ✈️",   saved: 340, target: 1200, monthly: 100, color: "#6355E8", emoji: "✈️" },
  { id: "g2", name: "New MacBook 💻",     saved: 680, target: 1500, monthly: 150, color: "#00B894", emoji: "💻" },
  { id: "g3", name: "Emergency Fund 🛡️", saved: 200, target: 500,  monthly: 50,  color: "#F59E0B", emoji: "🛡️" },
];

const ICON_OPTIONS = ["coffee", "shopping-bag", "music", "book", "heart", "home", "monitor", "gift", "truck", "scissors"];
const COLOR_OPTIONS = ["#6355E8", "#00B894", "#F59E0B", "#EF4444", "#06B6D4", "#8B5CF6", "#EC4899", "#10B981"];

// ── Bar Chart (weekly) ────────────────────────────────────────────────────────

function WeeklyBarChart({ data }: { data: typeof WEEKLY_SPEND }) {
  const maxAmt = Math.max(...data.map((d) => d.amount), 1);
  const chartH = 100;
  const labelH = 24;
  const maxBarH = 64;
  const totalH = chartH + labelH;
  const barPad = 6;
  const barW = (CHART_W - barPad * (data.length + 1)) / data.length;

  return (
    <Svg width={CHART_W} height={totalH}>
      {data.map((d, i) => {
        const barH = Math.max((d.amount / maxAmt) * maxBarH, 4);
        const x = barPad + i * (barW + barPad);
        const y = chartH - barH;
        return (
          <G key={i}>
            <Rect x={x} y={y} width={barW} height={barH} rx={6} ry={6}
              fill={d.today ? "#6355E8" : "#E4E7F0"} />
            {d.amount > 0 && (
              <SvgText x={x + barW / 2} y={y - 5} textAnchor="middle" fontSize={9}
                fill={d.today ? "#6355E8" : "#9CA3AF"} fontWeight={d.today ? "bold" : "normal"}>
                ${d.amount}
              </SvgText>
            )}
            <SvgText x={x + barW / 2} y={totalH - 5} textAnchor="middle" fontSize={11}
              fill={d.today ? "#6355E8" : "#9CA3AF"} fontWeight={d.today ? "bold" : "normal"}>
              {d.day}
            </SvgText>
          </G>
        );
      })}
    </Svg>
  );
}

// ── Line Chart (monthly trend) ────────────────────────────────────────────────

function MonthlyTrendChart({ data }: { data: typeof MONTHLY_TREND }) {
  const maxAmt = Math.max(...data.map((d) => d.amount), 1);
  const chartH = 80;
  const labelH = 20;
  const totalH = chartH + labelH;
  const padX = 10;
  const usableW = CHART_W - padX * 2;
  const stepX = usableW / (data.length - 1);

  const pts = data.map((d, i) => ({
    x: padX + i * stepX,
    y: chartH - 8 - ((d.amount / maxAmt) * (chartH - 20)),
  }));

  const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const areaPath = `${linePath} L${pts[pts.length - 1].x},${chartH} L${pts[0].x},${chartH} Z`;

  return (
    <Svg width={CHART_W} height={totalH}>
      <Path d={areaPath} fill="rgba(99,85,232,0.08)" />
      <Path d={linePath} stroke="#6355E8" strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <G key={i}>
          <Circle cx={p.x} cy={p.y} r={i === pts.length - 1 ? 5 : 3.5}
            fill={i === pts.length - 1 ? "#6355E8" : "#fff"}
            stroke="#6355E8" strokeWidth={2} />
          <SvgText x={p.x} y={totalH - 2} textAnchor="middle" fontSize={10}
            fill={i === pts.length - 1 ? "#6355E8" : "#9CA3AF"}
            fontWeight={i === pts.length - 1 ? "bold" : "normal"}>
            {data[i].month}
          </SvgText>
        </G>
      ))}
    </Svg>
  );
}

// ── Scanned item type ─────────────────────────────────────────────────────────

interface ScannedItem {
  id: string;
  name: string;
  amount: number;
  selected: boolean;
}

interface CustomCategory {
  id: string;
  label: string;
  icon: string;
  budget: number;
  color: string;
  amount: number;
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function BudgetScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const tc = useColors();
  const topPad = Platform.OS === "web" ? insets.top + 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? insets.bottom + 34 : insets.bottom;

  const { transactions, categories: dbCategories, loading: dbLoading, addTransaction } = useTransactions();
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);

  const baseCategories = dbCategories.length > 0 ? dbCategories : CATEGORIES;
  const CATEGORIES_DISPLAY = [...baseCategories, ...customCategories];

  // Receipt scan state
  const [scanModal, setScanModal] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [scanDone, setScanDone] = useState(false);
  const [scannedMerchant, setScannedMerchant] = useState("");

  // New category modal state
  const [catModal, setCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatIcon, setNewCatIcon] = useState("coffee");
  const [newCatColor, setNewCatColor] = useState("#6355E8");
  const [newCatBudget, setNewCatBudget] = useState("");

  const totalSpent = CATEGORIES_DISPLAY.reduce((s, c) => s + c.amount, 0);
  const totalBudget = CATEGORIES_DISPLAY.reduce((s, c) => s + c.budget, 0);
  const weeklyTotal = WEEKLY_SPEND.reduce((s, d) => s + d.amount, 0);

  const grouped = transactions.reduce<Record<string, Transaction[]>>((acc, t) => {
    if (!acc[t.dateGroup]) acc[t.dateGroup] = [];
    acc[t.dateGroup].push(t);
    return acc;
  }, {});

  const txList = Object.keys(grouped).length > 0 ? grouped : TRANSACTIONS.reduce<Record<string, Transaction[]>>((acc, t) => {
    if (!acc[t.dateGroup]) acc[t.dateGroup] = [];
    acc[t.dateGroup].push(t);
    return acc;
  }, {});

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleScanReceipt = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Camera needed", "Allow camera access to scan receipts.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8, allowsEditing: false, base64: true });
    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    if (!asset.base64) { Alert.alert("Error", "Could not read image data."); return; }

    setScanModal(true);
    setScanning(true);
    setScanDone(false);
    setScannedMerchant("");

    try {
      const apiUrl = process.env["EXPO_PUBLIC_API_URL"] ?? "";
      const response = await fetch(`${apiUrl}/api/receipt/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: asset.base64, mimeType: asset.mimeType ?? "image/jpeg" }),
      });
      if (!response.ok) throw new Error("Server error");
      const data = await response.json() as { merchant: string; items: ScannedItem[] };
      setScannedMerchant(data.merchant);
      setScannedItems(data.items);
      setScanDone(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      setScanModal(false);
      Alert.alert("Scan failed", "Couldn't read the receipt 😭 Try again with better lighting.");
    } finally {
      setScanning(false);
    }
  };

  const handleToggleItem = (id: string) => {
    setScannedItems((prev) => prev.map((item) => item.id === id ? { ...item, selected: !item.selected } : item));
  };

  const handleAddTobudget = async () => {
    const selected = scannedItems.filter((i) => i.selected);
    const total = selected.reduce((s, i) => s + i.amount, 0);
    await addTransaction({
      name: `${scannedMerchant} (scanned)`,
      amount: parseFloat(total.toFixed(2)),
      category: "food", icon: "camera",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isExpense: true, scanned: true,
    });
    setScanModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleAddCategory = () => {
    if (!newCatName.trim()) { Alert.alert("Name required", "Give your category a name."); return; }
    const budget = parseFloat(newCatBudget);
    if (!budget || budget <= 0) { Alert.alert("Budget required", "Enter a monthly budget amount."); return; }
    const newCat: CustomCategory = {
      id: `custom_${Date.now()}`,
      label: newCatName.trim(),
      icon: newCatIcon,
      budget,
      color: newCatColor,
      amount: 0,
    };
    setCustomCategories((prev) => [...prev, newCat]);
    setNewCatName(""); setNewCatIcon("coffee"); setNewCatColor("#6355E8"); setNewCatBudget("");
    setCatModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const scannedTotal = scannedItems.filter((i) => i.selected).reduce((s, i) => s + i.amount, 0);

  return (
    <LinearGradient colors={tc.backgroundGradient as [string, string, ...string[]]} style={styles.root}>
      {/* ── Header ── */}
      <LinearGradient colors={["#2D1B69", "#3D2A8A"]} style={[styles.header, { paddingTop: topPad + 16 }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Budget</Text>
            <Text style={styles.headerSub}>where your $ went this month 💸</Text>
          </View>
          <View style={styles.monthPill}><Text style={styles.monthText}>Apr 2026</Text></View>
        </View>

        <View style={styles.totalsRow}>
          <View style={styles.totalItem}>
            <Text style={styles.totalAmt}>${totalSpent}</Text>
            <Text style={styles.totalLbl}>spent</Text>
          </View>
          <View style={styles.totalDivider} />
          <View style={styles.totalItem}>
            <Text style={[styles.totalAmt, { color: "#A7F3D0" }]}>${totalBudget - totalSpent}</Text>
            <Text style={styles.totalLbl}>left</Text>
          </View>
          <View style={styles.totalDivider} />
          <View style={styles.totalItem}>
            <Text style={styles.totalAmt}>${weeklyTotal}</Text>
            <Text style={styles.totalLbl}>this week</Text>
          </View>
        </View>

        <View style={styles.budgetBarWrap}>
          <View style={styles.budgetBarTrack}>
            <View style={[styles.budgetBarFill, {
              width: `${Math.min((totalSpent / totalBudget) * 100, 100)}%` as any,
              backgroundColor: totalSpent > totalBudget ? "#EF4444" : "#00C896",
            }]} />
          </View>
          <Text style={styles.budgetBarLabel}>
            {Math.round((totalSpent / totalBudget) * 100)}% of ${totalBudget} budget used
          </Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 100 }]} showsVerticalScrollIndicator={false}>

        {/* ── Fun stat card ── */}
        <View style={styles.funStatCard}>
          <LinearGradient colors={["#6355E8", "#8B5CF6"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.funStatGrad}>
            <Text style={styles.funStatTitle}>📊 how you compare</Text>
            <View style={styles.funStatRow}>
              {FUN_STATS.map((s) => (
                <View key={s.category} style={styles.funStatItem}>
                  <Text style={styles.funStatEmoji}>{s.emoji}</Text>
                  <Text style={styles.funStatPct}>{s.pct}%</Text>
                  <Text style={styles.funStatLabel}>spend less on{"\n"}{s.label}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.funStatSub}>vs. other college students your age 🎓</Text>
          </LinearGradient>
        </View>

        {/* ── Weekly chart ── */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={[styles.sectionTitle, { color: tc.foreground }]}>this week</Text>
            <Text style={[styles.sectionSub, { color: tc.mutedForeground }]}>${weeklyTotal} total</Text>
          </View>
          <View style={[styles.card, { backgroundColor: tc.card, borderColor: tc.border }]}>
            <WeeklyBarChart data={WEEKLY_SPEND} />
            <View style={styles.chartLegend}>
              <View style={styles.legendDot} />
              <Text style={[styles.legendText, { color: tc.mutedForeground }]}>today highlighted</Text>
            </View>
          </View>
        </View>

        {/* ── Monthly trend ── */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={[styles.sectionTitle, { color: tc.foreground }]}>6-month trend</Text>
            <Text style={[styles.sectionSub, { color: tc.mutedForeground }]}>Nov → Apr</Text>
          </View>
          <View style={[styles.card, { backgroundColor: tc.card, borderColor: tc.border }]}>
            <MonthlyTrendChart data={MONTHLY_TREND} />
            <Text style={[styles.trendNote, { color: tc.mutedForeground }]}>
              Apr is your highest month — time to rein it in? 👀
            </Text>
          </View>
        </View>

        {/* ── Savings goals ── */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={[styles.sectionTitle, { color: tc.foreground }]}>saving for</Text>
            <Text style={[styles.sectionSub, { color: tc.mutedForeground }]}>{SAVINGS_GOALS.length} goals</Text>
          </View>
          {SAVINGS_GOALS.map((g) => {
            const pct = Math.min(Math.round((g.saved / g.target) * 100), 100);
            const monthsLeft = Math.ceil((g.target - g.saved) / g.monthly);
            return (
              <View key={g.id} style={[styles.goalCard, { backgroundColor: tc.card, borderColor: tc.border }]}>
                <View style={styles.goalCardRow}>
                  <View style={[styles.goalIconCircle, { backgroundColor: g.color + "18" }]}>
                    <Text style={styles.goalIconText}>{g.emoji}</Text>
                  </View>
                  <View style={styles.goalCardInfo}>
                    <Text style={[styles.goalCardName, { color: tc.foreground }]}>{g.name}</Text>
                    <Text style={[styles.goalCardSub, { color: tc.mutedForeground }]}>
                      ${g.monthly}/mo · ~{monthsLeft} month{monthsLeft !== 1 ? "s" : ""} to go
                    </Text>
                  </View>
                  <View>
                    <Text style={[styles.goalCardPct, { color: g.color }]}>{pct}%</Text>
                    <Text style={[styles.goalCardAmt, { color: tc.mutedForeground }]}>${g.saved}/${g.target}</Text>
                  </View>
                </View>
                <View style={[styles.goalBarTrack, { backgroundColor: tc.muted }]}>
                  <View style={[styles.goalBarFill, { width: `${pct}%` as any, backgroundColor: g.color }]} />
                </View>
              </View>
            );
          })}
        </View>

        {/* ── Category breakdown ── */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={[styles.sectionTitle, { color: tc.foreground }]}>by category</Text>
            <TouchableOpacity
              style={[styles.addCatBtn, { backgroundColor: tc.secondary, borderColor: tc.border }]}
              onPress={() => setCatModal(true)}
              activeOpacity={0.7}
            >
              <Feather name="plus" size={13} color={tc.primary} />
              <Text style={[styles.addCatText, { color: tc.primary }]}>add category</Text>
            </TouchableOpacity>
          </View>
          {CATEGORIES_DISPLAY.map((cat) => {
            const pct = Math.min((cat.amount / cat.budget) * 100, 100);
            const over = cat.amount > cat.budget;
            return (
              <View key={cat.id} style={[styles.catCard, { backgroundColor: tc.card, borderColor: tc.border }]}>
                <View style={styles.catRow}>
                  <View style={[styles.catIcon, { backgroundColor: cat.color + "18" }]}>
                    <Feather name={cat.icon as any} size={16} color={cat.color} />
                  </View>
                  <View style={styles.catInfo}>
                    <View style={styles.catLabelRow}>
                      <Text style={[styles.catLabel, { color: tc.foreground }]}>{cat.label}</Text>
                      {over && (
                        <View style={styles.overBadge}>
                          <Text style={styles.overBadgeText}>over budget</Text>
                        </View>
                      )}
                    </View>
                    <View style={[styles.catBarTrack, { backgroundColor: tc.muted }]}>
                      <View style={[styles.catBarFill, { width: `${pct}%` as any, backgroundColor: over ? "#EF4444" : cat.color }]} />
                    </View>
                  </View>
                  <View style={styles.catAmounts}>
                    <Text style={[styles.catSpent, { color: tc.foreground }, over && { color: "#EF4444" }]}>${cat.amount}</Text>
                    <Text style={[styles.catBudget, { color: tc.mutedForeground }]}>/${cat.budget}</Text>
                  </View>
                </View>
                {(over || pct > 70) && (
                  <Text style={[styles.catTip, { color: tc.mutedForeground }]}>
                    {over ? "💀 " : "👀 "}{CAT_TIPS[cat.id] ?? "worth keeping an eye on"}
                  </Text>
                )}
              </View>
            );
          })}
        </View>

        {/* ── Transactions ── */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={[styles.sectionTitle, { color: tc.foreground }]}>every transaction</Text>
            <Text style={[styles.sectionSub, { color: tc.mutedForeground }]}>{Object.values(txList).flat().length} entries</Text>
          </View>
          {Object.keys(txList).length === 0 && (
            <View style={[styles.emptyState, { backgroundColor: tc.card, borderColor: tc.border }]}>
              <Text style={styles.emptyEmoji}>📭</Text>
              <Text style={[styles.emptyTitle, { color: tc.foreground }]}>no transactions yet</Text>
              <Text style={[styles.emptySub, { color: tc.mutedForeground }]}>scan your first receipt to start tracking your spending</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={handleScanReceipt} activeOpacity={0.85}>
                <LinearGradient colors={["#6355E8", "#8B5CF6"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.emptyBtnGrad}>
                  <Feather name="camera" size={15} color="#fff" />
                  <Text style={styles.emptyBtnText}>Scan a Receipt</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
          {Object.entries(txList).map(([group, txs]) => (
            <View key={group}>
              <Text style={[styles.dateGroup, { color: tc.mutedForeground }]}>{group}</Text>
              <View style={[styles.card, { backgroundColor: tc.card, borderColor: tc.border }]}>
                {(txs as Transaction[]).map((tx, idx) => (
                  <View key={tx.id}>
                    <View style={styles.txRow}>
                      <View style={[styles.txIcon, { backgroundColor: (CAT_COLORS[tx.category] ?? "#6355E8") + "15" }]}>
                        <Feather name={tx.icon as any} size={16} color={CAT_COLORS[tx.category] ?? "#6355E8"} />
                      </View>
                      <View style={styles.txInfo}>
                        <View style={styles.txNameRow}>
                          <Text style={[styles.txName, { color: tc.foreground }]}>{tx.name}</Text>
                          {tx.scanned && (
                            <View style={[styles.scannedBadge, { backgroundColor: tc.secondary }]}>
                              <Feather name="camera" size={9} color={tc.primary} />
                              <Text style={[styles.scannedText, { color: tc.primary }]}>scanned</Text>
                            </View>
                          )}
                        </View>
                        <Text style={[styles.txTime, { color: tc.mutedForeground }]}>{tx.time}</Text>
                      </View>
                      <Text style={styles.txAmount}>
                        {tx.isExpense ? "-" : "+"}${tx.amount.toFixed(2)}
                      </Text>
                    </View>
                    {idx < (txs as Transaction[]).length - 1 && <View style={[styles.txDivider, { backgroundColor: tc.border }]} />}
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* ── Scan FAB ── */}
      <TouchableOpacity style={[styles.fab, { bottom: bottomPad + 82 }]} onPress={handleScanReceipt} activeOpacity={0.85}>
        <LinearGradient colors={["#6355E8", "#8B5CF6"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.fabGrad}>
          <Feather name="camera" size={20} color="#fff" />
          <Text style={styles.fabText}>Scan Receipt</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* ── Scan modal ── */}
      <Modal visible={scanModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: tc.isDark ? "#1A1640" : "#fff" }]}>
            <View style={[styles.modalHandle, { backgroundColor: tc.border }]} />
            {scanning ? (
              <View style={styles.scanningState}>
                <ActivityIndicator size="large" color={tc.primary} />
                <Text style={[styles.scanningTitle, { color: tc.foreground }]}>analyzing receipt... 🔍</Text>
                <Text style={[styles.scanningSub, { color: tc.mutedForeground }]}>dobbi's reading your bill ngl</Text>
              </View>
            ) : (
              <>
                <View style={styles.modalHeader}>
                  <View>
                    <Text style={[styles.modalTitle, { color: tc.foreground }]}>{scannedMerchant}</Text>
                    <Text style={[styles.modalSub, { color: tc.mutedForeground }]}>select what to add to your budget</Text>
                  </View>
                  <TouchableOpacity onPress={() => setScanModal(false)} style={[styles.closeBtn, { backgroundColor: tc.muted }]}>
                    <Feather name="x" size={20} color={tc.mutedForeground} />
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.itemList} showsVerticalScrollIndicator={false}>
                  {scannedItems.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={[styles.itemRow, { borderBottomColor: tc.border }]}
                      onPress={() => handleToggleItem(item.id)}
                      activeOpacity={0.75}
                    >
                      <View style={[styles.itemCheck, { borderColor: tc.border }, item.selected && { backgroundColor: tc.primary, borderColor: tc.primary }]}>
                        {item.selected && <Feather name="check" size={12} color="#fff" />}
                      </View>
                      <Text style={[styles.itemName, { color: tc.foreground }, !item.selected && styles.itemDim]}>{item.name}</Text>
                      <Text style={[styles.itemAmt, { color: tc.foreground }, !item.selected && styles.itemDim]}>${item.amount.toFixed(2)}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <View style={styles.modalFooter}>
                  <View style={styles.totalRowModal}>
                    <Text style={[styles.totalLabelModal, { color: tc.mutedForeground }]}>total to add</Text>
                    <Text style={[styles.totalAmtModal, { color: tc.foreground }]}>${scannedTotal.toFixed(2)}</Text>
                  </View>
                  <TouchableOpacity style={styles.addBtn} onPress={handleAddTobudget} activeOpacity={0.85}>
                    <LinearGradient colors={["#6355E8", "#8B5CF6"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.addBtnGrad}>
                      <Feather name="plus-circle" size={17} color="#fff" />
                      <Text style={styles.addBtnText}>Add to Budget</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* ── New category modal ── */}
      <Modal visible={catModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: tc.isDark ? "#1A1640" : "#fff", maxHeight: "85%" }]}>
            <View style={[styles.modalHandle, { backgroundColor: tc.border }]} />
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: tc.foreground }]}>new category</Text>
              <TouchableOpacity onPress={() => setCatModal(false)} style={[styles.closeBtn, { backgroundColor: tc.muted }]}>
                <Feather name="x" size={20} color={tc.mutedForeground} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.catFieldLabel, { color: tc.mutedForeground }]}>category name</Text>
              <TextInput
                style={[styles.catInput, { backgroundColor: tc.muted, color: tc.foreground, borderColor: tc.border }]}
                placeholder="e.g. Gym & Fitness"
                placeholderTextColor={tc.mutedForeground}
                value={newCatName}
                onChangeText={setNewCatName}
              />

              <Text style={[styles.catFieldLabel, { color: tc.mutedForeground }]}>monthly budget ($)</Text>
              <TextInput
                style={[styles.catInput, { backgroundColor: tc.muted, color: tc.foreground, borderColor: tc.border }]}
                placeholder="e.g. 60"
                placeholderTextColor={tc.mutedForeground}
                value={newCatBudget}
                onChangeText={setNewCatBudget}
                keyboardType="numeric"
              />

              <Text style={[styles.catFieldLabel, { color: tc.mutedForeground }]}>icon</Text>
              <View style={styles.iconGrid}>
                {ICON_OPTIONS.map((icon) => (
                  <TouchableOpacity
                    key={icon}
                    style={[
                      styles.iconOption,
                      { borderColor: tc.border },
                      newCatIcon === icon && { borderColor: newCatColor, backgroundColor: newCatColor + "18" },
                    ]}
                    onPress={() => setNewCatIcon(icon)}
                    activeOpacity={0.7}
                  >
                    <Feather name={icon as any} size={18} color={newCatIcon === icon ? newCatColor : tc.mutedForeground} />
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.catFieldLabel, { color: tc.mutedForeground }]}>color</Text>
              <View style={styles.colorRow}>
                {COLOR_OPTIONS.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.colorSwatch, { backgroundColor: c }, newCatColor === c && styles.colorSwatchSelected]}
                    onPress={() => setNewCatColor(c)}
                    activeOpacity={0.8}
                  >
                    {newCatColor === c && <Feather name="check" size={12} color="#fff" />}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Preview */}
              {newCatName.trim() ? (
                <View style={[styles.catPreview, { backgroundColor: tc.muted, borderColor: newCatColor + "40" }]}>
                  <View style={[styles.catIcon, { backgroundColor: newCatColor + "18" }]}>
                    <Feather name={newCatIcon as any} size={16} color={newCatColor} />
                  </View>
                  <Text style={[styles.catPreviewName, { color: tc.foreground }]}>{newCatName}</Text>
                  <Text style={[styles.catPreviewBudget, { color: newCatColor }]}>
                    ${newCatBudget || "0"}/mo
                  </Text>
                </View>
              ) : null}

              <TouchableOpacity style={styles.createCatBtn} onPress={handleAddCategory} activeOpacity={0.85}>
                <LinearGradient colors={["#6355E8", "#8B5CF6"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.createCatGrad}>
                  <Feather name="plus" size={18} color="#fff" />
                  <Text style={styles.createCatText}>Create Category</Text>
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 20 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  headerTitle: { fontSize: 26, fontWeight: "800", color: "#fff", fontFamily: "Inter_700Bold" },
  headerSub: { fontSize: 13, color: "rgba(255,255,255,0.6)", fontFamily: "Inter_400Regular", marginTop: 2 },
  monthPill: { backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  monthText: { fontSize: 12, color: "rgba(255,255,255,0.8)", fontFamily: "Inter_600SemiBold" },
  totalsRow: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  totalItem: { flex: 1, alignItems: "center" },
  totalAmt: { fontSize: 20, fontWeight: "800", color: "#fff", fontFamily: "Inter_700Bold" },
  totalLbl: { fontSize: 11, color: "rgba(255,255,255,0.6)", fontFamily: "Inter_400Regular", marginTop: 2 },
  totalDivider: { width: 1, height: 30, backgroundColor: "rgba(255,255,255,0.15)" },
  budgetBarWrap: { gap: 6 },
  budgetBarTrack: { height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.15)", overflow: "hidden" },
  budgetBarFill: { height: "100%", borderRadius: 3 },
  budgetBarLabel: { fontSize: 11, color: "rgba(255,255,255,0.55)", fontFamily: "Inter_400Regular" },
  scroll: { padding: 16, gap: 0 },
  funStatCard: { marginBottom: 20, borderRadius: 20, overflow: "hidden", shadowColor: "#6355E8", shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
  funStatGrad: { padding: 18 },
  funStatTitle: { fontSize: 13, fontWeight: "700", color: "rgba(255,255,255,0.9)", fontFamily: "Inter_700Bold", marginBottom: 14 },
  funStatRow: { flexDirection: "row", justifyContent: "space-around" },
  funStatItem: { alignItems: "center", gap: 4 },
  funStatEmoji: { fontSize: 22 },
  funStatPct: { fontSize: 22, fontWeight: "800", color: "#fff", fontFamily: "Inter_700Bold" },
  funStatLabel: { fontSize: 10, color: "rgba(255,255,255,0.7)", fontFamily: "Inter_400Regular", textAlign: "center" },
  funStatSub: { fontSize: 11, color: "rgba(255,255,255,0.6)", fontFamily: "Inter_400Regular", marginTop: 12, textAlign: "center" },
  section: { marginBottom: 20 },
  sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  sectionTitle: { fontSize: 14, fontWeight: "700", fontFamily: "Inter_700Bold" },
  sectionSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  card: {
    borderRadius: 18, padding: 16,
    borderWidth: 1.5,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  chartLegend: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
  legendDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#6355E8" },
  legendText: { fontSize: 11, fontFamily: "Inter_400Regular" },
  trendNote: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 10, fontStyle: "italic" },
  goalCard: {
    borderRadius: 16, padding: 14,
    marginBottom: 10, borderWidth: 1.5,
  },
  goalCardRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 },
  goalIconCircle: { width: 42, height: 42, borderRadius: 21, justifyContent: "center", alignItems: "center" },
  goalIconText: { fontSize: 20 },
  goalCardInfo: { flex: 1 },
  goalCardName: { fontSize: 14, fontWeight: "700", fontFamily: "Inter_700Bold" },
  goalCardSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  goalCardPct: { fontSize: 16, fontWeight: "800", fontFamily: "Inter_700Bold", textAlign: "right" },
  goalCardAmt: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "right" },
  goalBarTrack: { height: 6, borderRadius: 3, overflow: "hidden" },
  goalBarFill: { height: "100%", borderRadius: 3 },
  addCatBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1.5,
  },
  addCatText: { fontSize: 12, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  catCard: {
    borderRadius: 16, padding: 14,
    marginBottom: 8, borderWidth: 1.5,
  },
  catRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  catIcon: { width: 38, height: 38, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  catInfo: { flex: 1, gap: 6 },
  catLabelRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  catLabel: { fontSize: 14, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  overBadge: { backgroundColor: "#FEE2E2", borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  overBadgeText: { fontSize: 10, color: "#DC2626", fontWeight: "700", fontFamily: "Inter_700Bold" },
  catBarTrack: { height: 6, borderRadius: 3, overflow: "hidden" },
  catBarFill: { height: "100%", borderRadius: 3 },
  catAmounts: { alignItems: "flex-end" },
  catSpent: { fontSize: 15, fontWeight: "700", fontFamily: "Inter_700Bold" },
  catBudget: { fontSize: 11, fontFamily: "Inter_400Regular" },
  catTip: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 8, fontStyle: "italic" },
  dateGroup: { fontSize: 12, fontWeight: "700", fontFamily: "Inter_700Bold", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8, marginTop: 4 },
  txRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 4 },
  txIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  txInfo: { flex: 1 },
  txNameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  txName: { fontSize: 14, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  scannedBadge: { flexDirection: "row", alignItems: "center", gap: 3, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  scannedText: { fontSize: 9, fontWeight: "700", fontFamily: "Inter_700Bold" },
  txTime: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  txAmount: { fontSize: 14, fontWeight: "700", color: "#EF4444", fontFamily: "Inter_700Bold" },
  txDivider: { height: 1, marginVertical: 6 },
  fab: { position: "absolute", alignSelf: "center", borderRadius: 28, overflow: "hidden", shadowColor: "#6355E8", shadowOpacity: 0.4, shadowRadius: 14, shadowOffset: { width: 0, height: 4 }, elevation: 10 },
  fabGrad: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 22, paddingVertical: 14 },
  fabText: { color: "#fff", fontSize: 15, fontWeight: "700", fontFamily: "Inter_700Bold" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingBottom: 36, maxHeight: "75%" },
  modalHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: "center", marginTop: 12, marginBottom: 16 },
  scanningState: { alignItems: "center", paddingVertical: 40, gap: 12 },
  scanningTitle: { fontSize: 18, fontWeight: "700", fontFamily: "Inter_700Bold" },
  scanningSub: { fontSize: 14, fontFamily: "Inter_400Regular" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: "800", fontFamily: "Inter_700Bold" },
  modalSub: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  closeBtn: { width: 32, height: 32, borderRadius: 16, justifyContent: "center", alignItems: "center" },
  itemList: { maxHeight: 260 },
  itemRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, borderBottomWidth: 1 },
  itemCheck: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, justifyContent: "center", alignItems: "center" },
  itemCheckOn: {},
  itemName: { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium" },
  itemAmt: { fontSize: 14, fontWeight: "700", fontFamily: "Inter_700Bold" },
  itemDim: { opacity: 0.4 },
  modalFooter: { paddingTop: 16, gap: 12 },
  totalRowModal: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  totalLabelModal: { fontSize: 14, fontFamily: "Inter_500Medium" },
  totalAmtModal: { fontSize: 20, fontWeight: "800", fontFamily: "Inter_700Bold" },
  addBtn: { borderRadius: 16, overflow: "hidden" },
  addBtnGrad: { height: 52, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8 },
  addBtnText: { color: "#fff", fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold" },
  catFieldLabel: { fontSize: 13, fontWeight: "600", fontFamily: "Inter_600SemiBold", marginBottom: 8, marginTop: 14 },
  catInput: {
    borderRadius: 12, paddingHorizontal: 14, height: 48,
    fontSize: 15, fontFamily: "Inter_400Regular",
    borderWidth: 1.5,
  },
  iconGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  iconOption: { width: 44, height: 44, borderRadius: 12, borderWidth: 2, justifyContent: "center", alignItems: "center" },
  colorRow: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  colorSwatch: { width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center" },
  colorSwatchSelected: { borderWidth: 3, borderColor: "#fff", shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  catPreview: {
    flexDirection: "row", alignItems: "center", gap: 12,
    borderRadius: 14, padding: 14,
    marginTop: 16, borderWidth: 1.5,
  },
  catPreviewName: { flex: 1, fontSize: 14, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  catPreviewBudget: { fontSize: 14, fontWeight: "700", fontFamily: "Inter_700Bold" },
  createCatBtn: { borderRadius: 16, overflow: "hidden", marginTop: 20, marginBottom: 8 },
  createCatGrad: { height: 52, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8 },
  createCatText: { color: "#fff", fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold" },
  emptyState: {
    alignItems: "center", gap: 8, padding: 28,
    borderRadius: 18,
    borderWidth: 1.5, borderStyle: "dashed",
  },
  emptyEmoji: { fontSize: 36 },
  emptyTitle: { fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold" },
  emptySub: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 18 },
  emptyBtn: { borderRadius: 14, overflow: "hidden", marginTop: 6, width: "100%" },
  emptyBtnGrad: { height: 46, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8 },
  emptyBtnText: { color: "#fff", fontSize: 14, fontWeight: "700", fontFamily: "Inter_700Bold" },
});
