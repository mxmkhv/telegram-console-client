# Codebase Concerns

**Analysis Date:** 2026-01-20

## Tech Debt

**Unused Variables Suppressed with void:**
- Issue: Variables are declared but marked as unused with `void` statements instead of being removed or utilized
- Files: `src/components/Setup/index.tsx` (lines 24, 34)
- Impact: Code clarity suffers; `isLoading` and `preferredAuthMethod` props are accepted but never used
- Fix approach: Either implement loading states using `isLoading` or remove the unused variables. The `preferredAuthMethod` prop suggests incomplete auth method switching functionality.

**Unused onSelectChat Prop:**
- Issue: `onSelectChat` prop is destructured with underscore prefix (`_onSelectChat`) but never used
- Files: `src/components/ChatList.tsx` (line 13)
- Impact: Chat selection via click/callback is not implemented; only keyboard navigation works
- Fix approach: Either remove the prop from the interface or implement click-based selection

**Synchronous require() Calls in React Effects:**
- Issue: Using CommonJS `require()` inside useEffect for fs, path, and os modules
- Files: `src/app.tsx` (lines 201-210, 219-224, 239-242)
- Impact: Non-standard pattern for ESM project; potential issues with bundling; code duplication across three locations
- Fix approach: Move file operations to a dedicated service module; import at top of file using ESM syntax

**Session Handling Duplicated:**
- Issue: Session read/write logic is duplicated in multiple places
- Files: `src/app.tsx` (lines 199-227, 236-244)
- Impact: Maintenance burden; inconsistent error handling; easy to miss updates
- Fix approach: Create a `SessionService` in `src/services/` to centralize session persistence

**TypeScript Escape Hatch:**
- Issue: `@ts-expect-error` used to work around GramJS type mismatch
- Files: `src/services/telegram.ts` (line 16)
- Impact: Type safety compromised for apiId parameter
- Fix approach: Create proper type assertion or update to match GramJS expectations

## Known Bugs

**No Error Handling on Connection Failure:**
- Symptoms: App may hang or crash silently if Telegram connection fails
- Files: `src/app.tsx` (lines 24-39)
- Trigger: Network issues, invalid credentials, or Telegram server unavailability
- Workaround: Restart the application

**Silent Session Read/Write Failures:**
- Symptoms: Session not persisted; user must re-authenticate
- Files: `src/app.tsx` (lines 209-210, 225-226)
- Trigger: Permissions issues, disk full, or corrupted session file
- Workaround: None; errors are silently swallowed with empty catch blocks

## Security Considerations

**API Credentials Stored in Plain Text:**
- Risk: Config file at `~/.config/telegram-console-client/config.json` stores API hash in plain text
- Files: `src/config/index.ts` (line 36)
- Current mitigation: File stored in user's home directory with default permissions
- Recommendations: Consider using system keychain (keytar) or encrypting sensitive config values

**Session Token Stored in Plain Text:**
- Risk: Session file at `~/.config/telegram-console-client/session` stores Telegram session string unencrypted
- Files: `src/app.tsx` (lines 205-207, 223-224)
- Current mitigation: File stored in user's config directory
- Recommendations: Use OS keychain for session storage; add file permission checks

**.env File Contains Real Credentials:**
- Risk: `.env` file in repo root contains actual API credentials
- Files: `.env` (lines 1-4)
- Current mitigation: `.env` is in `.gitignore`
- Recommendations: Remove `.env` from working directory or ensure it's example-only values

## Performance Bottlenecks

**No Message Pagination:**
- Problem: All messages for a chat are loaded at once (up to 50)
- Files: `src/services/telegram.ts` (line 82), `src/app.tsx` (lines 43-50)
- Cause: Fixed limit without lazy loading or pagination
- Improvement path: Implement virtual scrolling and load-on-demand for messages

**No Chat List Pagination:**
- Problem: Only first 100 dialogs are fetched
- Files: `src/services/telegram.ts` (line 71)
- Cause: Fixed limit in getDialogs call
- Improvement path: Implement infinite scroll or paginated loading for chat list

