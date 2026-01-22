# TUI Design Refresh

**Date:** 2026-01-22
**Status:** Approved
**Goal:** Improve visual aesthetics and UX while maintaining all existing functionality

---

## Overview

A visual refresh of the Telegram Console TUI application focusing on:
- Premium welcome splash screen with gradient text
- Modernized border treatment (round borders throughout)
- Refined color system for focus states
- Improved spacing and typography hierarchy

All existing functionality remains unchanged.

---

## 1. Welcome Splash Screen

### Structure
Full-screen centered splash replacing current `WelcomeNew` and `WelcomeBack` components. No borders - the big text floats in the center with generous negative space.

### Visual Layout
```
                    (empty space)


         ████████╗███████╗██╗     ███████╗ ██████╗ ██████╗  █████╗ ███╗   ███╗
         ╚══██╔══╝██╔════╝██║     ██╔════╝██╔════╝ ██╔══██╗██╔══██╗████╗ ████║
            ██║   █████╗  ██║     █████╗  ██║  ███╗██████╔╝███████║██╔████╔██║
            ██║   ██╔══╝  ██║     ██╔══╝  ██║   ██║██╔══██╗██╔══██║██║╚██╔╝██║
            ██║   ███████╗███████╗███████╗╚██████╔╝██║  ██║██║  ██║██║ ╚═╝ ██║
            ╚═╝   ╚══════╝╚══════╝╚══════╝ ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝

                              ██████╗ ██████╗ ███╗   ██╗███████╗ ██████╗ ██╗     ███████╗
                             ██╔════╝██╔═══██╗████╗  ██║██╔════╝██╔═══██╗██║     ██╔════╝
                             ██║     ██║   ██║██╔██╗ ██║███████╗██║   ██║██║     █████╗
                             ██║     ██║   ██║██║╚██╗██║╚════██║██║   ██║██║     ██╔══╝
                             ╚██████╗╚██████╔╝██║ ╚████║███████║╚██████╔╝███████╗███████╗
                              ╚═════╝ ╚═════╝ ╚═╝  ╚═══╝╚══════╝ ╚═════╝ ╚══════╝╚══════╝

                                              v1.0.0
                                      Press any key to continue

                    (empty space)
```

### Implementation Details
- Use `ink-big-text` with `font="block"` for large ASCII text
- Wrap in `ink-gradient` with `colors={['cyan', 'blue']}`
- Version text: `<Text dimColor>v1.0.0</Text>`
- Hint text: `<Text dimColor>Press any key to continue</Text>`
- Center using `<Box alignItems="center" justifyContent="center" flexGrow={1}>`

### Performance Note
Gradient rendering only occurs on this screen. Component unmounts completely when entering MainApp - zero gradient overhead during normal use.

---

## 2. Border System

### Treatment
All panels use `borderStyle="round"` for a softer, modern aesthetic.

### Focus Indication
Focus is indicated purely through border color, not border style:

| Panel State | Border Color | Text Color |
|-------------|--------------|------------|
| **Focused** | `cyan` | Standard (white) |
| **Unfocused** | `blue` | `dimColor` for headers |

### Affected Components
- `HeaderBar` - round border
- `ChatList` - round border
- `MessageView` - round border
- `InputBar` - round border
- `StatusBar` - round border
- `MediaPanel` - already round, ensure color system matches

---

## 3. Color System

### Palette
| Role | Color | Usage |
|------|-------|-------|
| **Active/Focus** | `cyan` | Focused panel borders, active elements |
| **Inactive** | `blue` | Unfocused panel borders |
| **Primary text** | White (default) | Message content, sender names |
| **Secondary text** | `dimColor` | Timestamps, metadata, hints |
| **Status: Connected** | `green` | Connection indicator |
| **Status: Connecting** | `yellow` | Connection indicator |
| **Status: Error** | `red` | Errors, disconnected state |

### Application
- Focused panel: cyan border, white text
- Unfocused panel: blue border, dimmed header text
- Selected list item: `inverse` (background/foreground swap)
- Unread indicator: `●` in cyan

