import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

const BUDGET_WARNINGS = [
  "okay real talk — you've used {pct}% of your {cat} budget 👀 maybe skip one takeout this week?",
  "bestie heads up! {cat} is at {pct}%. not judging but... you probably wanna slow down 💸",
  "not gonna lie, {cat} spending is getting spicy 🌶️ you're at {pct}%. let's keep it cute and on budget!",
  "hey! just saw your {cat} budget hit {pct}%. you got this — just be a little mindful for the rest of the week 💕",
  "quick check-in! {cat} is at {pct}% for the month. still totally manageable if you're a lil careful now 👊",
];

const GOAL_NUDGES = [
  "omg you're {pct}% of the way to '{goal}'!! you're literally crushing it 🎉",
  "okay '{goal}' is SO close bestie — {pct}% done! one more small push and you're there 💪",
  "just wanted to say you're doing amazing with '{goal}' — {pct}% in and still going strong 🌟",
  "real talk: {pct}% to '{goal}' is actually impressive. like I'm proud of you 💕",
];

const DAILY_CHECKINS = [
  "hey! just checking in 👋 have you tracked your spending today? takes like 30 seconds and future you will thank you",
  "quick question: did you eat out today? no judgment just... maybe check your food budget real quick 😅",
  "dobbi reminder: your streak is alive! one quick budget check keeps the momentum going 🔥",
  "bestie it's your daily money check-in! peek at your budget tab and see how you're doing this week 👀",
  "hi it's me, your bubbly money bestie 💕 just making sure you haven't forgotten about your goals today!",
  "fun money fact: people who track their spending save 20% more on average. you're literally one of them now 🎉",
];

const SAVING_TIPS = [
  "random dobbi tip 💡 if you haven't checked your student email for a .edu discount lately... do it. spotify, amazon, adobe — they're all waiting for you",
  "here's a thing: buying used textbooks on Facebook Marketplace or Chegg saves avg $150/semester. just saying 📚",
  "pro tip from your money bestie: most streaming services have student plans that are 40-50% cheaper. are you on one? 🎵",
  "okay this one's underrated — your school's library probably has free software (matlab, adobe, etc). check before you pay!",
  "if you're not on Amazon Prime Student yet... it's $7.49/mo with .edu email AND you get free delivery. worth it 📦",
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function fillTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? key);
}

export async function scheduleBudgetWarning(
  category: string,
  percentUsed: number
): Promise<void> {
  if (Platform.OS === "web") return;
  const template = pickRandom(BUDGET_WARNINGS);
  const body = fillTemplate(template, {
    pct: String(Math.round(percentUsed)),
    cat: category,
  });
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "dobbi 💕",
      body,
      sound: true,
    },
    trigger: null,
  });
}

export async function scheduleGoalNudge(
  goalName: string,
  percentDone: number
): Promise<void> {
  if (Platform.OS === "web") return;
  const template = pickRandom(GOAL_NUDGES);
  const body = fillTemplate(template, {
    pct: String(Math.round(percentDone)),
    goal: goalName,
  });
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "dobbi 🏆",
      body,
      sound: true,
    },
    trigger: null,
  });
}

export async function scheduleDailyCheckIn(): Promise<void> {
  if (Platform.OS === "web") return;
  await Notifications.cancelAllScheduledNotificationsAsync();
  const body = pickRandom(DAILY_CHECKINS);
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "dobbi 💕",
      body,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 10,
      minute: 0,
    },
  });
}

export async function scheduleRandomSavingTip(): Promise<void> {
  if (Platform.OS === "web") return;
  const body = pickRandom(SAVING_TIPS);
  const randomHour = 14 + Math.floor(Math.random() * 5);
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "dobbi tip 💡",
      body,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: randomHour,
      minute: Math.floor(Math.random() * 60),
    },
  });
}
