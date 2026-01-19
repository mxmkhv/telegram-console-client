# telegram-console-client Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a terminal-based Telegram client with split-panel TUI, installable via npm.

**Architecture:** 4-layer design — Ink UI components → React Context state → GramJS service wrapper → Config/Session storage. Setup flow handles credentials and auth before main app renders.

**Tech Stack:** TypeScript, GramJS, Ink (React), Bun (dev), Node.js 18+ (prod)

---

## Phase 1: Project Foundation

### Task 1: Initialize Project

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `src/index.tsx`

**Step 1: Initialize package.json**

Run:
```bash
bun init -y
```

**Step 2: Install dependencies**

Run:
```bash
bun add telegram ink react ink-text-input qrcode-terminal conf
bun add -d typescript @types/react @types/node
```

**Step 3: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": "src",
    "declaration": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Step 4: Create minimal entry point**

Create `src/index.tsx`:
```tsx
#!/usr/bin/env node
import { render, Text } from "ink";

function App() {
  return <Text>telegram-console-client</Text>;
}

render(<App />);
```

**Step 5: Add package.json scripts and bin**

Update `package.json` to include:
```json
{
  "name": "telegram-console-client",
  "type": "module",
  "bin": {
    "telegram-console-client": "./dist/index.js"
  },
  "scripts": {
    "dev": "bun run src/index.tsx",
    "build": "bun build src/index.tsx --outdir dist --target node",
    "test": "bun test"
  }
}
```

**Step 6: Verify it runs**

Run: `bun run dev`
Expected: Shows "telegram-console-client" in terminal

**Step 7: Commit**

```bash
git init && git add -A && git commit -m "chore: initialize project with Ink + TypeScript"
```

---

### Task 2: Config Module with Tests

**Files:**
- Create: `src/config/index.ts`
- Create: `src/config/index.test.ts`
- Create: `src/types/index.ts`

**Step 1: Write failing test for config types**

Create `src/types/index.ts`:
```typescript
export type LogLevel = "quiet" | "info" | "verbose";
export type SessionMode = "persistent" | "ephemeral";
export type AuthMethod = "qr" | "phone";

export interface AppConfig {
  apiId: number;
  apiHash: string;
  sessionPersistence: SessionMode;
  logLevel: LogLevel;
  authMethod: AuthMethod;
}
```

Create `src/config/index.test.ts`:
```typescript
import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { loadConfig, saveConfig, getConfigPath, hasConfig } from "./index";
import { rmSync, mkdirSync } from "fs";
import { join } from "path";

const TEST_CONFIG_DIR = join(import.meta.dir, "../../.test-config");

describe("Config", () => {
  beforeEach(() => {
    mkdirSync(TEST_CONFIG_DIR, { recursive: true });
  });

  afterEach(() => {
    rmSync(TEST_CONFIG_DIR, { recursive: true, force: true });
  });

  it("returns false when no config exists", () => {
    expect(hasConfig(TEST_CONFIG_DIR)).toBe(false);
  });

  it("saves and loads config", () => {
    const config = {
      apiId: 12345,
      apiHash: "abc123",
      sessionPersistence: "persistent" as const,
      logLevel: "info" as const,
      authMethod: "qr" as const,
    };

    saveConfig(config, TEST_CONFIG_DIR);
    expect(hasConfig(TEST_CONFIG_DIR)).toBe(true);

    const loaded = loadConfig(TEST_CONFIG_DIR);
    expect(loaded).toEqual(config);
  });

  it("returns correct config path", () => {
    const path = getConfigPath(TEST_CONFIG_DIR);
    expect(path).toContain("config.json");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun test src/config`
Expected: FAIL — module not found

**Step 3: Implement config module**

Create `src/config/index.ts`:
```typescript
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import type { AppConfig } from "../types";

const CONFIG_FILENAME = "config.json";
const DEFAULT_CONFIG_DIR = join(homedir(), ".config", "telegram-console-client");

export function getConfigDir(customDir?: string): string {
  return customDir ?? DEFAULT_CONFIG_DIR;
}

export function getConfigPath(customDir?: string): string {
  return join(getConfigDir(customDir), CONFIG_FILENAME);
}

export function hasConfig(customDir?: string): boolean {
  return existsSync(getConfigPath(customDir));
}

export function loadConfig(customDir?: string): AppConfig | null {
  const path = getConfigPath(customDir);
  if (!existsSync(path)) return null;

  const content = readFileSync(path, "utf-8");
  return JSON.parse(content) as AppConfig;
}

export function saveConfig(config: AppConfig, customDir?: string): void {
  const dir = getConfigDir(customDir);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  const path = getConfigPath(customDir);
  writeFileSync(path, JSON.stringify(config, null, 2));
}

export function loadConfigWithEnvOverrides(customDir?: string): AppConfig | null {
  const config = loadConfig(customDir);
  if (!config) return null;

  return {
    ...config,
    apiId: process.env.TG_API_ID ? parseInt(process.env.TG_API_ID, 10) : config.apiId,
    apiHash: process.env.TG_API_HASH ?? config.apiHash,
    sessionPersistence: (process.env.TG_SESSION_MODE as AppConfig["sessionPersistence"]) ?? config.sessionPersistence,
    logLevel: (process.env.TG_LOG_LEVEL as AppConfig["logLevel"]) ?? config.logLevel,
    authMethod: (process.env.TG_AUTH_METHOD as AppConfig["authMethod"]) ?? config.authMethod,
  };
}
```

**Step 4: Run test to verify it passes**

Run: `bun test src/config`
Expected: PASS

**Step 5: Commit**

```bash
git add -A && git commit -m "feat: add config module with tests"
```

---

### Task 3: Environment Variable Override Tests

