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
import { displayFont } from "@/constants/fonts";

const { width: SCREEN_W } = Dimensions.get("window");
// scroll paddingHorizontal:22 + card padding:16 = 38 per side = 76 total
const CHART_W = SCREEN_W - 76;

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
  { id: "food",      label: "Food & Drinks",  icon: "coffee",       amount: 247, budget: 300, color: "#E8704A" },
  { id: "transport", label: "Transport",       icon: "navigation",   amount: 63,  budget: 80,  color: "#5C8A6E" },
  { id: "shopping",  label: "Shopping",        icon: "shopping-bag", amount: 135, budget: 100, color: "#C9A961" },
  { id: "subs",      label: "Subscriptions",   icon: "repeat",       amount: 29,  budget: 40,  color: "#2A3FAE" },
  { id: "education", label: "Education",       icon: "book",         amount: 60,  budget: 100, color: "#7C6FF7" },
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
  { id: "t1", name: "Chipotle",        amount: 14.50, category: "food",      icon: "coffee",        dateGroup: "Today",      time: "2:34 PM",   isExpense: true },
  { id: "t2", name: "Uber",            amount: 8.00,  category: "transport", icon: "navigation",    dateGroup: "Today",      time: "11:20 AM",  isExpense: true },
  { id: "t3", name: "Target",          amount: 45.20, category: "shopping",  icon: "shopping-bag",  dateGroup: "Yesterday",  time: "3:15 PM",   isExpense: true },
  { id: "t4", name: "Starbucks",       amount: 6.50,  category: "food",      icon: "coffee",        dateGroup: "Yesterday",  time: "9:00 AM",   isExpense: true },
  { id: "t5", name: "Dining Hall",     amount: 12.00, category: "food",      icon: "coffee",        dateGroup: "Mon Apr 18", time: "12:30 PM",  isExpense: true },
  { id: "t6", name: "Spotify",         amount: 5.99,  category: "subs",      icon: "music",         dateGroup: "Mon Apr 18", time: "Auto-pay",  isExpense: true },
  { id: "t7", name: "Textbook rental", amount: 35.00, category: "education", icon: "book",          dateGroup: "Sat Apr 16", time: "1:00 PM",   isExpense: true },
  { id: "t8", name: "Instacart",       amount: 67.50, category: "food",      icon: "shopping-cart", dateGroup: "Fri Apr 15", time: "4:20 PM",   isExpense: true },
];

const CAT_COLORS: Record<string, string> = {
  food: "#E8704A", transport: "#5C8A6E", shopping: "#C9A961",
  subs: "#2A3FAE", education: "#7C6FF7",
};

const CAT_TIPS: Record<string, string> = {
  food:      "Food is your largest expense — small daily choices add up quickly.",
  shopping:  "Shopping is over budget this month.",
  transport: "Transport costs are higher than usual.",
  subs:      "Review your subscriptions for any you no longer use.",
  education: "Education expenses are a worthwhile investment.",
};

const SAVINGS_GOALS = [
  { id: "g1", name: "Thailand Trip",   saved: 340, target: 1200, monthly: 100, color: "#E8704A" },
  { id: "g2", name: "New MacBook",     saved: 680, target: 1500, monthly: 150, color: "#5C8A6E" },
  { id: "g3", name: "Emergency Fund",  saved: 200, target: 500,  monthly: 50,  color: "#C9A961" },
];

const ICON_OPTIONS = ["coffee", "shopping-bag", "music", "book", "heart", "home", "monitor", "gift", "truck", "scissors"];
const COLOR_OPTIONS = ["#E8704A", "#5C8A6E", "#C9A961", "#EF4444", "#2A3FAE", "#7C6FF7", "#EC4899", "#0EA5A0"];

