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
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useChat, ChatMessage } from "@/context/ChatContext";
import { useAuth } from "@/context/AuthContext";
import { DobbiCharacter } from "@/components/DobbiCharacter";
import { useColors } from "@/hooks/useColors";
import { displayFont } from "@/constants/fonts";

const QUICK_REPLIES = [
  "How can I save $50 this week?",
  "Explain my spending",
  "Best deals for me",
  "Help me plan the rest of the week",
  "Is this subscription worth it?",
];

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function MessageBubble({ msg, tc }: { msg: ChatMessage; tc: ReturnType<typeof useColors> }) {
  const isUser = msg.role === "user";
  return (
    <View style={[styles.bubbleRow, isUser ? styles.bubbleRowUser : styles.bubbleRowBot]}>
      {!isUser && (
        <View style={styles.botAvatarWrap}>
          <DobbiCharacter size="sm" mood="happy" />
        </View>
      )}
      <View style={[
        styles.bubble,
        isUser
          ? { backgroundColor: tc.foreground, borderBottomRightRadius: 4 }
          : { backgroundColor: tc.card, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: tc.border },
      ]}>
        <Text style={[
          styles.bubbleText,
          { color: isUser ? tc.onForeground : tc.foreground },
        ]}>
          {msg.content}
        </Text>
        <Text style={[
          styles.bubbleTime,
          { color: isUser ? (tc.isDark ? "rgba(10,11,21,0.45)" : "rgba(245,239,230,0.55)") : tc.mutedForeground, textAlign: isUser ? "right" : "left" },
        ]}>
          {formatTime(msg.timestamp)}
        </Text>
      </View>
    </View>
  );
}

function TypingIndicator({ tc }: { tc: ReturnType<typeof useColors> }) {
  return (
    <View style={[styles.bubbleRow, styles.bubbleRowBot]}>
      <View style={styles.botAvatarWrap}>
        <DobbiCharacter size="sm" mood="thinking" />
      </View>
      <View style={[styles.bubble, styles.typingBubble, { backgroundColor: tc.card, borderWidth: 1, borderColor: tc.border, borderBottomLeftRadius: 4 }]}>
        <View style={styles.typingDots}>
          <View style={[styles.dot, { backgroundColor: tc.mutedForeground, opacity: 0.35 }]} />
          <View style={[styles.dot, { backgroundColor: tc.mutedForeground, opacity: 0.65 }]} />
          <View style={[styles.dot, { backgroundColor: tc.mutedForeground, opacity: 1 }]} />
        </View>
      </View>
    </View>
  );
}

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const tc = useColors();
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
    <View style={[styles.root, { backgroundColor: tc.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding + 10, backgroundColor: tc.background, borderBottomColor: tc.border }]}>
        <View style={styles.headerInner}>
          <View style={[styles.dobbiAvatar, { backgroundColor: "#0E1A2B" }]}>
            <Text style={[styles.dobbiInitial, { color: "#F5EFE6", fontFamily: displayFont }]}>D</Text>
          </View>
          <View style={styles.headerText}>
            <Text style={[styles.headerName, { color: tc.foreground, fontFamily: displayFont }]}>Dobbi</Text>
            <View style={styles.onlineRow}>
              <View style={[styles.onlineDot, { backgroundColor: tc.green }]} />
              <Text style={[styles.onlineLabel, { color: tc.mutedForeground }]}>
                your money coach
                {(user?.streak ?? 0) > 0 ? ` · ${user?.streak}d streak` : ""}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={[styles.optionsBtn, { backgroundColor: tc.muted, borderColor: tc.border }]}>
            <Feather name="more-horizontal" size={16} color={tc.mutedForeground} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatRef}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => <MessageBubble msg={item} tc={tc} />}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: true })}
          ListFooterComponent={isTyping ? <TypingIndicator tc={tc} /> : null}
        />

        {/* Input area */}
        <View style={[styles.bottomArea, { paddingBottom: bottomPad + 80, backgroundColor: tc.background, borderTopColor: tc.border }]}>
          {/* Quick replies */}
          <FlatList
            data={QUICK_REPLIES}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(i) => i}
            contentContainerStyle={styles.quickBar}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.quickPill, { backgroundColor: tc.muted, borderColor: tc.border }]}
                onPress={() => handleQuick(item)}
                activeOpacity={0.75}
              >
                <Text style={[styles.quickText, { color: tc.foreground }]}>{item}</Text>
              </TouchableOpacity>
            )}
          />

          {/* Text input row */}
          <View style={styles.inputRow}>
            <View style={[styles.inputWrap, { backgroundColor: tc.card, borderColor: tc.border }]}>
              <Feather name="message-circle" size={16} color={tc.mutedForeground} />
              <TextInput
                style={[styles.input, { color: tc.foreground }]}
                value={input}
                onChangeText={setInput}
                placeholder="Ask Dobbi anything..."
                placeholderTextColor={tc.mutedForeground}
                returnKeyType="send"
                onSubmitEditing={handleSend}
                multiline
              />
            </View>
            <TouchableOpacity
              style={[
                styles.sendBtn,
                { backgroundColor: (!input.trim() || isTyping) ? tc.muted : tc.foreground },
              ]}
              onPress={handleSend}
              disabled={!input.trim() || isTyping}
              activeOpacity={0.8}
            >
              {isTyping ? (
                <ActivityIndicator size="small" color={tc.mutedForeground} />
              ) : (
                <Feather name="arrow-up" size={17} color={(!input.trim() || isTyping) ? tc.mutedForeground : tc.onForeground} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  header: {
    paddingHorizontal: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dobbiAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  dobbiInitial: {
    fontSize: 18,
    fontWeight: "500",
  },
  headerText: { flex: 1 },
  headerName: {
    fontSize: 20,
    fontWeight: "500",
    letterSpacing: -0.3,
  },
  onlineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 2,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  onlineLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  optionsBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
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
  bubbleText: {
    fontSize: 14,
    lineHeight: 21,
    fontFamily: "Inter_400Regular",
  },
  bubbleTime: {
    fontSize: 10,
    marginTop: 4,
    fontFamily: "Inter_400Regular",
  },
  typingBubble: { paddingVertical: 14 },
  typingDots: {
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  bottomArea: {
    borderTopWidth: 1,
    paddingTop: 10,
  },
  quickBar: {
    paddingHorizontal: 14,
    gap: 7,
    paddingBottom: 10,
  },
  quickPill: {
    borderRadius: 20,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderWidth: 1,
  },
  quickText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 14,
    paddingBottom: 8,
    gap: 9,
  },
  inputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 44,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
});
