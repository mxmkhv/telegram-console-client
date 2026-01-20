# External Integrations

**Analysis Date:** 2026-01-20

## APIs & External Services

**Telegram MTProto API:**
- Service: Telegram messaging platform
- SDK/Client: `telegram` (GramJS) v2.26.22
- Auth: API ID + API hash from https://my.telegram.org
- Protocol: MTProto 2.0 (encrypted)

**Telegram Service Implementation:**
- File: `src/services/telegram.ts`
- Factory: `createTelegramService(options)`
- Mock: `src/services/telegram.mock.ts` for testing

## Data Storage

**Databases:**
- None - No external database

**Local Storage:**
- Configuration: `~/.config/telegram-console-client/config.json`
- Session: `~/.config/telegram-console-client/session`
- Format: JSON for config, string for session

**File Operations (`src/config/index.ts`):**
```typescript
// Config read/write
loadConfig(customDir?)
saveConfig(config, customDir?)
loadConfigWithEnvOverrides(customDir?)
```

**Caching:**
- In-memory only via React state
- Messages cached per chat in `state.messages` Record
- No persistent cache

## Authentication & Identity

**Auth Provider:**
- Telegram (native MTProto authentication)

**Authentication Methods:**
1. QR Code (primary) - `src/components/Setup/index.tsx`
2. Phone Number (alternative) - `src/components/Setup/PhoneAuth.tsx`

**Auth Flow (`src/components/Setup/index.tsx`):**
1. User enters API credentials (apiId, apiHash)
2. App connects to Telegram
3. QR code displayed for mobile scan
4. 2FA password prompt if enabled
5. Session string saved to disk

**Session Management:**
- Session type: `StringSession` from `telegram/sessions`
- Persistence: Written to `~/.config/telegram-console-client/session`
- Restoration: Loaded on app startup if exists

## Monitoring & Observability

**Error Tracking:**
- None - Console only

**Logs:**
- Console output
- Configurable via `TG_LOG_LEVEL` env var

## CI/CD & Deployment

**Hosting:**
- CLI application (no server hosting)
- npm package distribution

**CI Pipeline:**
- Not detected in repository

## Environment Configuration

**Required env vars (for env override):**
- `TG_API_ID` - Overrides config file apiId
- `TG_API_HASH` - Overrides config file apiHash

**Optional env vars:**
- `TG_SESSION_MODE` - persistent/ephemeral
- `TG_LOG_LEVEL` - quiet/info/verbose
- `TG_AUTH_METHOD` - qr/phone

**Env loading (`src/config/index.ts`):**
```typescript
export function loadConfigWithEnvOverrides(customDir?: string): AppConfig | null {
  const config = loadConfig(customDir);
  if (!config) return null;

  return {
    ...config,
    apiId: process.env.TG_API_ID
      ? (/^\d+$/.test(process.env.TG_API_ID) ? parseInt(process.env.TG_API_ID, 10) : process.env.TG_API_ID)
      : config.apiId,
    apiHash: process.env.TG_API_HASH ?? config.apiHash,
    // ... other overrides
  };
}
```

## Webhooks & Callbacks

**Incoming:**
- None - Client-side application

**Outgoing:**
- None

## Real-time Communication

**Event Handling (`src/services/telegram.ts`):**
- `NewMessage` events from GramJS
- Callback-based: `onNewMessage(callback)`
- Connection state changes: `onConnectionStateChange(callback)`

**Message Flow:**
```
Telegram Server → MTProto → GramJS Client → NewMessage Event → Callback → React State
```

## Telegram API Usage

**Endpoints Used:**
- `client.connect()` - Establish connection
- `client.disconnect()` - Close connection
- `client.getDialogs()` - Fetch chat list (limit: 100)
- `client.getMessages()` - Fetch messages (limit: 50)
- `client.sendMessage()` - Send text message
- `client.signInUserWithQrCode()` - QR authentication

**Service Interface (`src/types/index.ts`):**
```typescript
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

## Security Considerations

**Credentials:**
- API credentials stored in plain JSON config file
- Session string stored in plain text file
- No encryption at rest

**Network:**
- MTProto provides end-to-end encryption for transport
- All communication via Telegram's MTProto protocol

---

*Integration audit: 2026-01-20*