---

## 4. Spacing & Padding

### Philosophy
"Negative space indicates a premium tool" - generous padding creates breathing room.

### Rules
- **Horizontal padding:** 1 character (`paddingX={1}`) on all content panels
- **Vertical padding:** Contextual - headers get `paddingY={0}`, content areas get spacing between items
- **Message spacing:** One empty line between messages from different senders
- **Consecutive messages:** Same sender = no extra spacing, omit repeated sender name

---

## 5. Typography Hierarchy

### Message View

| Element | Style | Rationale |
|---------|-------|-----------|
| **Sender name** | `bold` | Primary anchor for scanning |
| **Timestamp** | `dimColor`, right-aligned | Present but unobtrusive |
| **Message text** | Standard white | Maximum readability |
| **Media indicators** | `dimColor` with emoji prefix | Distinct from text content |
| **Your messages** | Sender shows as "You" | Clear self-identification |

### Example
```
╭──────────────────────────────────────────────────────────────────────────────╮
│                                                                              │
│  Alice                                                         10:30 AM     │
│  Hey, how are you?                                                          │
│                                                                              │
│  You                                                           10:32 AM     │
│  Doing great! Working on the TUI refresh.                                   │
│                                                                              │
│  Alice                                                         10:33 AM     │
│  Nice! Can't wait to see it.                                                │
│                                                                              │
╰──────────────────────────────────────────────────────────────────────────────╯
```

### Chat List
- Selected chat: `inverse` styling
- Unread indicator: `●` in cyan before chat name
- Chat preview: `dimColor` snippet below name (if space permits)

---

## 6. Main Layout Reference

```
╭──────────────────────────────────────────────────────────────────────────────╮
│  TELEGRAM CONSOLE                                      [Settings] [Logout]   │
╰──────────────────────────────────────────────────────────────────────────────╯
╭─────────────────────╮ ╭──────────────────────────────────────────────────────╮
│                     │ │                                                      │
│   Chat List         │ │   Message View                                       │
│   (cyan when        │ │   (cyan when focused)                                │
│    focused)         │ │                                                      │
│                     │ │                                                      │
│   ● Alice           │ │   Alice                              10:30 AM        │
│     Bob             │ │   Hey, how are you?                                  │
│     Work Group      │ │                                                      │
│                     │ │   You                                10:32 AM        │
│                     │ │   Doing great! Working on the TUI.                   │
│                     │ │                                                      │
╰─────────────────────╯ ╰──────────────────────────────────────────────────────╯
╭──────────────────────────────────────────────────────────────────────────────╮
│  > Type a message...                                                         │
╰──────────────────────────────────────────────────────────────────────────────╯
╭──────────────────────────────────────────────────────────────────────────────╮
│  ● Connected                                                 Tab: switch     │
╰──────────────────────────────────────────────────────────────────────────────╯
```

---

## 7. Package Dependencies

```json
{
  "ink-big-text": "^2.0.0",
  "ink-gradient": "^3.0.0"
}
```

---

## 8. Implementation Checklist

### New Components
- [ ] `WelcomeSplash.tsx` - Full-screen gradient welcome screen

### Modified Components
- [ ] `HeaderBar.tsx` - Round border, padding, focus colors
- [ ] `ChatList.tsx` - Round border, padding, focus colors, unread styling
- [ ] `MessageView.tsx` - Round border, padding, typography hierarchy
- [ ] `InputBar.tsx` - Round border, padding, focus colors
- [ ] `StatusBar.tsx` - Round border, consistent styling
- [ ] `MediaPanel.tsx` - Ensure focus color system matches
- [ ] `App.tsx` - Integrate WelcomeSplash, update welcome flow

### Package Installation
- [ ] Install `ink-big-text`
- [ ] Install `ink-gradient`

---

## 9. Non-Goals

The following remain unchanged:
- Keyboard navigation and shortcuts
- Focus management system
- State management architecture
- All existing features and functionality
- Panel dimensions and layout ratios
