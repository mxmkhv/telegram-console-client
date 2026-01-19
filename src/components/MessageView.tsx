import React from "react";
import { Box, Text } from "ink";
import { useAppState } from "../state/context";

interface MessageViewProps {
  isFocused: boolean;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function MessageView({ isFocused: _isFocused }: MessageViewProps) {
  const { selectedChatId, messages, chats } = useAppState();
  const selectedChat = chats.find((c) => c.id === selectedChatId);
  const chatMessages = selectedChatId ? messages[selectedChatId] ?? [] : [];

  if (!selectedChatId) {
    return (
      <Box flexDirection="column" borderStyle="single" flexGrow={1} justifyContent="center" alignItems="center">
        <Text dimColor>Select a chat to start</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" borderStyle="single" flexGrow={1}>
      <Box paddingX={1} borderStyle="single" borderBottom borderLeft={false} borderRight={false} borderTop={false}>
        <Text bold>Chat: {selectedChat?.title ?? "Unknown"}</Text>
      </Box>
      <Box flexDirection="column" paddingX={1} flexGrow={1}>
        {chatMessages.map((msg) => (
          <Box key={msg.id}>
            <Text dimColor>[{formatTime(msg.timestamp)}] </Text>
            <Text bold color={msg.isOutgoing ? "cyan" : "white"}>
              {msg.isOutgoing ? "You" : msg.senderName}:
            </Text>
            <Text> {msg.text}</Text>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
