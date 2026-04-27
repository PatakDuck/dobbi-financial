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

const GROQ_KEY = process.env["EXPO_PUBLIC_GROQ_KEY"] ?? "";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

const SYSTEM_PROMPT = `You are Dobbi, a Gen-Z financial assistant built for college students. You're like a smart friend who actually knows money — helpful, fun, and never preachy. You speak casually, keep replies short (3-5 sentences max), and use emojis occasionally.

You help with:
- Budgeting and tracking spending
- Finding student deals and discounts
- Saving money and hitting financial goals
- Understanding basic finance without the boring lecture

Rules:
- Never give long walls of text
- If someone is stressed about money, be supportive first, practical second
- Use "bestie", "fr", "no cap" occasionally but don't overdo it
- Always end with a follow-up question or action to keep the conversation going
- Never recommend specific stocks or crypto`;

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
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

      const response = await fetch(GROQ_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${GROQ_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...history,
          ],
          max_tokens: 200,
          temperature: 0.8,
        }),
        signal: abortRef.current.signal,
      });

      let replyContent: string;

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({})) as { error?: { message?: string } };
        console.log("[dobbi error]", response.status, errBody?.error?.message);
        replyContent = FALLBACK_REPLIES[Math.floor(Math.random() * FALLBACK_REPLIES.length)];
      } else {
        const data = (await response.json()) as { choices?: { message: { content: string } }[] };
        replyContent = data.choices?.[0]?.message?.content ?? FALLBACK_REPLIES[0];
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
