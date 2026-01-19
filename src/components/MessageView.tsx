import React, { memo } from "react";
import { Box, Text } from "ink";
import type { Message } from "../types";

interface MessageViewProps {
  isFocused: boolean;
  selectedChatTitle: string | null;
  messages: Message[];
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function MessageViewInner({ isFocused, selectedChatTitle, messages: chatMessages }: MessageViewProps) {
  if (!selectedChatTitle) {
    return (
      <Box flexDirection="column" borderStyle="single" borderColor={isFocused ? "cyan" : undefined} flexGrow={1} justifyContent="center" alignItems="center">
        <Text dimColor>Select a chat to start</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" borderStyle="single" borderColor={isFocused ? "cyan" : undefined} flexGrow={1}>
      <Box paddingX={1} borderStyle="single" borderBottom borderLeft={false} borderRight={false} borderTop={false}>
        <Text bold color={isFocused ? "cyan" : undefined}>Chat: {selectedChatTitle}</Text>
      </Box>
      <Box flexDirection="column" paddingX={1} flexGrow={1} justifyContent="flex-end" overflow="hidden">
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

export const MessageView = memo(MessageViewInner);
