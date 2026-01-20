# Testing Patterns

**Analysis Date:** 2026-01-20

## Test Framework

**Runner:**
- Bun Test (built-in to Bun runtime)
- No separate config file - uses Bun defaults

**Assertion Library:**
- Bun's built-in expect (Jest-compatible API)

**Run Commands:**
```bash
bun test              # Run all tests
bun test --watch      # Watch mode
bun test --coverage   # Coverage (if configured)
```

## Test File Organization

**Location:**
- Co-located with source files (tests live next to implementation)

**Naming:**
- `*.test.ts` for TypeScript tests
- `*.test.tsx` for React component tests

**Structure:**
```
src/
├── config/
│   ├── index.ts
│   └── index.test.ts
├── services/
│   ├── telegram.ts
│   ├── telegram.mock.ts
│   └── telegram.mock.test.ts
├── state/
│   ├── reducer.ts
│   └── reducer.test.ts
├── app.tsx
└── app.test.tsx
```

## Test Structure

**Suite Organization:**
```typescript
import { describe, it, expect, beforeEach, afterEach } from "bun:test";

describe("ModuleName", () => {
  beforeEach(() => {
    // Setup for each test
  });

  afterEach(() => {
    // Cleanup after each test
  });

  it("does something specific", () => {
    // Arrange
    const input = /* ... */;

    // Act
    const result = functionUnderTest(input);

    // Assert
    expect(result).toBe(expected);
  });
});
```

**Patterns:**
- `describe` blocks group related tests
- `it` statements describe expected behavior
- `beforeEach`/`afterEach` for setup/teardown
- AAA pattern (Arrange-Act-Assert) implied but not strictly enforced

## Mocking

**Framework:** Manual mocks (no external mocking library)

**Patterns:**
```typescript
// Mock service implementation in src/services/telegram.mock.ts
export function createMockTelegramService(): TelegramService {
  let connectionState: ConnectionState = "disconnected";
  let connectionCallback: ((state: ConnectionState) => void) | null = null;

  return {
    async connect() {
      connectionState = "connecting";
      connectionCallback?.(connectionState);
      await new Promise((r) => setTimeout(r, 100));
      connectionState = "connected";
      connectionCallback?.(connectionState);
    },
    // ... other methods
  };
}
```

**What to Mock:**
- External services (Telegram API via mock service)
- File system operations (using temp directories)
- Timers (via `setTimeout` simulation)

**What NOT to Mock:**
- Pure functions (reducer, utility functions)
- State management logic
- React hooks (test through component behavior)

## Fixtures and Factories

**Test Data:**
```typescript
// In-file test data
const MOCK_CHATS: Chat[] = [
  { id: "1", title: "John Doe", unreadCount: 2, isGroup: false },
  { id: "2", title: "Jane Smith", unreadCount: 0, isGroup: false },
];

const MOCK_MESSAGES: Record<string, Message[]> = {
  "1": [
    { id: 1, senderId: "1", senderName: "John", text: "Hey", timestamp: new Date("2026-01-19T10:30:00"), isOutgoing: false },
  ],
};
```

**Location:**
- Mock data defined in mock service file (`src/services/telegram.mock.ts`)
- Test-specific data defined inline in test files
- Temporary directories for config tests:
```typescript
const TEST_CONFIG_DIR = join(import.meta.dir, "../../.test-config");
```

## Coverage

**Requirements:** None enforced

**View Coverage:**
```bash
bun test --coverage
```

## Test Types

**Unit Tests:**
- Reducer tests (`src/state/reducer.test.ts`) - pure function testing
- Config tests (`src/config/index.test.ts`) - file I/O with temp directories
- Mock service tests (`src/services/telegram.mock.test.ts`) - service interface testing

**Integration Tests:**
- App component tests (`src/app.test.tsx`) - render with mock service

**E2E Tests:**
- Not implemented

## Common Patterns

**Reducer Testing:**
```typescript
describe("appReducer", () => {
  it("sets connection state", () => {
    const state = appReducer(initialState, {
      type: "SET_CONNECTION_STATE",
      payload: "connected",
    });
    expect(state.connectionState).toBe("connected");
  });

  it("sets messages for a chat", () => {
    const messages = [{ id: 1, senderId: "1", senderName: "Test", text: "Hello", timestamp: new Date(), isOutgoing: false }];
    const state = appReducer(initialState, {
      type: "SET_MESSAGES",
      payload: { chatId: "1", messages },
    });
    expect(state.messages["1"]).toEqual(messages);
  });
});
```

**Async Testing:**
```typescript
it("connects and returns connected state", async () => {
  const service = createMockTelegramService();
  await service.connect();
  expect(service.getConnectionState()).toBe("connected");
});
```

**Component Testing (with ink-testing-library):**
```typescript
import { render } from "ink-testing-library";
import React from "react";
import { App } from "./app";

describe("App Integration", () => {
  it("renders without crashing in mock mode", () => {
    const { lastFrame } = render(<App useMock />);
    expect(lastFrame()).toBeDefined();
  });

  it("shows welcome message on initial render", () => {
    const { lastFrame } = render(<App useMock />);
    const frame = lastFrame();
    expect(frame).toContain("Welcome");
  });
});
```

**File System Testing with Cleanup:**
```typescript
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

  it("saves and loads config", () => {
    const config = { /* ... */ };
    saveConfig(config, TEST_CONFIG_DIR);
    expect(hasConfig(TEST_CONFIG_DIR)).toBe(true);
    const loaded = loadConfig(TEST_CONFIG_DIR);
    expect(loaded).toEqual(config);
  });
});
```

**Environment Variable Testing:**
```typescript
describe("Environment Overrides", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.TG_API_ID;
    delete process.env.TG_API_HASH;
    // ... clear other vars
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("overrides config with environment variables", () => {
    process.env.TG_API_ID = "99999";
    const loaded = loadConfigWithEnvOverrides(TEST_CONFIG_DIR);
    expect(loaded?.apiId).toBe(99999);
  });
});
```

## Testing Library Usage

**ink-testing-library:**
- Used for React/Ink component testing
- `render()` returns `{ lastFrame }` for output inspection
- `lastFrame()` returns the terminal output as string

**Key Testing Utilities:**
- `expect().toBe()` - strict equality
- `expect().toEqual()` - deep equality
- `expect().toContain()` - array/string contains
- `expect().toBeDefined()` - not undefined
- `expect().toBeGreaterThan()` - numeric comparison
- `expect().toHaveProperty()` - object property check
- `expect().toBeNull()` - null check

## Test Gaps

**Not Tested:**
- `src/services/telegram.ts` - real Telegram service (requires API credentials)
- Individual UI components (`ChatList`, `MessageView`, etc.)
- Keyboard navigation and input handling
- Setup flow components

**Recommended Additions:**
- Component unit tests with ink-testing-library
- Keyboard input simulation tests
- Error boundary testing
- Network failure scenarios

---

*Testing analysis: 2026-01-20*
