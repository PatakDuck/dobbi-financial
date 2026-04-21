import React, { createContext, useContext, useRef, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatContextType {
  messages: ChatMessage[];
  sendMessage: (text: string) => Promise<void>;
  isTyping: boolean;
}

const API_URL = process.env["EXPO_PUBLIC_API_URL"] ?? "";

const OPENER: ChatMessage = {
  id: "1",
  role: "assistant",
  content:
    "hey!! i'm Dobbi 💜 your personal money bestie\n\nnot gonna lie — most financial apps are kinda boring. i'm not that. i'm here to help you actually understand your money without the cringe advice.\n\nwhat's on your mind? budgeting, deals, savings goals — i got you 👇",
  timestamp: new Date(Date.now() - 60000 * 5),
};

const FALLBACK_REPLIES = [
  "okay no bc my brain just glitched 💀 try asking again?",
  "bestie something went sideways on my end rn 😭 give it a sec and ask again!",
  "not gonna lie i fumbled that one 💔 hit me again?",
];

const ChatContext = createContext<ChatContextType>({
  messages: [],
  sendMessage: async () => {},
  isTyping: false,
});

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([OPENER]);
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Load or create today's conversation when user signs in
  useEffect(() => {
    if (!user) {
      setMessages([OPENER]);
      setConversationId(null);
      return;
    }

    const loadConversation = async () => {
      const today = new Date().toISOString().split("T")[0];

      let { data: conv } = await supabase
        .from("conversations")
        .select("id")
        .eq("user_id", user.id)
        .gte("created_at", today)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!conv) {
        const { data: newConv } = await supabase
          .from("conversations")
          .insert({ user_id: user.id, title: "Dobbi Chat" })
          .select()
          .single();
        conv = newConv;
      }

      if (!conv) return;
      setConversationId(conv.id);

      const { data: rows } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conv.id)
        .order("created_at", { ascending: true });

      if (rows && rows.length > 0) {
        setMessages(
          rows.map((r) => ({
            id: r.id,
            role: r.role as "user" | "assistant",
            content: r.content,
            timestamp: new Date(r.created_at),
          }))
        );
      } else {
        setMessages([OPENER]);
      }
    };

    loadConversation();
  }, [user]);

  const persistMessage = async (convId: string, role: string, content: string) => {
    await supabase.from("messages").insert({ conversation_id: convId, role, content });
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isTyping) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: text.trim(),
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsTyping(true);

    if (conversationId) persistMessage(conversationId, "user", userMsg.content);

    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    try {
      const history = updatedMessages.slice(-12).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch(`${API_URL}/api/dobbi/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
        signal: abortRef.current.signal,
      });

      let replyContent: string;

      if (!response.ok) {
        replyContent = FALLBACK_REPLIES[Math.floor(Math.random() * FALLBACK_REPLIES.length)];
      } else {
        const data = (await response.json()) as { reply?: string; error?: string };
        replyContent = data.reply || data.error || FALLBACK_REPLIES[0];
      }

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: replyContent,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      if (conversationId) persistMessage(conversationId, "assistant", replyContent);
    } catch (err: unknown) {
      const isAbort = err instanceof Error && err.name === "AbortError";
      if (!isAbort) {
        const fallback = FALLBACK_REPLIES[Math.floor(Math.random() * FALLBACK_REPLIES.length)];
        setMessages((prev) => [
          ...prev,
          { id: (Date.now() + 1).toString(), role: "assistant", content: fallback, timestamp: new Date() },
        ]);
      }
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <ChatContext.Provider value={{ messages, sendMessage, isTyping }}>
      {children}
    </ChatContext.Provider>
  );
}

export const useChat = () => useContext(ChatContext);
