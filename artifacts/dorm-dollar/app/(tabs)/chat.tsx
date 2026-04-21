import React, { useState, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useChat, ChatMessage } from "@/context/ChatContext";
import { useAuth } from "@/context/AuthContext";
import { DobbiCharacter } from "@/components/DobbiCharacter";
import colors from "@/constants/colors";

// Gen Z quick replies — casual, action-oriented, varied
const QUICK_REPLIES = [
  "fr how do i budget 💀",
  "best student deals rn?",
  "help me save money no cap",
  "my spending is cooked 😭",
  "is this subscription worth it?",
  "side hustle ideas pls",
];

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";
  return (
    <View
      style={[
        styles.bubbleRow,
        isUser ? styles.bubbleRowUser : styles.bubbleRowBot,
      ]}
    >
      {!isUser && (
        <View style={styles.botAvatarWrap}>
          <DobbiCharacter size="sm" mood="happy" />
        </View>
      )}
      <View
        style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleBot]}
      >
        <Text
          style={[
            styles.bubbleText,
            isUser ? styles.bubbleTextUser : styles.bubbleTextBot,
          ]}
        >
          {msg.content}
        </Text>
        <Text
          style={[
            styles.bubbleTime,
            isUser ? styles.bubbleTimeUser : styles.bubbleTimeBot,
          ]}
        >
          {formatTime(msg.timestamp)}
        </Text>
      </View>
    </View>
  );
}

function TypingIndicator() {
  return (
    <View style={[styles.bubbleRow, styles.bubbleRowBot]}>
      <View style={styles.botAvatarWrap}>
        <DobbiCharacter size="sm" mood="thinking" />
      </View>
      <View style={[styles.bubble, styles.bubbleBot, styles.typingBubble]}>
        <View style={styles.typingDots}>
          <View style={[styles.dot, { opacity: 0.35 }]} />
          <View style={[styles.dot, { opacity: 0.65 }]} />
          <View style={[styles.dot, { opacity: 1 }]} />
        </View>
      </View>
    </View>
  );
}

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { messages, sendMessage, isTyping } = useChat();
  const [input, setInput] = useState<string>("");
  const flatRef = useRef<FlatList>(null);

  const topPadding = Platform.OS === "web" ? insets.top + 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? insets.bottom + 34 : insets.bottom;

  const handleSend = () => {
    if (!input.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    sendMessage(input.trim());
    setInput("");
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const handleQuick = (text: string) => {
    sendMessage(text);
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
  };

  return (
    <View style={styles.root}>
      {/* ── Header ── */}
      <LinearGradient
        colors={["#2D1B69", "#3D2A8A"]}
        style={[styles.header, { paddingTop: topPadding + 10 }]}
      >
        <View style={styles.headerInner}>
          <DobbiCharacter size="sm" mood="excited" />
          <View style={styles.headerText}>
            <Text style={styles.headerName}>Dobbi</Text>
            <View style={styles.onlineRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineLabel}>your money bestie</Text>
            </View>
          </View>
          <View style={styles.streakPill}>
            <Feather name="zap" size={12} color={colors.light.gold} />
            <Text style={styles.streakText}>{user?.streak ?? 0}d streak</Text>
          </View>
        </View>
      </LinearGradient>

      {/* ── Messages ── */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatRef}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => <MessageBubble msg={item} />}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() =>
            flatRef.current?.scrollToEnd({ animated: true })
          }
          ListFooterComponent={isTyping ? <TypingIndicator /> : null}
        />

        {/* ── Input area ── */}
        <View style={[styles.bottomArea, { paddingBottom: bottomPad + 80 }]}>
          {/* Quick replies */}
          <FlatList
            data={QUICK_REPLIES}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(i) => i}
            contentContainerStyle={styles.quickBar}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.quickPill}
                onPress={() => handleQuick(item)}
                activeOpacity={0.75}
              >
                <Text style={styles.quickText}>{item}</Text>
              </TouchableOpacity>
            )}
          />

          {/* Text input row */}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder="Ask Dobbi anything..."
              placeholderTextColor={colors.light.mutedForeground}
              returnKeyType="send"
              onSubmitEditing={handleSend}
              multiline
            />
            <TouchableOpacity
              style={[
                styles.sendBtn,
                (!input.trim() || isTyping) && styles.sendBtnDisabled,
              ]}
              onPress={handleSend}
              disabled={!input.trim() || isTyping}
              activeOpacity={0.8}
            >
              {isTyping ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Feather name="send" size={17} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.light.background },
  flex: { flex: 1 },

  // Header
  header: {
    paddingHorizontal: 18,
    paddingBottom: 14,
  },
  headerInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerText: { flex: 1 },
  headerName: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
  },
  onlineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 2,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#4ADE80",
  },
  onlineLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    fontFamily: "Inter_400Regular",
  },
  streakPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 4,
  },
  streakText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },

  // Messages
  messageList: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 6,
  },
  bubbleRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginVertical: 2,
    gap: 8,
  },
  bubbleRowUser: { justifyContent: "flex-end" },
  bubbleRowBot: { justifyContent: "flex-start" },
  botAvatarWrap: {},
  bubble: {
    maxWidth: "76%",
    borderRadius: 18,
    padding: 12,
    paddingBottom: 8,
  },
  bubbleUser: {
    backgroundColor: colors.light.primary,
    borderBottomRightRadius: 4,
  },
  bubbleBot: {
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.light.border,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 21,
    fontFamily: "Inter_400Regular",
  },
  bubbleTextUser: { color: "#FFFFFF" },
  bubbleTextBot: { color: colors.light.foreground },
  bubbleTime: {
    fontSize: 10,
    marginTop: 4,
    fontFamily: "Inter_400Regular",
  },
  bubbleTimeUser: { color: "rgba(255,255,255,0.55)", textAlign: "right" },
  bubbleTimeBot: { color: colors.light.mutedForeground },
  typingBubble: { paddingVertical: 14 },
  typingDots: {
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.light.primary,
  },

  // Input area
  bottomArea: {
    borderTopWidth: 1,
    borderTopColor: colors.light.border,
    backgroundColor: colors.light.card,
    paddingTop: 10,
  },
  quickBar: {
    paddingHorizontal: 14,
    gap: 7,
    paddingBottom: 8,
  },
  quickPill: {
    backgroundColor: colors.light.secondary,
    borderRadius: 20,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderWidth: 1.5,
    borderColor: "#D8D3FA",
  },
  quickText: {
    fontSize: 13,
    color: colors.light.primary,
    fontFamily: "Inter_500Medium",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 14,
    paddingBottom: 8,
    gap: 9,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    backgroundColor: colors.light.muted,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: colors.light.foreground,
    borderWidth: 1.5,
    borderColor: colors.light.border,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.light.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  sendBtnDisabled: {
    backgroundColor: "#C4BAF8",
  },
});