**Files:**
- Modify: `src/config/index.test.ts`

**Step 1: Add env override test**

Add to `src/config/index.test.ts`:
```typescript
describe("Environment Overrides", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    mkdirSync(TEST_CONFIG_DIR, { recursive: true });
  });

  afterEach(() => {
    process.env = originalEnv;
    rmSync(TEST_CONFIG_DIR, { recursive: true, force: true });
  });

  it("overrides config with environment variables", () => {
    const config = {
      apiId: 12345,
      apiHash: "abc123",
      sessionPersistence: "persistent" as const,
      logLevel: "info" as const,
      authMethod: "qr" as const,
    };
    saveConfig(config, TEST_CONFIG_DIR);

    process.env.TG_API_ID = "99999";
    process.env.TG_LOG_LEVEL = "verbose";

    const loaded = loadConfigWithEnvOverrides(TEST_CONFIG_DIR);
    expect(loaded?.apiId).toBe(99999);
    expect(loaded?.logLevel).toBe("verbose");
    expect(loaded?.apiHash).toBe("abc123"); // unchanged
  });
});
```

**Step 2: Run test to verify it passes**

Run: `bun test src/config`
Expected: PASS (already implemented)

**Step 3: Commit**

```bash
git add -A && git commit -m "test: add environment override tests"
```

---

## Phase 2: Telegram Service Layer

### Task 4: Telegram Service Types

**Files:**
- Modify: `src/types/index.ts`

**Step 1: Add Telegram service types**

Add to `src/types/index.ts`:
```typescript
export type ConnectionState = "disconnected" | "connecting" | "connected";

export interface Chat {
  id: string;
  title: string;
  unreadCount: number;
  lastMessage?: Message;
  isGroup: boolean;
}

export interface Message {
  id: number;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: Date;
  isOutgoing: boolean;
}

export interface TelegramService {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  getConnectionState(): ConnectionState;
  getChats(): Promise<Chat[]>;
  getMessages(chatId: string, limit?: number): Promise<Message[]>;
  sendMessage(chatId: string, text: string): Promise<Message>;
  onConnectionStateChange(callback: (state: ConnectionState) => void): void;
  onNewMessage(callback: (message: Message, chatId: string) => void): void;
}
```

**Step 2: Commit**

```bash
git add -A && git commit -m "feat: add Telegram service types"
```

---

### Task 5: Telegram Service Mock for Testing

**Files:**
- Create: `src/services/telegram.mock.ts`
- Create: `src/services/telegram.mock.test.ts`

**Step 1: Write failing test**

Create `src/services/telegram.mock.test.ts`:
```typescript
import { describe, it, expect } from "bun:test";
import { createMockTelegramService } from "./telegram.mock";

describe("MockTelegramService", () => {
  it("starts disconnected", () => {
    const service = createMockTelegramService();
    expect(service.getConnectionState()).toBe("disconnected");
  });

  it("connects and returns connected state", async () => {
    const service = createMockTelegramService();
    await service.connect();
    expect(service.getConnectionState()).toBe("connected");
  });

  it("returns mock chats", async () => {
    const service = createMockTelegramService();
    await service.connect();
    const chats = await service.getChats();
    expect(chats.length).toBeGreaterThan(0);
    expect(chats[0]).toHaveProperty("id");
    expect(chats[0]).toHaveProperty("title");
  });

  it("returns mock messages for a chat", async () => {
    const service = createMockTelegramService();
    await service.connect();
    const chats = await service.getChats();
    const messages = await service.getMessages(chats[0].id);
    expect(messages.length).toBeGreaterThan(0);
    expect(messages[0]).toHaveProperty("text");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun test src/services/telegram.mock`
Expected: FAIL — module not found

**Step 3: Implement mock service**

Create `src/services/telegram.mock.ts`:
```typescript
import type { TelegramService, ConnectionState, Chat, Message } from "../types";

const MOCK_CHATS: Chat[] = [
  { id: "1", title: "John Doe", unreadCount: 2, isGroup: false },
  { id: "2", title: "Jane Smith", unreadCount: 0, isGroup: false },
  { id: "3", title: "Work Group", unreadCount: 5, isGroup: true },
  { id: "4", title: "Family", unreadCount: 0, isGroup: true },
];

const MOCK_MESSAGES: Record<string, Message[]> = {
  "1": [
    { id: 1, senderId: "1", senderName: "John", text: "Hey, how are you?", timestamp: new Date("2026-01-19T10:30:00"), isOutgoing: false },
    { id: 2, senderId: "me", senderName: "You", text: "I'm good, thanks!", timestamp: new Date("2026-01-19T10:31:00"), isOutgoing: true },
    { id: 3, senderId: "1", senderName: "John", text: "Great to hear", timestamp: new Date("2026-01-19T10:32:00"), isOutgoing: false },
  ],
  "2": [
    { id: 1, senderId: "2", senderName: "Jane", text: "Meeting at 3pm?", timestamp: new Date("2026-01-19T09:00:00"), isOutgoing: false },
  ],
  "3": [
    { id: 1, senderId: "3", senderName: "Bob", text: "Project update ready", timestamp: new Date("2026-01-19T08:00:00"), isOutgoing: false },
  ],
  "4": [
    { id: 1, senderId: "4", senderName: "Mom", text: "Dinner on Sunday?", timestamp: new Date("2026-01-18T18:00:00"), isOutgoing: false },
  ],
};

export function createMockTelegramService(): TelegramService {
  let connectionState: ConnectionState = "disconnected";
  let connectionCallback: ((state: ConnectionState) => void) | null = null;
  let messageCallback: ((message: Message, chatId: string) => void) | null = null;

  return {
    async connect() {
      connectionState = "connecting";
      connectionCallback?.(connectionState);
      await new Promise((r) => setTimeout(r, 100));
      connectionState = "connected";
      connectionCallback?.(connectionState);
    },

    async disconnect() {
      connectionState = "disconnected";
      connectionCallback?.(connectionState);
    },

    getConnectionState() {
      return connectionState;
    },

    async getChats() {
      return [...MOCK_CHATS];
    },

    async getMessages(chatId: string, limit = 50) {
      return (MOCK_MESSAGES[chatId] ?? []).slice(-limit);
    },

    async sendMessage(chatId: string, text: string) {
      const message: Message = {
        id: Date.now(),
        senderId: "me",
        senderName: "You",
        text,
        timestamp: new Date(),
        isOutgoing: true,
      };
      if (!MOCK_MESSAGES[chatId]) {
        MOCK_MESSAGES[chatId] = [];
      }
      MOCK_MESSAGES[chatId].push(message);
      return message;
    },

    onConnectionStateChange(callback) {
      connectionCallback = callback;
    },

    onNewMessage(callback) {
      messageCallback = callback;
    },
  };
}
```