**Messages Re-fetched on Every Chat Selection:**
- Problem: Selecting a chat always triggers a full message fetch
- Files: `src/app.tsx` (lines 42-51)
- Cause: No caching or staleness check before fetching
- Improvement path: Add cache invalidation strategy; only fetch if messages are stale or missing

## Fragile Areas

**Setup Component State Machine:**
- Files: `src/components/Setup/index.tsx`
- Why fragile: Complex state management with multiple steps, password promise resolution via refs, and async callbacks
- Safe modification: Ensure promise resolution is always called; test all auth flows
- Test coverage: Only basic render tests exist; no coverage for auth flows

**useInput Handlers in MainApp:**
- Files: `src/app.tsx` (lines 75-132)
- Why fragile: Two separate useInput hooks with `isActive` conditions; keyboard handling logic is split
- Safe modification: Test all keyboard shortcuts after changes; ensure focus states are correctly managed
- Test coverage: No unit tests for keyboard navigation

**TelegramClient Lifecycle:**
- Files: `src/services/telegram.ts`, `src/components/Setup/index.tsx`
- Why fragile: Client created in Setup but used elsewhere; connection/disconnection not fully managed
- Safe modification: Ensure client cleanup on unmount; test reconnection scenarios
- Test coverage: Only mock service tested; real client untested

## Scaling Limits

**In-Memory Message Storage:**
- Current capacity: All messages for all open chats stored in React state
- Limit: Memory issues with many chats or long message histories
- Scaling path: Implement local database (SQLite) for message persistence; load only visible messages

**Single Event Handler Architecture:**
- Current capacity: One callback per event type (onConnectionStateChange, onNewMessage)
- Limit: Cannot have multiple listeners; limits extensibility
- Scaling path: Implement event emitter pattern for multiple subscribers

## Dependencies at Risk

**telegram (GramJS) Library:**
- Risk: Complex library with many edge cases; version 2.26.22 may have undocumented behaviors
- Impact: Auth flows, message handling, and connection management all depend on this
- Migration plan: Abstract behind TelegramService interface (partially done); can swap implementations

**qrcode-terminal:**
- Risk: Unmaintained package (last update 2018); limited terminal compatibility
- Impact: QR code display may not work on all terminals
- Migration plan: Consider alternative QR libraries or inline QR rendering

## Missing Critical Features

**No Reconnection Logic:**
- Problem: If connection drops, app does not attempt to reconnect
- Blocks: Reliable long-term usage; mobile/laptop sleep recovery

**No Error Display to User:**
- Problem: Errors are logged or swallowed but not shown in UI
- Blocks: User cannot understand why operations fail

**No Logout/Account Switching:**
- Problem: No way to log out or switch Telegram accounts
- Blocks: Multi-account workflows; testing with different accounts

**No Media Support:**
- Problem: Only text messages are displayed; media messages show as empty or "[Media]"
- Blocks: Full Telegram usage; viewing photos, documents, stickers

**No Message Search:**
- Problem: Cannot search through message history
- Blocks: Finding old conversations; productivity workflows

## Test Coverage Gaps

**Setup Flow Untested:**
- What's not tested: QR code auth, phone auth, 2FA password flow
- Files: `src/components/Setup/index.tsx`, `src/components/Setup/QrAuth.tsx`, `src/components/Setup/PhoneAuth.tsx`
- Risk: Auth regressions could lock users out
- Priority: High

**Keyboard Navigation Untested:**
- What's not tested: Panel switching, chat selection, message scrolling
- Files: `src/app.tsx` (lines 75-132)
- Risk: Keyboard shortcuts could break without notice
- Priority: Medium

**Real Telegram Service Untested:**
- What's not tested: Actual Telegram API integration
- Files: `src/services/telegram.ts`
- Risk: API changes or edge cases may cause crashes
- Priority: High (but requires test credentials)

**Component Error States Untested:**
- What's not tested: Loading states, error displays, empty states
- Files: All components in `src/components/`
- Risk: Poor UX when errors occur
- Priority: Medium

---

*Concerns audit: 2026-01-20*
