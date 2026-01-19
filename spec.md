# telegram-console-client

A terminal-based Telegram client for technical users, installable via npm.

## Overview

**Name:** `telegram-console-client`
**Type:** npm package with executable binary
**Target Users:** Developers and power users comfortable with terminal apps
**Runtime:** Node.js 18+

## Tech Stack

- **TypeScript** — Full type safety
- **GramJS** — Telegram MTProto client library (works on macOS, Linux, Windows)
- **Ink** — React-based terminal UI framework
- **Bun** — Package manager + dev runtime
- **Node.js 18+** — Production runtime (for distribution compatibility)

## Architecture

```
┌─────────────────────────────────────────────────┐
│                   Ink UI Layer                  │
│  ┌──────────────┐  ┌─────────────────────────┐  │
│  │  Chat List   │  │    Message View         │  │
│  │    Panel     │  │       Panel             │  │
│  └──────────────┘  └─────────────────────────┘  │
│  └──────────── Input Bar ────────────────────┘  │
├─────────────────────────────────────────────────┤
│              State Management Layer             │
│        (React Context + useReducer)             │
├─────────────────────────────────────────────────┤
│              Telegram Service Layer             │
│           (GramJS client wrapper)               │
├─────────────────────────────────────────────────┤
│                Session Storage                  │
│       (~/.config/telegram-console-client/)      │
└─────────────────────────────────────────────────┘
```

### Layers

1. **Ink UI Layer** — React components for terminal rendering
2. **State Management** — React Context + useReducer for app state
3. **Telegram Service** — GramJS wrapper handling API calls, events, connection
4. **Session Storage** — Persisted config and session data

## Installation & Usage

```bash
npm install -g telegram-console-client
telegram-console-client
```

## User Journey (Getting Started)

### Step 1: Install the package
```bash
npm install -g telegram-console-client
# or
bun install -g telegram-console-client
```

### Step 2: Get Telegram API credentials
1. Go to https://my.telegram.org
2. Log in with your phone number
3. Click "API development tools"
4. Create a new app (choose "Desktop" platform)
5. Note your `api_id` and `api_hash`

### Step 3: Run the app
```bash
telegram-console-client
```

### Step 4: First-run wizard
```
Welcome to telegram-console-client!

To use this client, you need Telegram API credentials.
Get them at: https://my.telegram.org/apps

Enter your API ID: 12345678
Enter your API Hash: a1b2c3d4e5f6...
```

### Step 5: Authenticate
```
Scan this QR code with your Telegram app:

████████████████████
██ ▄▄▄▄▄ █ ▄ █ ▄▄▄ ██
██ █   █ █▄  █ █▄█ ██
████████████████████

[Press 'p' to use phone number instead]
```

User opens Telegram on phone → Settings → Devices → Scan QR Code

### Step 6: Done — App launches
```
┌─────────────────┬─────────────────────────────────┐
│ Chats           │ Select a chat to start          │
├─────────────────┤                                 │
│   John Doe      │                                 │
│   Jane Smith    │                                 │
│   Work Group    │                                 │
└─────────────────┴─────────────────────────────────┘
```

### Subsequent Launches

Just run:
```bash
telegram-console-client
```

Session is saved — no re-authentication needed (unless using ephemeral mode).

## First-Run Setup (Technical Details)