**Step 4: Run test to verify it passes**

Run: `bun test src/services/telegram.mock`
Expected: PASS

**Step 5: Commit**

```bash
git add -A && git commit -m "feat: add mock Telegram service for testing"
```

---

### Task 6: Real Telegram Service (GramJS Wrapper)

**Files:**
- Create: `src/services/telegram.ts`

**Step 1: Create GramJS wrapper**

Create `src/services/telegram.ts`:
```typescript
import { TelegramClient, Api } from "telegram";
import { StringSession } from "telegram/sessions";
import type { TelegramService, ConnectionState, Chat, Message } from "../types";

export interface TelegramServiceOptions {
  apiId: number;
  apiHash: string;
  session?: string;
  onSessionUpdate?: (session: string) => void;
}

export function createTelegramService(options: TelegramServiceOptions): TelegramService {
  const { apiId, apiHash, session = "", onSessionUpdate } = options;
  const stringSession = new StringSession(session);
  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
  });

  let connectionState: ConnectionState = "disconnected";
  let connectionCallback: ((state: ConnectionState) => void) | null = null;
  let messageCallback: ((message: Message, chatId: string) => void) | null = null;

  function setConnectionState(state: ConnectionState) {
    connectionState = state;
    connectionCallback?.(state);
  }

  return {
    async connect() {
      setConnectionState("connecting");
      await client.connect();
      setConnectionState("connected");
      onSessionUpdate?.(client.session.save() as unknown as string);

      client.addEventHandler((event: Api.TypeUpdate) => {
        if (event instanceof Api.UpdateNewMessage && event.message instanceof Api.Message) {
          const msg = event.message;
          const chatId = msg.peerId?.toString() ?? "";
          const message: Message = {
            id: msg.id,
            senderId: msg.fromId?.toString() ?? "",
            senderName: "", // Will be resolved later
            text: msg.message ?? "",
            timestamp: new Date(msg.date * 1000),
            isOutgoing: msg.out ?? false,
          };
          messageCallback?.(message, chatId);
        }
      });
    },

    async disconnect() {
      await client.disconnect();
      setConnectionState("disconnected");
    },

    getConnectionState() {
      return connectionState;
    },

    async getChats() {
      const dialogs = await client.getDialogs({ limit: 100 });
      return dialogs
        .filter((d) => !d.isChannel)
        .map((d) => ({
          id: d.id?.toString() ?? "",
          title: d.title ?? "Unknown",
          unreadCount: d.unreadCount ?? 0,
          isGroup: d.isGroup ?? false,
        }));
    },

    async getMessages(chatId: string, limit = 50) {
      const messages = await client.getMessages(chatId, { limit });
      return messages.map((m) => ({
        id: m.id,
        senderId: m.fromId?.toString() ?? "",
        senderName: "", // Resolved separately
        text: m.message ?? "",
        timestamp: new Date(m.date * 1000),
        isOutgoing: m.out ?? false,
      }));
    },

    async sendMessage(chatId: string, text: string) {
      const result = await client.sendMessage(chatId, { message: text });
      return {
        id: result.id,
        senderId: "me",
        senderName: "You",
        text,
        timestamp: new Date(),
        isOutgoing: true,
      };
    },

    onConnectionStateChange(callback) {
      connectionCallback = callback;
    },

    onNewMessage(callback) {
      messageCallback = callback;
    },
  };
}

export { TelegramClient } from "telegram";
```

**Step 2: Commit**

```bash
git add -A && git commit -m "feat: add GramJS Telegram service wrapper"
```

---

## Phase 3: State Management

### Task 7: App State and Reducer

**Files:**
- Create: `src/state/reducer.ts`
- Create: `src/state/reducer.test.ts`

**Step 1: Write failing test**

Create `src/state/reducer.test.ts`:
```typescript
import { describe, it, expect } from "bun:test";
import { appReducer, initialState } from "./reducer";

describe("appReducer", () => {
  it("sets connection state", () => {
    const state = appReducer(initialState, {
      type: "SET_CONNECTION_STATE",
      payload: "connected",
    });
    expect(state.connectionState).toBe("connected");
  });

  it("sets chats", () => {
    const chats = [{ id: "1", title: "Test", unreadCount: 0, isGroup: false }];
    const state = appReducer(initialState, {
      type: "SET_CHATS",
      payload: chats,
    });
    expect(state.chats).toEqual(chats);
  });

  it("selects a chat", () => {
    const state = appReducer(initialState, {
      type: "SELECT_CHAT",
      payload: "1",
    });
    expect(state.selectedChatId).toBe("1");
  });

  it("sets messages for a chat", () => {
    const messages = [{ id: 1, senderId: "1", senderName: "Test", text: "Hello", timestamp: new Date(), isOutgoing: false }];
    const state = appReducer(initialState, {
      type: "SET_MESSAGES",
      payload: { chatId: "1", messages },
    });
    expect(state.messages["1"]).toEqual(messages);
  });

  it("adds a new message to a chat", () => {
    const message = { id: 1, senderId: "1", senderName: "Test", text: "Hello", timestamp: new Date(), isOutgoing: false };
    const state = appReducer(initialState, {
      type: "ADD_MESSAGE",
      payload: { chatId: "1", message },
    });
    expect(state.messages["1"]).toContain(message);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun test src/state/reducer`
