import React from "react";
import { Box, Text } from "ink";
import { useAppState } from "../state/context";

interface ChatListProps {
  onSelectChat: (chatId: string) => void;
  selectedIndex: number;
  isFocused: boolean;
}

export function ChatList({ onSelectChat: _onSelectChat, selectedIndex, isFocused }: ChatListProps) {
  const { chats, selectedChatId } = useAppState();

  return (
    <Box flexDirection="column" borderStyle="single" width={20}>
      <Box paddingX={1} borderStyle="single" borderBottom borderLeft={false} borderRight={false} borderTop={false}>
        <Text bold>Chats</Text>
      </Box>
      <Box flexDirection="column" paddingX={1}>
        {chats.map((chat, index) => {
          const isSelected = index === selectedIndex && isFocused;
          const isActive = chat.id === selectedChatId;
          const hasUnread = chat.unreadCount > 0;

          return (
            <Box key={chat.id}>
              <Text
                inverse={isSelected}
                bold={hasUnread || isActive}
                color={isActive ? "cyan" : undefined}
              >
                {hasUnread ? "● " : "  "}
                {chat.title.slice(0, 14)}
                {hasUnread ? ` (${chat.unreadCount})` : ""}
              </Text>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