function WeeklyBarChart({ data, primaryColor, barColor }: { data: typeof WEEKLY_SPEND; primaryColor: string; barColor: string }) {
  const maxAmt = Math.max(...data.map((d) => d.amount), 1);
  const valueH = 18;
  const maxBarH = 72;
  const dayH = 20;
  const totalH = valueH + maxBarH + dayH;
  const barPad = 5;
  const barW = (CHART_W - barPad * (data.length + 1)) / data.length;

  return (
    <Svg width={CHART_W} height={totalH}>
      {data.map((d, i) => {
        const barH = Math.max((d.amount / maxAmt) * maxBarH, 4);
        const x = barPad + i * (barW + barPad);
        const barY = valueH + (maxBarH - barH);
        return (
          <G key={i}>
            {/* Only show dollar label for today */}
            {d.today && (
              <SvgText x={x + barW / 2} y={valueH - 3} textAnchor="middle" fontSize={10}
                fill={primaryColor} fontWeight="bold">
                ${d.amount}
              </SvgText>
            )}
            <Rect x={x} y={barY} width={barW} height={barH} rx={4} ry={4}
              fill={d.today ? primaryColor : barColor} />
            <SvgText x={x + barW / 2} y={totalH - 3} textAnchor="middle" fontSize={11}
              fill={d.today ? primaryColor : "#9CA3AF"} fontWeight={d.today ? "bold" : "normal"}>
              {d.day}
            </SvgText>
          </G>
        );
      })}
    </Svg>
  );
}