Expected: FAIL — module not found

**Step 3: Implement reducer**

Create `src/state/reducer.ts`:
```typescript
import type { Chat, Message, ConnectionState } from "../types";

export interface AppState {
  connectionState: ConnectionState;
  chats: Chat[];
  selectedChatId: string | null;
  messages: Record<string, Message[]>;
  inputText: string;
  focusedPanel: "chatList" | "messages" | "input";
}

export type AppAction =
  | { type: "SET_CONNECTION_STATE"; payload: ConnectionState }
  | { type: "SET_CHATS"; payload: Chat[] }
  | { type: "SELECT_CHAT"; payload: string }
  | { type: "SET_MESSAGES"; payload: { chatId: string; messages: Message[] } }
  | { type: "ADD_MESSAGE"; payload: { chatId: string; message: Message } }
  | { type: "SET_INPUT_TEXT"; payload: string }
  | { type: "SET_FOCUSED_PANEL"; payload: AppState["focusedPanel"] }
  | { type: "UPDATE_UNREAD_COUNT"; payload: { chatId: string; count: number } };

export const initialState: AppState = {
  connectionState: "disconnected",
  chats: [],
  selectedChatId: null,
  messages: {},
  inputText: "",
  focusedPanel: "chatList",
};

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_CONNECTION_STATE":
      return { ...state, connectionState: action.payload };

    case "SET_CHATS":
      return { ...state, chats: action.payload };

    case "SELECT_CHAT":
      return { ...state, selectedChatId: action.payload, focusedPanel: "messages" };

    case "SET_MESSAGES":
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.payload.chatId]: action.payload.messages,
        },
      };

    case "ADD_MESSAGE":
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.payload.chatId]: [
            ...(state.messages[action.payload.chatId] ?? []),
            action.payload.message,
          ],
        },
      };

    case "SET_INPUT_TEXT":
      return { ...state, inputText: action.payload };

    case "SET_FOCUSED_PANEL":
      return { ...state, focusedPanel: action.payload };

    case "UPDATE_UNREAD_COUNT":
      return {
        ...state,
        chats: state.chats.map((chat) =>
          chat.id === action.payload.chatId
            ? { ...chat, unreadCount: action.payload.count }
            : chat
        ),
      };

    default:
      return state;
  }
}
```

**Step 4: Run test to verify it passes**

Run: `bun test src/state/reducer`
Expected: PASS

**Step 5: Commit**

```bash
git add -A && git commit -m "feat: add app state reducer with tests"
```

---

### Task 8: React Context Provider

**Files:**
- Create: `src/state/context.tsx`

**Step 1: Create context provider**

Create `src/state/context.tsx`:
```typescript
import React, { createContext, useContext, useReducer, type Dispatch } from "react";
import { appReducer, initialState, type AppState, type AppAction } from "./reducer";
import type { TelegramService } from "../types";

interface AppContextValue {
  state: AppState;
  dispatch: Dispatch<AppAction>;
  telegramService: TelegramService | null;
}

const AppContext = createContext<AppContextValue | null>(null);

interface AppProviderProps {
  children: React.ReactNode;
  telegramService?: TelegramService;
}

export function AppProvider({ children, telegramService = null }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch, telegramService }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }
  return context;
}

export function useAppState() {
  return useApp().state;
}

export function useAppDispatch() {
  return useApp().dispatch;
}

export function useTelegramService() {
  return useApp().telegramService;
}
```

**Step 2: Commit**

```bash
git add -A && git commit -m "feat: add React context provider for app state"
```

---

## Phase 4: UI Components

### Task 9: StatusBar Component

**Files:**
- Create: `src/components/StatusBar.tsx`

**Step 1: Create StatusBar component**

Create `src/components/StatusBar.tsx`:
```typescript
import React from "react";
import { Box, Text } from "ink";
import { useAppState } from "../state/context";
import type { ConnectionState } from "../types";

function getStatusColor(state: ConnectionState): string {
  switch (state) {
    case "connected":
      return "green";
    case "connecting":
      return "yellow";
    case "disconnected":
      return "red";
  }
}

function getStatusText(state: ConnectionState): string {
  switch (state) {
    case "connected":
      return "Connected";
    case "connecting":
      return "Connecting...";
    case "disconnected":
      return "Disconnected";
  }
}

export function StatusBar() {
  const { connectionState } = useAppState();

  return (
    <Box borderStyle="single" paddingX={1}>
      <Text>
        [Status: <Text color={getStatusColor(connectionState)}>{getStatusText(connectionState)}</Text>]
      </Text>
      <Text> </Text>
      <Text dimColor>[↑↓: Navigate] [Enter: Select] [Tab: Input] [Ctrl+C: Exit]</Text>
    </Box>
  );
}
```

**Step 2: Commit**

```bash
git add -A && git commit -m "feat: add StatusBar component"
```

---

### Task 10: ChatList Component

**Files:**
- Create: `src/components/ChatList.tsx`

**Step 1: Create ChatList component**

