import React, { memo } from "react";
import { Box, Text } from "ink";
import type { Chat } from "../types";

interface ChatListProps {
  chats: Chat[];
  selectedChatId: string | null;
  onSelectChat: (chatId: string) => void;
  selectedIndex: number;
  isFocused: boolean;
}

function ChatListInner({ chats, selectedChatId, onSelectChat: _onSelectChat, selectedIndex, isFocused }: ChatListProps) {

  return (
    <Box flexDirection="column" borderStyle="single" borderColor={isFocused ? "cyan" : undefined} width={35}>
      <Box paddingX={1} borderStyle="single" borderBottom borderLeft={false} borderRight={false} borderTop={false}>
        <Text bold color={isFocused ? "cyan" : undefined}>Chats</Text>
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
                {chat.title.slice(0, 28)}
                {hasUnread ? ` (${chat.unreadCount})` : ""}
              </Text>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

export const ChatList = memo(ChatListInner);
