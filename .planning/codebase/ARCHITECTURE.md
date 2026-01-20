# Architecture

**Analysis Date:** 2026-01-20

## Pattern Overview

**Overall:** Component-based React TUI with Service Layer

**Key Characteristics:**
- Terminal UI application using Ink (React for CLI)
- Centralized state management with useReducer + Context
- Service abstraction layer for Telegram API
- Setup wizard flow before main app
- Panel-based focus navigation system

## Layers

**Entry Point:**
- Purpose: Bootstrap application and render root component
- Location: `src/index.tsx`
- Contains: CLI entry point with shebang, optional mock flag
- Depends on: `src/app.tsx`, Ink renderer
- Used by: CLI execution

**Application Shell:**
- Purpose: Orchestrate setup vs main app flow, initialize services
- Location: `src/app.tsx`
- Contains: `App` component (root), `MainApp` component (authenticated view)
- Depends on: State context, services, config, all UI components
- Used by: Entry point

**State Management:**
- Purpose: Centralized application state and dispatch
- Location: `src/state/`
- Contains: Reducer (`reducer.ts`), Context provider and hooks (`context.tsx`)
- Depends on: Type definitions
- Used by: `App`, all components needing state access

**Services:**
- Purpose: Abstract external API interactions
- Location: `src/services/`
- Contains: Telegram service (`telegram.ts`), mock service (`telegram.mock.ts`)
- Depends on: `telegram` npm package, type definitions
- Used by: `App` (instantiation), `MainApp` (API calls)

**Configuration:**
- Purpose: Load/save user config, environment overrides
- Location: `src/config/`
- Contains: Config utilities (`index.ts`)
- Depends on: Node.js fs, os, path modules
- Used by: `App` for credential management

**Components:**
- Purpose: Reusable UI building blocks
- Location: `src/components/`
- Contains: Main panels (`ChatList.tsx`, `MessageView.tsx`, `InputBar.tsx`, `StatusBar.tsx`), Setup wizard (`Setup/`)
- Depends on: Ink primitives, state hooks, types
- Used by: `MainApp`, `Setup` component

**Types:**
- Purpose: Shared TypeScript type definitions
- Location: `src/types/index.ts`
- Contains: Domain types (`Chat`, `Message`), config types, service interface
- Depends on: Nothing (pure types)
- Used by: All layers

## Data Flow

**Application Startup:**

1. `src/index.tsx` renders `<App>` with optional `--mock` flag
2. `App` checks for existing config via `hasConfig()`
3. If no config: render `<Setup>` wizard
4. If config exists: create `TelegramService` and render `<MainApp>`
5. `MainApp` wrapped in `<AppProvider>` for state context

**Message Flow:**

1. User types in `InputBar` and submits
2. `MainApp.handleSendMessage` calls `telegramService.sendMessage()`
3. Service returns `Message` object
4. `dispatch({ type: 'ADD_MESSAGE', payload: { chatId, message } })`
5. Reducer updates `state.messages[chatId]`
6. `MessageView` re-renders with new message

**Incoming Message Flow:**

1. `TelegramService` registers event handler on connect
2. GramJS emits `NewMessage` event
3. Service transforms to `Message` type and calls `_messageCallback`
4. Callback in `MainApp` dispatches `ADD_MESSAGE` action
5. State updates, component re-renders

**State Management:**
- Single `useReducer` in `AppProvider` holds all app state
- Actions dispatched via `dispatch()` from `useApp()` hook
- State shape defined in `src/state/reducer.ts` (`AppState` interface)
- Immutable updates with spread operators

## Key Abstractions

**TelegramService Interface:**
- Purpose: Abstract Telegram API for testability and mock support
- Examples: `src/types/index.ts` (interface), `src/services/telegram.ts` (impl), `src/services/telegram.mock.ts` (mock)
- Pattern: Factory function returns interface implementation

**AppState + Actions:**
- Purpose: Predictable state container with typed actions
- Examples: `src/state/reducer.ts`
- Pattern: Discriminated union for actions, switch-case reducer

**Focused Panel System:**
- Purpose: Manage keyboard focus across TUI panels
- Examples: `state.focusedPanel` in reducer, `isFocused` props on components
- Pattern: Single active panel, Tab/Escape to navigate

## Entry Points

**CLI Entry:**
- Location: `src/index.tsx`
- Triggers: `bun run src/index.tsx` or `telegram-console-client` binary
- Responsibilities: Parse args, render App with Ink

**Setup Flow Entry:**
- Location: `src/components/Setup/index.tsx`
- Triggers: No valid config detected
- Responsibilities: Collect API credentials, authenticate, save session

**Main App Entry:**
- Location: `src/app.tsx` (`MainApp` component)
- Triggers: Valid config and TelegramService created
- Responsibilities: Connect to Telegram, load chats, handle user interaction

## Error Handling

**Strategy:** Minimal error handling, mostly silent failures

**Patterns:**
- Try-catch with empty catch blocks for session read/write in `src/app.tsx`
- Error state displayed in Setup wizard UI (`error` state variable)
- `onError` callback in QR auth returns `false` to continue retrying
- No global error boundary

## Cross-Cutting Concerns

**Logging:** None (no logging framework)

**Validation:** Minimal - checks for empty strings on form inputs, validates config has apiId/apiHash before skipping setup

**Authentication:** Handled in `src/components/Setup/index.tsx`:
- QR code auth (primary)
- 2FA password support
- Session persistence to `~/.config/telegram-console-client/session`

**Session Management:**
- Session string saved to filesystem on auth success
- Loaded on app restart to skip re-auth
- GramJS `StringSession` for in-memory session handling

---

*Architecture analysis: 2026-01-20*