Users must provide their own Telegram API credentials (from https://my.telegram.org/apps).

### Setup Flow

1. **API Credentials**
   ```
   Welcome to telegram-console-client!

   To use this client, you need Telegram API credentials.
   Get them at: https://my.telegram.org/apps

   Enter your API ID: 12345678
   Enter your API Hash: ********************************
   ```

2. **Authentication (QR code default)**
   ```
   Scan this QR code with your Telegram app:

   ████████████████████
   ██ ▄▄▄▄▄ █ ▄ █ ▄▄▄ ██
   ██ █   █ █▄  █ █▄█ ██
   ██ █▄▄▄█ █ ▄▀  ▄▄▄ ██
   ████████████████████

   [Press 'p' to use phone number instead]
   ```

   **Fallback (phone code):**
   ```
   Enter your phone number (with country code): +1234567890
   Enter the code sent to your Telegram: 12345
   ```

3. **2FA (if enabled)**
   ```
   Enter your 2FA password: ********
   ```

## Configuration

### Config File

Location: `~/.config/telegram-console-client/config.json`

```json
{
  "apiId": 12345678,
  "apiHash": "abc123...",
  "sessionPersistence": "persistent",
  "logLevel": "info",
  "authMethod": "qr"
}
```

### Session File

Location: `~/.config/telegram-console-client/session.dat`

GramJS-managed encrypted session data.

### Environment Variable Overrides

| Variable | Description | Values |
|----------|-------------|--------|
| `TG_API_ID` | Telegram API ID | integer |
| `TG_API_HASH` | Telegram API Hash | string |
| `TG_SESSION_MODE` | Session persistence | `persistent` \| `ephemeral` |
| `TG_LOG_LEVEL` | Logging verbosity | `quiet` \| `info` \| `verbose` |
| `TG_AUTH_METHOD` | Authentication method | `qr` \| `phone` |

Environment variables override config file values.

## UI Layout

Classic TUI with split panels:

```
┌─────────────────┬─────────────────────────────────────┐
│ Chats           │ Chat: John Doe                      │
├─────────────────┤─────────────────────────────────────┤
│ ● John Doe (2)  │ [10:30] John: Hey, how are you?     │
│   Jane Smith    │ [10:31] You: I'm good, thanks!      │
│   Work Group    │ [10:32] John: Great to hear         │
│   Family        │                                     │
│                 │                                     │
│                 │                                     │
│                 │                                     │
│                 │                                     │
├─────────────────┴─────────────────────────────────────┤
│ > Type a message...                                   │
└───────────────────────────────────────────────────────┘
│ [Status: Connected] [↑↓: Navigate] [Enter: Select]    │
└───────────────────────────────────────────────────────┘
```

### Panels

1. **Chat List Panel (left)**
   - List of private chats and groups
   - Unread indicator: bold + badge count
   - Currently selected chat highlighted

2. **Message View Panel (right)**
   - Messages for selected chat
   - Format: `[HH:MM] Sender: Message text`
   - Scrollable history

3. **Input Bar (bottom)**
   - Text input for composing messages
   - Shows current mode/status

4. **Status Bar (footer)**
   - Connection status indicator
   - Keyboard shortcut hints

## Keyboard Navigation

Arrow keys + shortcuts approach (conventional, lower learning curve):

| Key | Action |
|-----|--------|
| `↑` / `↓` | Navigate chat list / scroll messages |
| `←` / `→` | Switch focus between panels |
| `Enter` | Select chat / send message |
| `Tab` | Switch focus to input bar |
| `Esc` | Cancel / go back |
| `Ctrl+C` | Exit application |
| `Ctrl+R` | Refresh / reconnect |
| `Page Up` / `Page Down` | Scroll message history |

## Features (v1 - MVP)

### In Scope

- View chat list (private chats + groups)
- Read messages
- Send text messages
- Unread indicators (highlight + badge count)
- Standard message format (sender + timestamp + text)
- Connection status display
- Configurable log verbosity
- Session persistence (optional)
- QR code + phone code authentication

### Out of Scope (v1)

- Channels (read-only or otherwise)
- Media viewing (images, videos, files)
- Voice messages
- Stickers / GIFs
- Reactions
- Pinned messages
- Search
- Offline caching / message queuing
- Message editing / deletion
- Reply / forward

## Chat Types Supported

| Type | v1 Support |
|------|------------|
| Private chats (1:1) | ✓ |
| Groups | ✓ |
| Channels | ✗ |
| Bots | ✗ |

## Error Handling

Configurable verbosity levels:

- **quiet** — Minimal output, only critical errors
- **info** (default) — Connection status, important events
- **verbose** — Detailed logging for debugging

Status indicator shows:
- Connection state (connected / connecting / disconnected)
- Error notifications with configurable detail level

## Network Handling (v1)

- Show connection status indicator
- Basic reconnection attempts on disconnect
- No offline caching or message queuing

## Project Structure

```
telegram-console-client/
├── src/
│   ├── index.tsx           # Entry point
│   ├── app.tsx             # Main App component
│   ├── components/
│   │   ├── ChatList.tsx    # Chat list panel
│   │   ├── MessageView.tsx # Message view panel
│   │   ├── InputBar.tsx    # Message input
│   │   ├── StatusBar.tsx   # Status footer
│   │   └── Setup/
│   │       ├── Welcome.tsx
│   │       ├── ApiCredentials.tsx
│   │       ├── QrAuth.tsx
│   │       └── PhoneAuth.tsx
│   ├── services/
│   │   └── telegram.ts     # GramJS wrapper
│   ├── state/
│   │   ├── context.tsx     # React context
│   │   └── reducer.ts      # State reducer
│   ├── config/
│   │   └── index.ts        # Config loading/saving
│   └── types/
│       └── index.ts        # TypeScript types
├── package.json
├── tsconfig.json
└── README.md
```

## Dependencies

### Runtime

- `gramjs` — Telegram MTProto client
- `ink` — React for CLI
- `react` — UI framework
- `ink-text-input` — Text input component
- `qrcode-terminal` — QR code rendering
- `conf` — Config file management

### Development

- `typescript`
- `@types/react`
- `@types/bun` — Bun type definitions
- `eslint`
- `prettier`

## Development Workflow

```bash
# Install dependencies
bun install

# Run in development
bun run dev

# Build for production (targets Node.js)
bun run build

# Run production build
node dist/index.js
```