function MonthlyTrendChart({ data, primaryColor }: { data: typeof MONTHLY_TREND; primaryColor: string }) {
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
  const areaColor = primaryColor + "14";

  return (
    <Svg width={CHART_W} height={totalH}>
      <Path d={areaPath} fill={areaColor} />
      <Path d={linePath} stroke={primaryColor} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <G key={i}>
          <Circle cx={p.x} cy={p.y} r={i === pts.length - 1 ? 5 : 3.5}
            fill={i === pts.length - 1 ? primaryColor : "#fff"}
            stroke={primaryColor} strokeWidth={2} />
          <SvgText x={p.x} y={totalH - 2} textAnchor="middle" fontSize={10}
            fill={i === pts.length - 1 ? primaryColor : "#9CA3AF"}
            fontWeight={i === pts.length - 1 ? "bold" : "normal"}>
            {data[i].month}
          </SvgText>
        </G>
      ))}
    </Svg>
  );
}

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

  const [scanModal, setScanModal] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [scanDone, setScanDone] = useState(false);
  const [scannedMerchant, setScannedMerchant] = useState("");

  const [catModal, setCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatIcon, setNewCatIcon] = useState("coffee");
  const [newCatColor, setNewCatColor] = useState("#E8704A");
  const [newCatBudget, setNewCatBudget] = useState("");

  const totalSpent = CATEGORIES_DISPLAY.reduce((s, c) => s + c.amount, 0);
  const baseBudget = baseCategories.reduce((s, c) => s + c.budget, 0);
  const totalBudget = CATEGORIES_DISPLAY.reduce((s, c) => s + c.budget, 0);
  const weeklyTotal = WEEKLY_SPEND.reduce((s, d) => s + d.amount, 0);
  const budgetPct = Math.min(Math.round((totalSpent / totalBudget) * 100), 100);
  const budgetLeft = baseBudget - totalSpent;

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
      Alert.alert("Scan failed", "Couldn't read the receipt. Try again with better lighting.");
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
    setNewCatName(""); setNewCatIcon("coffee"); setNewCatColor("#E8704A"); setNewCatBudget("");
    setCatModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const scannedTotal = scannedItems.filter((i) => i.selected).reduce((s, i) => s + i.amount, 0);

  return (
    <View style={[styles.root, { backgroundColor: tc.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 16, backgroundColor: tc.background, borderBottomColor: tc.border }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.eyebrow, { color: tc.primary }]}>April 2026</Text>
            <Text style={[styles.headerTitle, { color: tc.foreground }]}>Your spending</Text>
          </View>
          <View style={[styles.monthPill, { backgroundColor: tc.muted, borderColor: tc.border }]}>
            <Feather name="calendar" size={12} color={tc.mutedForeground} />
            <Text style={[styles.monthText, { color: tc.foreground }]}>Apr</Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero summary card */}
        <View style={styles.heroWrap}>
          <View style={[styles.heroCard, { backgroundColor: "#0E1A2B" }]}>
            <View style={styles.heroTop}>
              <View>
                <Text style={styles.heroLabel}>spent this month</Text>
                <Text style={styles.heroAmount}>${totalSpent}</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.heroLabel}>left</Text>
                <Text style={[styles.heroSubAmount, { color: budgetLeft >= 0 ? "#C8DBC8" : "#F87171" }]}>
                  ${Math.abs(budgetLeft)}
                </Text>
              </View>
            </View>
            <View style={styles.heroBudgetBar}>
              <View style={[styles.heroBudgetFill, { width: `${budgetPct}%` as any }]} />
            </View>
            <View style={styles.heroBudgetMeta}>
              <Text style={styles.heroBudgetLabel}>{budgetPct}% of ${totalBudget} budget</Text>
              <Text style={styles.heroBudgetLabel}>4 days left</Text>
            </View>
          </View>
        </View>

        {/* This week */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: tc.foreground }]}>This week</Text>
          <Text style={[styles.sectionSub, { color: tc.mutedForeground }]}>${weeklyTotal} spent</Text>
        </View>
        <View style={styles.section}>
          <View style={[styles.card, { backgroundColor: tc.card, borderColor: tc.border }]}>
            <WeeklyBarChart
              data={WEEKLY_SPEND}
              primaryColor={tc.primary}
              barColor={tc.isDark ? "rgba(255,255,255,0.1)" : "#E6DFD2"}
            />
          </View>
        </View>

        {/* 6-month trend */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: tc.foreground }]}>6-month trend</Text>
          <Text style={[styles.sectionSub, { color: tc.mutedForeground }]}>Nov → Apr</Text>
        </View>
        <View style={styles.section}>
          <View style={[styles.card, { backgroundColor: tc.card, borderColor: tc.border }]}>
            <MonthlyTrendChart data={MONTHLY_TREND} primaryColor={tc.primary} />
            <Text style={[styles.trendNote, { color: tc.mutedForeground }]}>
              April is your highest month — consider reducing discretionary spending.
            </Text>
          </View>
        </View>

        {/* Saving for */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: tc.foreground }]}>Saving for</Text>
          <Text style={[styles.sectionSub, { color: tc.mutedForeground }]}>{SAVINGS_GOALS.length} goals</Text>
        </View>
        <View style={styles.section}>
          {SAVINGS_GOALS.map((g) => {
            const pct = Math.min(Math.round((g.saved / g.target) * 100), 100);
            const monthsLeft = Math.ceil((g.target - g.saved) / g.monthly);
            return (
              <View key={g.id} style={[styles.goalCard, { backgroundColor: tc.card, borderColor: tc.border }]}>
                <View style={styles.goalRow}>
                  <View style={styles.goalInfo}>
                    <Text style={[styles.goalName, { color: tc.foreground }]}>{g.name}</Text>
                    <Text style={[styles.goalSub, { color: tc.mutedForeground }]}>
                      ${g.monthly}/mo · ~{monthsLeft} month{monthsLeft !== 1 ? "s" : ""} to go
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={[styles.goalPct, { color: g.color }]}>{pct}%</Text>
                    <Text style={[styles.goalAmt, { color: tc.mutedForeground }]}>${g.saved}/${g.target}</Text>
                  </View>
                </View>
                <View style={[styles.barTrack, { backgroundColor: tc.muted }]}>
                  <View style={[styles.barFill, { width: `${pct}%` as any, backgroundColor: g.color }]} />
                </View>
              </View>
            );
          })}
        </View>

        {/* By category */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: tc.foreground }]}>By category</Text>
          <TouchableOpacity
            style={[styles.addCatBtn, { backgroundColor: tc.secondary, borderColor: tc.border }]}
            onPress={() => setCatModal(true)}
            activeOpacity={0.7}
          >
            <Feather name="plus" size={13} color={tc.primary} />
            <Text style={[styles.addCatText, { color: tc.primary }]}>Add</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.section}>
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
                          <Text style={styles.overBadgeText}>over</Text>
                        </View>
                      )}
                    </View>
                    <View style={[styles.catBarTrack, { backgroundColor: tc.muted }]}>
                      <View style={[styles.catBarFill, { width: `${pct}%` as any, backgroundColor: over ? "#E8553E" : cat.color }]} />
                    </View>
                  </View>
                  <View style={styles.catAmounts}>
                    <Text style={[styles.catSpent, { color: over ? "#E8553E" : tc.foreground }]}>${cat.amount}</Text>
                    <Text style={[styles.catBudget, { color: tc.mutedForeground }]}>/${cat.budget}</Text>
                  </View>
                </View>
                {(over || pct > 70) && (
                  <Text style={[styles.catTip, { color: tc.mutedForeground }]}>
                    {CAT_TIPS[cat.id] ?? "Worth keeping an eye on."}
                  </Text>
                )}
              </View>
            );
          })}
        </View>

        {/* Transactions */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: tc.foreground }]}>Recent activity</Text>
          <Text style={[styles.sectionSub, { color: tc.mutedForeground }]}>{Object.values(txList).flat().length} entries</Text>
        </View>
        <View style={styles.section}>
          {Object.keys(txList).length === 0 && (
            <View style={[styles.emptyState, { backgroundColor: tc.card, borderColor: tc.border }]}>
              <Feather name="inbox" size={28} color={tc.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: tc.foreground }]}>No transactions yet</Text>
              <Text style={[styles.emptySub, { color: tc.mutedForeground }]}>Scan your first receipt to start tracking spending.</Text>
              <TouchableOpacity style={[styles.emptyBtn, { backgroundColor: tc.foreground }]} onPress={handleScanReceipt} activeOpacity={0.85}>
                <Feather name="camera" size={15} color={tc.onForeground} />
                <Text style={[styles.emptyBtnText, { color: tc.onForeground }]}>Scan a Receipt</Text>
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
                      <View style={[styles.txIcon, { backgroundColor: tc.muted, borderColor: tc.border, borderWidth: 1 }]}>
                        <Feather name={tx.icon as any} size={15} color={CAT_COLORS[tx.category] ?? tc.primary} />
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
                      <Text style={[styles.txAmount, { color: tc.foreground }]}>
                        {tx.isExpense ? "−" : "+"}${tx.amount.toFixed(2)}
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

      {/* Scan FAB */}
      <TouchableOpacity
        style={[styles.fab, { bottom: bottomPad + 82, backgroundColor: tc.foreground }]}
        onPress={handleScanReceipt}
        activeOpacity={0.85}
      >
        <Feather name="camera" size={18} color={tc.onForeground} />
        <Text style={[styles.fabText, { color: tc.onForeground }]}>Scan a receipt</Text>
      </TouchableOpacity>

      {/* Scan modal */}
      <Modal visible={scanModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: tc.isDark ? "#141428" : tc.card }]}>
            <View style={[styles.modalHandle, { backgroundColor: tc.border }]} />
            {scanning ? (
              <View style={styles.scanningState}>
                <ActivityIndicator size="large" color={tc.primary} />
                <Text style={[styles.scanningTitle, { color: tc.foreground }]}>Analyzing receipt...</Text>
                <Text style={[styles.scanningSub, { color: tc.mutedForeground }]}>Reading your receipt</Text>
              </View>
            ) : (
              <>
                <View style={styles.modalHeader}>
                  <View>
                    <Text style={[styles.modalTitle, { color: tc.foreground }]}>{scannedMerchant}</Text>
                    <Text style={[styles.modalSub, { color: tc.mutedForeground }]}>Select items to add to your budget</Text>
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
                      <View style={[styles.itemCheck, { borderColor: tc.border }, item.selected && { backgroundColor: tc.foreground, borderColor: tc.foreground }]}>
                        {item.selected && <Feather name="check" size={12} color={tc.onForeground} />}
                      </View>
                      <Text style={[styles.itemName, { color: tc.foreground }, !item.selected && styles.itemDim]}>{item.name}</Text>
                      <Text style={[styles.itemAmt, { color: tc.foreground }, !item.selected && styles.itemDim]}>${item.amount.toFixed(2)}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <View style={styles.modalFooter}>
                  <View style={styles.totalRowModal}>
                    <Text style={[styles.totalLabelModal, { color: tc.mutedForeground }]}>Total to add</Text>
                    <Text style={[styles.totalAmtModal, { color: tc.foreground }]}>${scannedTotal.toFixed(2)}</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.addBtn, { backgroundColor: tc.foreground }]}
                    onPress={handleAddTobudget}
                    activeOpacity={0.85}
                  >
                    <Feather name="plus-circle" size={17} color={tc.onForeground} />
                    <Text style={[styles.addBtnText, { color: tc.onForeground }]}>Add to Budget</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* New category modal */}
      <Modal visible={catModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: tc.isDark ? "#141428" : tc.card, maxHeight: "85%" }]}>
            <View style={[styles.modalHandle, { backgroundColor: tc.border }]} />
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: tc.foreground }]}>New Category</Text>
              <TouchableOpacity onPress={() => setCatModal(false)} style={[styles.closeBtn, { backgroundColor: tc.muted }]}>
                <Feather name="x" size={20} color={tc.mutedForeground} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.catFieldLabel, { color: tc.mutedForeground }]}>Category name</Text>
              <TextInput
                style={[styles.catInput, { backgroundColor: tc.muted, color: tc.foreground, borderColor: tc.border }]}
                placeholder="e.g. Gym & Fitness"
                placeholderTextColor={tc.mutedForeground}
                value={newCatName}
                onChangeText={setNewCatName}
              />
              <Text style={[styles.catFieldLabel, { color: tc.mutedForeground }]}>Monthly budget ($)</Text>
              <TextInput
                style={[styles.catInput, { backgroundColor: tc.muted, color: tc.foreground, borderColor: tc.border }]}
                placeholder="e.g. 60"
                placeholderTextColor={tc.mutedForeground}
                value={newCatBudget}
                onChangeText={setNewCatBudget}
                keyboardType="numeric"
              />
              <Text style={[styles.catFieldLabel, { color: tc.mutedForeground }]}>Icon</Text>
              <View style={styles.iconGrid}>
                {ICON_OPTIONS.map((icon) => (
                  <TouchableOpacity
                    key={icon}
                    style={[
                      styles.iconOption,
                      { borderColor: tc.border, backgroundColor: tc.muted },
                      newCatIcon === icon && { borderColor: newCatColor, backgroundColor: newCatColor + "18" },
                    ]}
                    onPress={() => setNewCatIcon(icon)}
                    activeOpacity={0.7}
                  >
                    <Feather name={icon as any} size={18} color={newCatIcon === icon ? newCatColor : tc.mutedForeground} />
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={[styles.catFieldLabel, { color: tc.mutedForeground }]}>Color</Text>
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
              {newCatName.trim() ? (
                <View style={[styles.catPreview, { backgroundColor: tc.muted, borderColor: newCatColor + "40" }]}>
                  <View style={[styles.catIcon, { backgroundColor: newCatColor + "18" }]}>
                    <Feather name={newCatIcon as any} size={16} color={newCatColor} />
                  </View>
                  <Text style={[styles.catPreviewName, { color: tc.foreground }]}>{newCatName}</Text>
                  <Text style={[styles.catPreviewBudget, { color: newCatColor }]}>${newCatBudget || "0"}/mo</Text>
                </View>
              ) : null}
              <TouchableOpacity
                style={[styles.createCatBtn, { backgroundColor: tc.foreground }]}
                onPress={handleAddCategory}
                activeOpacity={0.85}
              >
                <Feather name="plus" size={18} color={tc.onForeground} />
                <Text style={[styles.createCatText, { color: tc.onForeground }]}>Create Category</Text>
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
  header: {
    paddingHorizontal: 22,
    paddingBottom: 18,
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
  headerTitle: {
    fontSize: 30,
    fontWeight: "500",
    fontFamily: displayFont,
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  monthPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    marginTop: 4,
  },
  monthText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  scroll: { paddingHorizontal: 22, gap: 0 },
  heroWrap: { marginTop: 16, marginBottom: 4 },
  heroCard: {
    borderRadius: 22,
    padding: 22,
  },
  heroTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginBottom: 18 },
  heroLabel: { fontSize: 10, letterSpacing: 1.2, textTransform: "uppercase", fontWeight: "600", color: "rgba(245,239,230,0.55)", fontFamily: "Inter_600SemiBold", marginBottom: 6 },
  heroAmount: { fontSize: 44, fontFamily: displayFont, fontWeight: "400", color: "#F5EFE6", letterSpacing: -1, lineHeight: 48 },
  heroSubAmount: { fontSize: 22, fontFamily: displayFont, fontWeight: "400", letterSpacing: -0.5, marginTop: 2 },
  heroBudgetBar: { height: 4, backgroundColor: "rgba(245,239,230,0.15)", borderRadius: 2, overflow: "hidden", marginBottom: 10 },
  heroBudgetFill: { height: "100%", backgroundColor: "#F5EFE6", borderRadius: 2 },
  heroBudgetMeta: { flexDirection: "row", justifyContent: "space-between" },
  heroBudgetLabel: { fontSize: 11, color: "rgba(245,239,230,0.6)", fontFamily: "Inter_400Regular" },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginTop: 28,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 20, fontFamily: displayFont, fontWeight: "500", letterSpacing: -0.2 },
  sectionSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  section: { gap: 10 },
  card: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    shadowColor: "#0E1A2B",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  trendNote: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 10, fontStyle: "italic" },
  goalCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 10,
  },
  goalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  goalInfo: { flex: 1 },
  goalName: { fontSize: 14, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  goalSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  goalPct: { fontSize: 18, fontFamily: displayFont, fontWeight: "400" },
  goalAmt: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "right" },
  barTrack: { height: 5, borderRadius: 3, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 3 },
  addCatBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
  },
  addCatText: { fontSize: 12, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  catCard: { borderRadius: 16, padding: 14, borderWidth: 1 },
  catRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  catIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  catInfo: { flex: 1, gap: 7 },
  catLabelRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  catLabel: { fontSize: 14, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  overBadge: { backgroundColor: "#FDE8E8", borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  overBadgeText: { fontSize: 10, color: "#E8553E", fontWeight: "700", fontFamily: "Inter_700Bold" },
  catBarTrack: { height: 4, borderRadius: 2, overflow: "hidden" },
  catBarFill: { height: "100%", borderRadius: 2 },
  catAmounts: { alignItems: "flex-end" },
  catSpent: { fontSize: 14, fontWeight: "700", fontFamily: "Inter_700Bold" },
  catBudget: { fontSize: 11, fontFamily: "Inter_400Regular" },
  catTip: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 6 },
  dateGroup: {
    fontSize: 11,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 16,
  },
  txRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 6 },
  txIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  txInfo: { flex: 1 },
  txNameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  txName: { fontSize: 14, fontWeight: "500", fontFamily: "Inter_500Medium" },
  scannedBadge: { flexDirection: "row", alignItems: "center", gap: 3, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  scannedText: { fontSize: 9, fontWeight: "700", fontFamily: "Inter_700Bold" },
  txTime: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  txAmount: { fontSize: 14, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  txDivider: { height: 1, marginVertical: 4 },
  fab: {
    position: "absolute",
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 999,
    shadowColor: "#0E1A2B",
    shadowOpacity: 0.25,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
  },
  fabText: { fontSize: 15, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  emptyState: {
    alignItems: "center",
    gap: 10,
    padding: 32,
    borderRadius: 18,
    borderWidth: 1,
  },
  emptyTitle: { fontSize: 16, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  emptySub: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 18 },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 6,
  },
  emptyBtnText: { fontSize: 14, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingBottom: 36, maxHeight: "75%" },
  modalHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: "center", marginTop: 12, marginBottom: 16 },
  scanningState: { alignItems: "center", paddingVertical: 40, gap: 12 },
  scanningTitle: { fontSize: 18, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  scanningSub: { fontSize: 14, fontFamily: "Inter_400Regular" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  modalSub: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  closeBtn: { width: 32, height: 32, borderRadius: 16, justifyContent: "center", alignItems: "center" },
  itemList: { maxHeight: 260 },
  itemRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, borderBottomWidth: 1 },
  itemCheck: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, justifyContent: "center", alignItems: "center" },
  itemName: { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium" },
  itemAmt: { fontSize: 14, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  itemDim: { opacity: 0.4 },
  modalFooter: { paddingTop: 16, gap: 12 },
  totalRowModal: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  totalLabelModal: { fontSize: 14, fontFamily: "Inter_500Medium" },
  totalAmtModal: { fontSize: 20, fontFamily: displayFont, fontWeight: "400" },
  addBtn: { borderRadius: 14, height: 52, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8 },
  addBtnText: { fontSize: 16, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  catFieldLabel: { fontSize: 13, fontWeight: "600", fontFamily: "Inter_600SemiBold", marginBottom: 8, marginTop: 14 },
  catInput: {
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    borderWidth: 1,
  },
  iconGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  iconOption: { width: 44, height: 44, borderRadius: 12, borderWidth: 2, justifyContent: "center", alignItems: "center" },
  colorRow: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  colorSwatch: { width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center" },
  colorSwatchSelected: { borderWidth: 3, borderColor: "#fff", shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  catPreview: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 14, padding: 14, marginTop: 16, borderWidth: 1 },
  catPreviewName: { flex: 1, fontSize: 14, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  catPreviewBudget: { fontSize: 14, fontWeight: "700", fontFamily: "Inter_700Bold" },
  createCatBtn: { borderRadius: 14, height: 52, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 20, marginBottom: 8 },
  createCatText: { fontSize: 16, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
});