Create `src/components/ChatList.tsx`:
```typescript
import React from "react";
import { Box, Text } from "ink";
import { useAppState } from "../state/context";

interface ChatListProps {
  onSelectChat: (chatId: string) => void;
  selectedIndex: number;
  isFocused: boolean;
}

export function ChatList({ onSelectChat, selectedIndex, isFocused }: ChatListProps) {
  const { chats, selectedChatId } = useAppState();

  return (
    <Box flexDirection="column" borderStyle="single" width={20} padding={0}>
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
```

**Step 2: Commit**

```bash
git add -A && git commit -m "feat: add ChatList component"
```

---

### Task 11: MessageView Component

**Files:**
- Create: `src/components/MessageView.tsx`

**Step 1: Create MessageView component**

Create `src/components/MessageView.tsx`:
```typescript
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

export function MessageView({ isFocused }: MessageViewProps) {
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
```

**Step 2: Commit**

```bash
git add -A && git commit -m "feat: add MessageView component"
```

---

### Task 12: InputBar Component

**Files:**
- Create: `src/components/InputBar.tsx`

**Step 1: Create InputBar component**

Create `src/components/InputBar.tsx`:
```typescript
import React from "react";
import { Box, Text } from "ink";
import TextInput from "ink-text-input";
import { useAppState, useAppDispatch } from "../state/context";

interface InputBarProps {
  isFocused: boolean;
  onSubmit: (text: string) => void;
}

export function InputBar({ isFocused, onSubmit }: InputBarProps) {
  const { inputText, selectedChatId } = useAppState();
  const dispatch = useAppDispatch();

  const handleChange = (value: string) => {
    dispatch({ type: "SET_INPUT_TEXT", payload: value });
  };

  const handleSubmit = (value: string) => {
    if (value.trim() && selectedChatId) {
      onSubmit(value.trim());
      dispatch({ type: "SET_INPUT_TEXT", payload: "" });
    }
  };

  return (
    <Box borderStyle="single" paddingX={1}>
      <Text bold color={isFocused ? "cyan" : undefined}>{">"} </Text>
      {isFocused ? (
        <TextInput
          value={inputText}
          onChange={handleChange}
          onSubmit={handleSubmit}
          placeholder={selectedChatId ? "Type a message..." : "Select a chat first"}
        />
      ) : (
        <Text dimColor>{inputText || "Type a message..."}</Text>
      )}
    </Box>
  );
}
```

**Step 2: Commit**

```bash
git add -A && git commit -m "feat: add InputBar component"
```

---

## Phase 5: Setup Flow

### Task 13: Welcome Screen Component

**Files:**
- Create: `src/components/Setup/Welcome.tsx`

**Step 1: Create Welcome component**

Create `src/components/Setup/Welcome.tsx`:
```typescript
import React from "react";
import { Box, Text } from "ink";

interface WelcomeProps {
  onContinue: () => void;
}

export function Welcome({ onContinue }: WelcomeProps) {
  React.useEffect(() => {
    const timer = setTimeout(onContinue, 100);
    return () => clearTimeout(timer);
  }, [onContinue]);

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold color="cyan">Welcome to telegram-console-client!</Text>
      <Text></Text>
      <Text>To use this client, you need Telegram API credentials.</Text>
      <Text>Get them at: <Text color="blue" underline>https://my.telegram.org/apps</Text></Text>
      <Text></Text>
    </Box>
  );
}
```

**Step 2: Commit**

```bash
git add -A && git commit -m "feat: add Welcome setup component"
```

---

### Task 14: API Credentials Component

**Files:**
- Create: `src/components/Setup/ApiCredentials.tsx`

**Step 1: Create ApiCredentials component**

Create `src/components/Setup/ApiCredentials.tsx`:
```typescript
import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";

interface ApiCredentialsProps {
  onSubmit: (apiId: number, apiHash: string) => void;
}

type Step = "apiId" | "apiHash";

export function ApiCredentials({ onSubmit }: ApiCredentialsProps) {
  const [step, setStep] = useState<Step>("apiId");
  const [apiId, setApiId] = useState("");
  const [apiHash, setApiHash] = useState("");

  const handleApiIdSubmit = () => {
    if (apiId.trim() && !isNaN(parseInt(apiId, 10))) {
      setStep("apiHash");
    }
  };

  const handleApiHashSubmit = () => {
    if (apiHash.trim()) {
      onSubmit(parseInt(apiId, 10), apiHash.trim());
    }
  };

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold color="cyan">API Credentials</Text>
      <Text></Text>
      <Text>Get your credentials at: <Text color="blue">https://my.telegram.org/apps</Text></Text>
      <Text></Text>

      <Box>
        <Text bold>API ID: </Text>
        {step === "apiId" ? (
          <TextInput
            value={apiId}
            onChange={setApiId}
            onSubmit={handleApiIdSubmit}
            placeholder="12345678"
          />
        ) : (
          <Text>{apiId}</Text>
        )}
      </Box>

      {step === "apiHash" && (
        <Box>
          <Text bold>API Hash: </Text>
          <TextInput
            value={apiHash}
            onChange={setApiHash}
            onSubmit={handleApiHashSubmit}
            placeholder="Enter your API hash"
            mask="*"
          />
        </Box>
      )}
    </Box>
  );
}
```

**Step 2: Commit**

```bash
git add -A && git commit -m "feat: add ApiCredentials setup component"
```

---

### Task 15: QR Auth Component

**Files:**
- Create: `src/components/Setup/QrAuth.tsx`

**Step 1: Create QrAuth component**

