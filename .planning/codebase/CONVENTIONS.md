# Coding Conventions

**Analysis Date:** 2026-01-20

## Naming Patterns

**Files:**
- Components: PascalCase with `.tsx` extension (e.g., `ChatList.tsx`, `MessageView.tsx`)
- Services: camelCase with `.ts` extension (e.g., `telegram.ts`, `telegram.mock.ts`)
- Tests: Same name as source file with `.test.ts` or `.test.tsx` suffix (e.g., `reducer.test.ts`)
- Index files: `index.ts` or `index.tsx` for barrel exports
- Types: `index.ts` in `types/` directory

**Functions:**
- camelCase for all functions
- Prefix with `use` for React hooks (e.g., `useApp`, `useAppState`, `useAppDispatch`)
- Prefix with `create` for factory functions (e.g., `createTelegramService`, `createMockTelegramService`)
- Prefix with `handle` for event handlers (e.g., `handleSelectChat`, `handleSendMessage`)
- Prefix with `get` for getters (e.g., `getConfigPath`, `getConnectionState`)
- Prefix with `set` for state setters (e.g., `setConnectionState`)

**Variables:**
- camelCase for all variables
- Underscore prefix for intentionally unused parameters (e.g., `_onSelectChat`, `_input`)
- UPPER_SNAKE_CASE for constants (e.g., `MOCK_CHATS`, `CONFIG_FILENAME`)

**Types:**
- PascalCase for interfaces and types
- Suffix with `Props` for component props interfaces (e.g., `ChatListProps`, `StatusBarProps`)
- Suffix with `State` for state interfaces (e.g., `AppState`)
- Suffix with `Action` for action types (e.g., `AppAction`)
- Union types for string literals (e.g., `type LogLevel = "quiet" | "info" | "verbose"`)

## Code Style

**Formatting:**
- No explicit Prettier config (uses defaults)
- 2-space indentation
- Double quotes for strings in JSX, otherwise mixed
- Trailing commas in multi-line arrays/objects
- Semicolons required

**Linting:**
- ESLint with TypeScript-ESLint
- Config: `eslint.config.js`
- Key rules:
  - `@typescript-eslint/no-unused-vars`: Allows underscore-prefixed vars (`argsIgnorePattern: "^_"`)
  - Uses `eslint.configs.recommended` and `tseslint.configs.recommended`
  - JSX support enabled via `ecmaFeatures: { jsx: true }`

## Import Organization

**Order:**
1. React imports (`import React, { useState, useEffect, useCallback, useMemo } from "react"`)
2. Third-party libraries (`import { Box, Text } from "ink"`)
3. Local modules - absolute paths from src (`import { AppProvider, useApp } from "./state/context"`)
4. Type imports (use `import type` syntax)

**Path Aliases:**
- None configured - uses relative imports from `./` and `../`

**Type Import Style:**
```typescript
import type { TelegramService, ConnectionState, Message } from "../types";
```

## Error Handling

**Patterns:**
- Try/catch blocks for async operations
- Error messages extracted with `err instanceof Error ? err.message : "fallback message"`
- Silent catch blocks for non-critical operations (e.g., reading session file)
- No global error boundary

**Example from `src/app.tsx`:**
```typescript
try {
  // ...operation
} catch {
  // Ignore errors reading session
}
```

**Example from `src/components/Setup/index.tsx`:**
```typescript
try {
  // ...operation
} catch (err) {
  setIsLoading(false);
  setError(err instanceof Error ? err.message : "Authentication failed");
}
```

## Logging

**Framework:** None - no logging framework used

**Patterns:**
- No console.log statements in production code
- Error states managed via React state (`useState<string | null>(null)`)
- Status messages displayed in UI components

## Comments

**When to Comment:**
- Minimal comments overall
- `// @ts-expect-error` with explanation for intentional type overrides
- Brief inline comments for non-obvious logic

**JSDoc/TSDoc:**
- Not used - TypeScript interfaces serve as documentation

**Example:**
```typescript
// @ts-expect-error - GramJS accepts string or number for apiId
const client = new TelegramClient(stringSession, apiId, apiHash, {...});
```

## Function Design

**Size:** Small, focused functions - typically under 30 lines

**Parameters:**
- Destructure props in function signature for components
- Use options object for functions with 3+ parameters
- Optional parameters with defaults (e.g., `limit = 50`)

**Return Values:**
- Explicit return types for service functions
- Inferred types for React components
- Nullable returns use `| null` (e.g., `AppConfig | null`)

## Module Design

**Exports:**
- Named exports preferred over default exports
- Components exported with `export const ComponentName = memo(ComponentInner)`
- Services exported as factory functions

**Barrel Files:**
- `src/types/index.ts` - central type definitions
- `src/components/Setup/index.tsx` - re-exports all Setup components

**Component Structure Pattern:**
```typescript
interface ComponentNameProps {
  // props
}

function ComponentNameInner({ prop1, prop2 }: ComponentNameProps) {
  // implementation
}

export const ComponentName = memo(ComponentNameInner);
```

## React Patterns

**State Management:**
- useReducer for complex state (`src/state/reducer.ts`)
- React Context for global state (`src/state/context.tsx`)
- useState for local component state

**Memoization:**
- Components wrapped with `memo()` for performance
- `useMemo` for derived data
- `useCallback` for event handlers passed as props

**Effect Usage:**
- `useEffect` for side effects (API calls, subscriptions)
- Cleanup functions for subscriptions

**Hook Organization in Components:**
```typescript
function Component({ props }: Props) {
  // 1. Context hooks
  const { state, dispatch } = useApp();

  // 2. Local state
  const [localState, setLocalState] = useState(initial);

  // 3. Effects
  useEffect(() => { /* ... */ }, [deps]);

  // 4. Callbacks
  const handleEvent = useCallback(() => { /* ... */ }, [deps]);

  // 5. Memoized values
  const derived = useMemo(() => /* ... */, [deps]);

  // 6. Render
  return <JSX />;
}
```

## TypeScript Patterns

**Strict Mode:** Enabled in `tsconfig.json`

**Key Settings:**
- `strict: true`
- `noUncheckedIndexedAccess: true` - requires null checks on array access
- `noFallthroughCasesInSwitch: true`

**Type Assertions:**
- Use `as const` for literal types
- Use `as unknown as Type` for complex casts (sparingly)

**Optional Chaining:**
- Extensively used: `obj?.property`, `arr[0]?.id`
- Nullish coalescing: `value ?? defaultValue`

---

*Convention analysis: 2026-01-20*
