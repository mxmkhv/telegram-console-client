import { describe, it, expect } from "bun:test";
import { render } from "ink-testing-library";
import React from "react";
import { ChatList } from "./ChatList";
import type { Chat } from "../types";

const mockChats: Chat[] = [
  {
    id: "1",
    title: "John Doe",
    unreadCount: 0,
    isGroup: false,
  },
  {
    id: "2",
    title: "Jane Smith",
    unreadCount: 3,
    isGroup: false,
  },
  {
    id: "3",
    title: "Work Group",
    unreadCount: 0,
    isGroup: true,
  },
];

describe("ChatList", () => {
  it("renders correctly when focused", () => {
    const { lastFrame } = render(
      <ChatList
        chats={mockChats}
        selectedChatId="1"
        onSelectChat={() => {}}
        selectedIndex={0}
        isFocused={true}
      />
    );
    expect(lastFrame()).toMatchSnapshot();
  });

  it("renders correctly when unfocused", () => {
    const { lastFrame } = render(
      <ChatList
        chats={mockChats}
        selectedChatId="1"
        onSelectChat={() => {}}
        selectedIndex={0}
        isFocused={false}
      />
    );
    expect(lastFrame()).toMatchSnapshot();
  });

  it("renders chat with unread indicator in cyan", () => {
    const { lastFrame } = render(
      <ChatList
        chats={mockChats}
        selectedChatId="2"
        onSelectChat={() => {}}
        selectedIndex={1}
        isFocused={true}
      />
    );
    expect(lastFrame()).toMatchSnapshot();
  });

  it("renders empty chat list", () => {
    const { lastFrame } = render(
      <ChatList
        chats={[]}
        selectedChatId={null}
        onSelectChat={() => {}}
        selectedIndex={0}
        isFocused={true}
      />
    );
    expect(lastFrame()).toMatchSnapshot();
  });
});
