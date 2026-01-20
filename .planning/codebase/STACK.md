# Technology Stack

**Analysis Date:** 2026-01-20

## Languages

**Primary:**
- TypeScript 5.9.3 - All source code in `src/`

**Secondary:**
- JSX/TSX - React components use JSX syntax

## Runtime

**Environment:**
- Bun 1.2.9 (primary runtime for dev/build)
- Node.js 22.x compatible (target for distribution)

**Package Manager:**
- Bun (via `bun.lock`)
- Lockfile: present

**Node Version Requirement:**
- `>=18` (per `package.json` engines field)

## Frameworks

**Core:**
- React 19.2.3 - Component rendering
- Ink 6.6.0 - Terminal UI framework (React for CLI)

**Testing:**
- Bun Test (built-in) - Unit testing via `bun test`
- ink-testing-library 4.0.0 - Component testing

**Build/Dev:**
- Bun bundler - Build via `bun build src/index.tsx --outdir dist --target node --minify`
- TypeScript 5.9.3 - Type checking via `tsc --noEmit`

**Linting:**
- ESLint 9.39.2 - Linting
- typescript-eslint 8.53.1 - TypeScript ESLint integration

## Key Dependencies

**Critical:**
- `telegram` 2.26.22 - GramJS Telegram MTProto client (core functionality)
- `ink` 6.6.0 - Terminal UI rendering
- `react` 19.2.3 - UI component model

**UI Components:**
- `ink-text-input` 6.0.0 - Text input component for Ink
- `qrcode-terminal` 0.12.0 - QR code generation for terminal (auth flow)

**Infrastructure:**
- `conf` 15.0.2 - Listed but not actively used (config is custom JSON)

## Configuration

**TypeScript (`tsconfig.json`):**
- Target: ES2022
- Module: ESNext
- Module Resolution: bundler
- JSX: react-jsx
- Strict mode enabled
- `noUncheckedIndexedAccess`: true

**ESLint (`eslint.config.js`):**
- Flat config format
- Extends: eslint recommended + typescript-eslint recommended
- Custom rule: unused vars with underscore prefix ignored

**Environment Variables:**
- `TG_API_ID` - Telegram API ID (required)
- `TG_API_HASH` - Telegram API hash (required)
- `TG_SESSION_MODE` - "persistent" or "ephemeral"
- `TG_LOG_LEVEL` - "quiet", "info", or "verbose"
- `TG_AUTH_METHOD` - "qr" or "phone"

**Config File Location:**
- `~/.config/telegram-console-client/config.json`
- `~/.config/telegram-console-client/session` (session string)

## Build System

**Development:**
```bash
bun run dev          # Run with bun
bun run dev --mock   # Run with mock Telegram service
```

**Production Build:**
```bash
bun run build        # Output to dist/index.js
```

**Type Checking:**
```bash
bun run typecheck    # tsc --noEmit
```

**Testing:**
```bash
bun test             # Run all tests
```

**Linting:**
```bash
bun run lint         # ESLint on src/
```

## Platform Requirements

**Development:**
- macOS, Linux, or Windows with Bun installed
- Bun 1.x (for dev/build tooling)

**Production:**
- Node.js >= 18
- Terminal with Unicode support (for QR codes)
- Distributed as npm package via `dist/index.js`

**Binary Distribution:**
- Entry point: `./dist/index.js`
- Bin name: `telegram-console-client`

---

*Stack analysis: 2026-01-20*