Create `src/components/Setup/QrAuth.tsx`:
```typescript
import React, { useState, useEffect } from "react";
import { Box, Text, useInput } from "ink";
import qrcode from "qrcode-terminal";

interface QrAuthProps {
  qrCode: string | null;
  onSwitchToPhone: () => void;
  isLoading: boolean;
}

export function QrAuth({ qrCode, onSwitchToPhone, isLoading }: QrAuthProps) {
  const [qrDisplay, setQrDisplay] = useState<string>("");

  useEffect(() => {
    if (qrCode) {
      qrcode.generate(qrCode, { small: true }, (output) => {
        setQrDisplay(output);
      });
    }
  }, [qrCode]);

  useInput((input) => {
    if (input === "p" || input === "P") {
      onSwitchToPhone();
    }
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold color="cyan">Scan QR Code</Text>
      <Text></Text>
      <Text>Open Telegram on your phone:</Text>
      <Text>Settings → Devices → Scan QR Code</Text>
      <Text></Text>

      {isLoading ? (
        <Text dimColor>Generating QR code...</Text>
      ) : qrDisplay ? (
        <Box flexDirection="column">
          <Text>{qrDisplay}</Text>
        </Box>
      ) : (
        <Text dimColor>Waiting for QR code...</Text>
      )}

      <Text></Text>
      <Text dimColor>[Press 'p' to use phone number instead]</Text>
    </Box>
  );
}
```

**Step 2: Commit**

```bash
git add -A && git commit -m "feat: add QrAuth setup component"
```

---

### Task 16: Phone Auth Component

**Files:**
- Create: `src/components/Setup/PhoneAuth.tsx`

**Step 1: Create PhoneAuth component**

Create `src/components/Setup/PhoneAuth.tsx`:
```typescript
import React, { useState } from "react";
import { Box, Text } from "ink";
import TextInput from "ink-text-input";

interface PhoneAuthProps {
  onSubmitPhone: (phone: string) => void;
  onSubmitCode: (code: string) => void;
  onSubmit2FA: (password: string) => void;
  step: "phone" | "code" | "2fa";
  isLoading: boolean;
  error?: string;
}

export function PhoneAuth({
  onSubmitPhone,
  onSubmitCode,
  onSubmit2FA,
  step,
  isLoading,
  error,
}: PhoneAuthProps) {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");

  const handlePhoneSubmit = () => {
    if (phone.trim()) {
      onSubmitPhone(phone.trim());
    }
  };

  const handleCodeSubmit = () => {
    if (code.trim()) {
      onSubmitCode(code.trim());
    }
  };

  const handle2FASubmit = () => {
    if (password) {
      onSubmit2FA(password);
    }
  };

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold color="cyan">Phone Authentication</Text>
      <Text></Text>

      {error && (
        <Box>
          <Text color="red">Error: {error}</Text>
          <Text></Text>
        </Box>
      )}

      {step === "phone" && (
        <Box>
          <Text bold>Phone number (with country code): </Text>
          {isLoading ? (
            <Text dimColor>Sending code...</Text>
          ) : (
            <TextInput
              value={phone}
              onChange={setPhone}
              onSubmit={handlePhoneSubmit}
              placeholder="+1234567890"
            />
          )}
        </Box>
      )}

      {step === "code" && (
        <Box>
          <Text bold>Enter the code sent to your Telegram: </Text>
          {isLoading ? (
            <Text dimColor>Verifying...</Text>
          ) : (
            <TextInput
              value={code}
              onChange={setCode}
              onSubmit={handleCodeSubmit}
              placeholder="12345"
            />
          )}
        </Box>
      )}

      {step === "2fa" && (
        <Box>
          <Text bold>Enter your 2FA password: </Text>
          {isLoading ? (
            <Text dimColor>Verifying...</Text>
          ) : (
            <TextInput
              value={password}
              onChange={setPassword}
              onSubmit={handle2FASubmit}
              mask="*"
            />
          )}
        </Box>
      )}
    </Box>
  );
}
```

**Step 2: Commit**

```bash
git add -A && git commit -m "feat: add PhoneAuth setup component"
```

---

### Task 17: Setup Flow Orchestrator

**Files:**
- Create: `src/components/Setup/index.tsx`

**Step 1: Create Setup orchestrator**

Create `src/components/Setup/index.tsx`:
```typescript
import React, { useState, useCallback } from "react";
import { Box } from "ink";
import { Welcome } from "./Welcome";
import { ApiCredentials } from "./ApiCredentials";
import { QrAuth } from "./QrAuth";
import { PhoneAuth } from "./PhoneAuth";
import type { AppConfig, AuthMethod } from "../../types";

type SetupStep = "welcome" | "credentials" | "auth";

interface SetupProps {
  onComplete: (config: AppConfig, session: string) => void;
  preferredAuthMethod: AuthMethod;
}

export function Setup({ onComplete, preferredAuthMethod }: SetupProps) {
  const [step, setStep] = useState<SetupStep>("welcome");
  const [authMethod, setAuthMethod] = useState<AuthMethod>(preferredAuthMethod);
  const [apiId, setApiId] = useState<number | null>(null);
  const [apiHash, setApiHash] = useState<string | null>(null);
  const [phoneStep, setPhoneStep] = useState<"phone" | "code" | "2fa">("phone");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const handleWelcomeContinue = useCallback(() => {
    setStep("credentials");
  }, []);

  const handleCredentialsSubmit = useCallback((id: number, hash: string) => {
    setApiId(id);
    setApiHash(hash);
    setStep("auth");
    // Here we would initialize the Telegram client and start auth
  }, []);

  const handleSwitchToPhone = useCallback(() => {
    setAuthMethod("phone");
  }, []);

  const handlePhoneSubmit = useCallback((phone: string) => {
    setIsLoading(true);
    // Here we would send the phone to Telegram
    setIsLoading(false);
    setPhoneStep("code");
  }, []);

  const handleCodeSubmit = useCallback((code: string) => {
    setIsLoading(true);
    // Here we would verify the code
    setIsLoading(false);
    // If 2FA is needed, setPhoneStep("2fa")
    // Otherwise, call onComplete
  }, []);

  const handle2FASubmit = useCallback((password: string) => {
    setIsLoading(true);
    // Here we would verify 2FA
    setIsLoading(false);
  }, []);

  return (
    <Box flexDirection="column">
      {step === "welcome" && <Welcome onContinue={handleWelcomeContinue} />}

      {step === "credentials" && (
        <ApiCredentials onSubmit={handleCredentialsSubmit} />
      )}

      {step === "auth" && authMethod === "qr" && (
        <QrAuth
          qrCode={qrCode}
          onSwitchToPhone={handleSwitchToPhone}
          isLoading={isLoading}
        />
      )}

      {step === "auth" && authMethod === "phone" && (
        <PhoneAuth
          onSubmitPhone={handlePhoneSubmit}
          onSubmitCode={handleCodeSubmit}
          onSubmit2FA={handle2FASubmit}
          step={phoneStep}
          isLoading={isLoading}
          error={error}
        />
      )}
    </Box>
  );
}

export { Welcome } from "./Welcome";
export { ApiCredentials } from "./ApiCredentials";
export { QrAuth } from "./QrAuth";
export { PhoneAuth } from "./PhoneAuth";
```

