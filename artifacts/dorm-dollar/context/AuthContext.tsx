import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/lib/supabase";

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  xp: number;
  level: number;
  streak: number;
  badges: string[];
  savingsGoal: number;
  savedSoFar: number;
}

interface OnboardingAnswers {
  budgeting_skill?: string;
  main_use?: string;
  struggle?: string;
  savings_target?: string;
  top_spend?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  hasCompletedOnboarding: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  loginDemo: () => void;
  signup: (email: string, password: string, name: string) => Promise<{ error: string | null }>;
  logout: () => void;
  updateXP: (amount: number) => void;
  completeOnboarding: (answers: OnboardingAnswers) => Promise<void>;
}

const STORAGE_KEY_ONBOARDING = "dobbi_onboarding_done";

const DEMO_USER: User = {
  id: "demo",
  name: "Alex Rivera",
  email: "demo@dobbi.app",
  avatar: "🎓",
  xp: 1240,
  level: 4,
  streak: 7,
  badges: ["first-deal", "budget-pro", "saver-streak"],
  savingsGoal: 500,
  savedSoFar: 187,
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  hasCompletedOnboarding: false,
  login: async () => false,
  loginDemo: () => {},
  signup: async () => ({ error: null }),
  logout: () => {},
  updateXP: () => {},
  completeOnboarding: async () => {},
});

async function fetchProfile(userId: string, fallbackName?: string): Promise<User | null> {
  let { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  // Profile missing (trigger didn't run) — create it now
  if (!data) {
    const { data: created } = await supabase
      .from("profiles")
      .insert({ id: userId, name: fallbackName ?? "Student", avatar: "🎓" })
      .select()
      .single();
    data = created;
  }

  if (!data) return null;

  const { data: badges } = await supabase
    .from("badges")
    .select("badge_id")
    .eq("user_id", userId)
    .eq("unlocked", true);

  return {
    id: data.id,
    name: data.name,
    email: "",
    avatar: data.avatar,
    xp: data.xp,
    level: data.level,
    streak: 0,
    badges: badges?.map((b: { badge_id: string }) => b.badge_id) ?? [],
    savingsGoal: parseFloat(data.savings_goal),
    savedSoFar: parseFloat(data.saved_so_far),
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(false);

  useEffect(() => {
    const init = async () => {
      try {
        const onboarding = await AsyncStorage.getItem(STORAGE_KEY_ONBOARDING);
        if (onboarding === "true") setHasCompletedOnboarding(true);

        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const name = session.user.user_metadata?.name as string | undefined;
          const profile = await fetchProfile(session.user.id, name);
          if (profile) setUser({ ...profile, email: session.user.email ?? "" });
        }
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const name = session.user.user_metadata?.name as string | undefined;
        const profile = await fetchProfile(session.user.id, name);
        if (profile) setUser({ ...profile, email: session.user.email ?? "" });
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    console.log("[login]", { userId: data?.user?.id, error: error?.message, status: error?.status });
    return !error;
  };

  const loginDemo = () => {
    setUser(DEMO_USER);
    setHasCompletedOnboarding(true);
  };

  const signup = async (email: string, password: string, name: string): Promise<{ error: string | null }> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    console.log("[signup]", { userId: data?.user?.id, hasSession: !!data?.session, error: error?.message });
    if (error) return { error: error.message };
    if (!data.session) {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      console.log("[signup auto-login]", { userId: signInData?.user?.id, error: signInError?.message });
      if (signInError) return { error: "Email confirmation is required — please turn it off in Supabase dashboard (Authentication → Providers → Email → uncheck Confirm email)" };
    }
    return { error: null };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const updateXP = async (amount: number) => {
    if (!user) return;
    const newXP = user.xp + amount;
    const newLevel = Math.floor(newXP / 500) + 1;
    const updated: User = { ...user, xp: newXP, level: newLevel };
    setUser(updated);
    await supabase
      .from("profiles")
      .update({ xp: newXP, level: newLevel })
      .eq("id", user.id);
  };

  const completeOnboarding = async (answers: OnboardingAnswers) => {
    setHasCompletedOnboarding(true);
    await AsyncStorage.setItem(STORAGE_KEY_ONBOARDING, "true");
    await AsyncStorage.setItem("dobbi_onboarding_answers", JSON.stringify(answers));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        hasCompletedOnboarding,
        login,
        loginDemo,
        signup,
        logout,
        updateXP,
        completeOnboarding,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
