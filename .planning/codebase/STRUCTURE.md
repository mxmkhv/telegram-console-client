# Codebase Structure

**Analysis Date:** 2026-01-20

## Directory Layout

```
telegram-console/
├── src/                    # Application source code
│   ├── components/         # React UI components
│   │   └── Setup/          # Setup wizard components
│   ├── config/             # Configuration utilities
│   ├── services/           # External service abstractions
│   ├── state/              # State management (reducer + context)
│   ├── types/              # TypeScript type definitions
│   ├── index.tsx           # CLI entry point
│   └── app.tsx             # Root application component
├── dist/                   # Build output (generated)
├── docs/                   # Documentation
│   └── plans/              # Planning documents
├── .planning/              # GSD planning artifacts
│   └── codebase/           # Codebase analysis documents
├── package.json            # Package manifest
├── tsconfig.json           # TypeScript configuration
├── eslint.config.js        # ESLint configuration
├── bun.lock                # Bun lockfile
└── README.md               # Project readme
```

## Directory Purposes

**`src/`:**
- Purpose: All application source code
- Contains: TypeScript and TSX files
- Key files: `index.tsx` (entry), `app.tsx` (root component)

**`src/components/`:**
- Purpose: React UI components for terminal interface
- Contains: Main panel components, presentational components
- Key files: `ChatList.tsx`, `MessageView.tsx`, `InputBar.tsx`, `StatusBar.tsx`

**`src/components/Setup/`:**
- Purpose: First-run setup wizard flow
- Contains: Step-by-step auth components
- Key files: `index.tsx` (orchestrator), `Welcome.tsx`, `ApiCredentials.tsx`, `QrAuth.tsx`, `PhoneAuth.tsx`

**`src/config/`:**
- Purpose: Configuration persistence and loading
- Contains: Config file utilities
- Key files: `index.ts` (all config functions)

**`src/services/`:**
- Purpose: External API service abstractions
- Contains: Telegram service implementations
- Key files: `telegram.ts` (real), `telegram.mock.ts` (mock for testing)

**`src/state/`:**
- Purpose: Centralized state management
- Contains: Reducer and React context
- Key files: `reducer.ts` (state shape + actions), `context.tsx` (provider + hooks)

**`src/types/`:**
- Purpose: Shared TypeScript type definitions
- Contains: Domain types, config types, service interfaces
- Key files: `index.ts` (all types exported)

**`dist/`:**
- Purpose: Compiled output for npm distribution
- Contains: Bundled JavaScript
- Generated: Yes (by `bun build`)
- Committed: No (in .gitignore)

## Key File Locations

**Entry Points:**
- `src/index.tsx`: CLI entry point with shebang
- `src/app.tsx`: React application root

**Configuration:**
- `tsconfig.json`: TypeScript compiler options
- `eslint.config.js`: Linting rules
- `package.json`: Dependencies and scripts

**Core Logic:**
- `src/app.tsx`: Main application orchestration (~268 lines)
- `src/state/reducer.ts`: State management (~83 lines)
- `src/services/telegram.ts`: Telegram API integration (~124 lines)

**Testing:**
- `src/app.test.tsx`: Application tests
- `src/config/index.test.ts`: Config utility tests
- `src/state/reducer.test.ts`: Reducer tests
- `src/services/telegram.mock.test.ts`: Mock service tests

## Naming Conventions

**Files:**
- Components: PascalCase (`ChatList.tsx`, `MessageView.tsx`)
- Utilities/Services: camelCase (`telegram.ts`, `reducer.ts`)
- Tests: `*.test.ts` or `*.test.tsx` suffix co-located with source
- Index files: `index.ts` or `index.tsx` for directory exports

**Directories:**
- Features: PascalCase for component groups (`Setup/`)
- Categories: lowercase for utilities (`config/`, `services/`, `state/`, `types/`)

**Exports:**
- Components: Named exports (`export function ChatList`)
- Services: Factory functions (`export function createTelegramService`)
- Types: Named type exports (`export type Chat`, `export interface TelegramService`)
- Hooks: `use` prefix (`useApp`, `useAppState`, `useTelegramService`)

## Where to Add New Code

**New UI Component:**
- Implementation: `src/components/{ComponentName}.tsx`
- If multi-file feature: `src/components/{FeatureName}/index.tsx`
- Tests: `src/components/{ComponentName}.test.tsx`
- Import in: `src/app.tsx` or parent component

**New Service:**
- Implementation: `src/services/{serviceName}.ts`
- Mock: `src/services/{serviceName}.mock.ts`
- Interface: Add to `src/types/index.ts`
- Tests: `src/services/{serviceName}.test.ts`

**New State Actions:**
- Add action type to union in `src/state/reducer.ts`
- Add case handler in `appReducer` switch statement
- No separate action creator files (inline dispatch)

**New Types:**
- Add to `src/types/index.ts`
- Group with related types (domain, config, service interfaces)

**Configuration Changes:**
- Add to `src/config/index.ts`
- Update `AppConfig` type in `src/types/index.ts`
- Consider env override in `loadConfigWithEnvOverrides()`

**Utilities:**
- Shared helpers: Create `src/utils/` directory if needed
- Component-specific: Keep in component file

## Special Directories

**`dist/`:**
- Purpose: npm package distribution bundle
- Generated: Yes (`bun build src/index.tsx --outdir dist`)
- Committed: No

**`node_modules/`:**
- Purpose: npm/bun dependencies
- Generated: Yes (`bun install`)
- Committed: No

**`.planning/`:**
- Purpose: GSD planning artifacts and codebase analysis
- Generated: By GSD commands
- Committed: Yes

**`~/.config/telegram-console-client/`:**
- Purpose: User configuration storage (not in repo)
- Contains: `config.json` (credentials), `session` (auth session string)
- Created: On first setup completion

---

*Structure analysis: 2026-01-20*