**Step 2: Commit**

```bash
git add -A && git commit -m "feat: add Setup flow orchestrator"
```

---

## Phase 6: Main App Integration

### Task 18: Main App Component

**Files:**
- Create: `src/app.tsx`

**Step 1: Create main App component**

Create `src/app.tsx`:
```typescript
import React, { useState, useEffect, useCallback } from "react";
import { Box, useInput, useApp as useInkApp } from "ink";
import { AppProvider, useApp, useAppDispatch, useAppState } from "./state/context";
import { ChatList } from "./components/ChatList";
import { MessageView } from "./components/MessageView";
import { InputBar } from "./components/InputBar";
import { StatusBar } from "./components/StatusBar";
import { Setup } from "./components/Setup";
import { hasConfig, loadConfigWithEnvOverrides, saveConfig } from "./config";
import { createTelegramService } from "./services/telegram";
import { createMockTelegramService } from "./services/telegram.mock";
import type { AppConfig, TelegramService } from "./types";

interface MainAppProps {
  telegramService: TelegramService;
}

function MainApp({ telegramService }: MainAppProps) {
  const { state, dispatch } = useApp();
  const { exit } = useInkApp();
  const [chatIndex, setChatIndex] = useState(0);

  // Initialize connection and load chats
  useEffect(() => {
    const init = async () => {
      await telegramService.connect();
      const chats = await telegramService.getChats();
      dispatch({ type: "SET_CHATS", payload: chats });
    };
    init();

    telegramService.onConnectionStateChange((connectionState) => {
      dispatch({ type: "SET_CONNECTION_STATE", payload: connectionState });
    });

    telegramService.onNewMessage((message, chatId) => {
      dispatch({ type: "ADD_MESSAGE", payload: { chatId, message } });
    });
  }, [telegramService, dispatch]);

  // Load messages when chat is selected
  useEffect(() => {
    if (state.selectedChatId) {
      telegramService.getMessages(state.selectedChatId).then((messages) => {
        dispatch({
          type: "SET_MESSAGES",
          payload: { chatId: state.selectedChatId!, messages },
        });
      });
    }
  }, [state.selectedChatId, telegramService, dispatch]);

  const handleSelectChat = useCallback(
    (chatId: string) => {
      dispatch({ type: "SELECT_CHAT", payload: chatId });
    },
    [dispatch]
  );

  const handleSendMessage = useCallback(
    async (text: string) => {
      if (state.selectedChatId) {
        const message = await telegramService.sendMessage(state.selectedChatId, text);
        dispatch({
          type: "ADD_MESSAGE",
          payload: { chatId: state.selectedChatId, message },
        });
      }
    },
    [state.selectedChatId, telegramService, dispatch]
  );

  useInput((input, key) => {
    if (key.ctrl && input === "c") {
      exit();
      return;
    }

    if (state.focusedPanel === "chatList") {
      if (key.upArrow) {
        setChatIndex((i) => Math.max(0, i - 1));
      } else if (key.downArrow) {
        setChatIndex((i) => Math.min(state.chats.length - 1, i + 1));
      } else if (key.return) {
        const chat = state.chats[chatIndex];
        if (chat) handleSelectChat(chat.id);
      } else if (key.rightArrow || key.tab) {
        dispatch({ type: "SET_FOCUSED_PANEL", payload: "messages" });
      }
    } else if (state.focusedPanel === "messages") {
      if (key.leftArrow) {
        dispatch({ type: "SET_FOCUSED_PANEL", payload: "chatList" });
      } else if (key.tab) {
        dispatch({ type: "SET_FOCUSED_PANEL", payload: "input" });
      }
    } else if (state.focusedPanel === "input") {
      if (key.escape) {
        dispatch({ type: "SET_FOCUSED_PANEL", payload: "messages" });
      }
    }
  });

  return (
    <Box flexDirection="column" height="100%">
      <Box flexGrow={1}>
        <ChatList
          onSelectChat={handleSelectChat}
          selectedIndex={chatIndex}
          isFocused={state.focusedPanel === "chatList"}
        />
        <MessageView isFocused={state.focusedPanel === "messages"} />
      </Box>
      <InputBar
        isFocused={state.focusedPanel === "input"}
        onSubmit={handleSendMessage}
      />
      <StatusBar />
    </Box>
  );
}

interface AppProps {
  useMock?: boolean;
}

export function App({ useMock = false }: AppProps) {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [telegramService, setTelegramService] = useState<TelegramService | null>(null);
  const [isSetupComplete, setIsSetupComplete] = useState(false);

  useEffect(() => {
    if (hasConfig()) {
      const loadedConfig = loadConfigWithEnvOverrides();
      if (loadedConfig) {
        setConfig(loadedConfig);
        setIsSetupComplete(true);
      }
    }
  }, []);

  useEffect(() => {
    if (isSetupComplete && config) {
      if (useMock) {
        setTelegramService(createMockTelegramService());
      } else {
        setTelegramService(
          createTelegramService({
            apiId: config.apiId,
            apiHash: config.apiHash,
          })
        );
      }
    }
  }, [isSetupComplete, config, useMock]);

  const handleSetupComplete = useCallback((newConfig: AppConfig, session: string) => {
    saveConfig(newConfig);
    setConfig(newConfig);
    setIsSetupComplete(true);
  }, []);

  if (!isSetupComplete) {
    return (
      <Setup
        onComplete={handleSetupComplete}
        preferredAuthMethod="qr"
      />
    );
  }

  if (!telegramService) {
    return null;
  }

  return (
    <AppProvider telegramService={telegramService}>
      <MainApp telegramService={telegramService} />
    </AppProvider>
  );
}
```

