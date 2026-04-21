import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export interface Transaction {
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

export interface BudgetCategory {
  id: string;
  label: string;
  icon: string;
  amount: number;   // spent this month (computed from transactions)
  budget: number;
  color: string;
}

function toDateGroup(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export function useTransactions() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const [txResult, catResult] = await Promise.all([
      supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("txn_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("budget_categories")
        .select("*")
        .eq("user_id", user.id),
    ]);

    if (txResult.data) {
      setTransactions(
        txResult.data.map((row) => ({
          id: row.id,
          name: row.name,
          amount: parseFloat(row.amount),
          category: row.category,
          icon: row.icon,
          dateGroup: toDateGroup(row.txn_date),
          time: row.txn_time,
          isExpense: row.is_expense,
          scanned: row.scanned,
        }))
      );
    }

    if (catResult.data) {
      // Compute amount spent this month per category from transactions
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];

      const { data: monthlyTx } = await supabase
        .from("transactions")
        .select("category, amount")
        .eq("user_id", user.id)
        .eq("is_expense", true)
        .gte("txn_date", monthStart);

      const spentByCategory: Record<string, number> = {};
      for (const tx of monthlyTx ?? []) {
        spentByCategory[tx.category] = (spentByCategory[tx.category] ?? 0) + parseFloat(tx.amount);
      }

      setCategories(
        catResult.data.map((row) => ({
          id: row.category_id,
          label: row.label,
          icon: row.icon,
          amount: Math.round((spentByCategory[row.category_id] ?? 0) * 100) / 100,
          budget: parseFloat(row.budget),
          color: row.color,
        }))
      );
    }

    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const addTransaction = async (tx: Omit<Transaction, "id" | "dateGroup">) => {
    if (!user) return;
    const { data, error } = await supabase
      .from("transactions")
      .insert({
        user_id: user.id,
        name: tx.name,
        amount: tx.amount,
        category: tx.category,
        icon: tx.icon,
        txn_date: new Date().toISOString().split("T")[0],
        txn_time: tx.time,
        is_expense: tx.isExpense,
        scanned: tx.scanned ?? false,
      })
      .select()
      .single();

    if (!error && data) {
      const newTx: Transaction = {
        id: data.id,
        name: data.name,
        amount: parseFloat(data.amount),
        category: data.category,
        icon: data.icon,
        dateGroup: "Today",
        time: data.txn_time,
        isExpense: data.is_expense,
        scanned: data.scanned,
      };
      setTransactions((prev) => [newTx, ...prev]);
    }
  };

  return { transactions, categories, loading, addTransaction, reload: load };
}