**Step 2: Commit**

```bash
git add -A && git commit -m "feat: add main App component with setup flow"
```

---

### Task 19: Update Entry Point

**Files:**
- Modify: `src/index.tsx`

**Step 1: Update entry point**

Replace `src/index.tsx`:
```tsx
#!/usr/bin/env node
import { render } from "ink";
import { App } from "./app";

const useMock = process.argv.includes("--mock");

render(<App useMock={useMock} />);
```

**Step 2: Verify it runs**

Run: `bun run dev -- --mock`
Expected: Shows setup flow or main app with mock data

**Step 3: Commit**

```bash
git add -A && git commit -m "feat: update entry point to use App component"
```

---

## Phase 7: Build & Distribution

### Task 20: Production Build Setup

**Files:**
- Modify: `package.json`

**Step 1: Update package.json for distribution**

Update `package.json`:
```json
{
  "name": "telegram-console-client",
  "version": "0.1.0",
  "type": "module",
  "description": "A terminal-based Telegram client",
  "author": "",
  "license": "MIT",
  "bin": {
    "telegram-console-client": "./dist/index.js"
  },
  "files": [
    "dist"
  ],
  "engines": {
    "node": ">=18"
  },
  "scripts": {
    "dev": "bun run src/index.tsx",
    "build": "bun build src/index.tsx --outdir dist --target node --minify",
    "test": "bun test",
    "prepublishOnly": "bun run build"
  },
  "dependencies": {
    "telegram": "^2.0.0",
    "ink": "^4.0.0",
    "react": "^18.0.0",
    "ink-text-input": "^5.0.0",
    "qrcode-terminal": "^0.12.0",
    "conf": "^12.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/react": "^18.0.0",
    "@types/node": "^20.0.0"
  }
}
```

**Step 2: Build and test**

Run:
```bash
bun run build
node dist/index.js --mock
```
Expected: App runs from built output

**Step 3: Commit**

```bash
git add -A && git commit -m "chore: configure production build and npm distribution"
```

---

## Phase 8: Final Integration Testing

### Task 21: Integration Test with Mock Service

**Files:**
- Create: `src/app.test.tsx`

**Step 1: Create integration test**

Create `src/app.test.tsx`:
```typescript
import { describe, it, expect } from "bun:test";
import { render } from "ink-testing-library";
import { App } from "./app";

describe("App Integration", () => {
  it("renders without crashing in mock mode", () => {
    const { lastFrame } = render(<App useMock />);
    expect(lastFrame()).toBeDefined();
  });
});
```

**Step 2: Run tests**

Run: `bun test`
Expected: All tests pass

**Step 3: Commit**

```bash
git add -A && git commit -m "test: add app integration test"
```

---

### Task 22: Add README

**Files:**
- Create: `README.md`

**Step 1: Create README**

Create `README.md`:
```markdown
# telegram-console-client

A terminal-based Telegram client for technical users.

## Installation

```bash
npm install -g telegram-console-client
# or
bun install -g telegram-console-client
```

## Setup

1. Get API credentials at https://my.telegram.org/apps
2. Run `telegram-console-client`
3. Enter your API ID and API Hash
4. Scan QR code with Telegram app (or use phone auth)

## Usage

```bash
telegram-console-client
```

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| ↑/↓ | Navigate chats / scroll messages |
| ←/→ | Switch panels |
| Enter | Select chat / send message |
| Tab | Focus input |
| Esc | Go back |
| Ctrl+C | Exit |

## Development

```bash
# Install dependencies
bun install

# Run in dev mode
bun run dev

# Run with mock data
bun run dev -- --mock

# Run tests
bun test

# Build
bun run build
```

## License

MIT
```

**Step 2: Commit**

```bash
git add -A && git commit -m "docs: add README"
```

---

## Summary

**Total Tasks:** 22
**Phases:**
1. Project Foundation (Tasks 1-3)
2. Telegram Service Layer (Tasks 4-6)
3. State Management (Tasks 7-8)
4. UI Components (Tasks 9-12)
5. Setup Flow (Tasks 13-17)
6. Main App Integration (Tasks 18-19)
7. Build & Distribution (Task 20)
8. Final Integration Testing (Tasks 21-22)

Each task is designed to be completable in a single ralph-loop iteration with clear TDD steps and commit points.
