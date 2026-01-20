# Media Display Feature Design

## Overview

Add image, sticker, and GIF display support to the TUI Telegram client with progressive disclosure UX: placeholder → inline preview → full side panel view.

## Decisions

| Decision | Choice |
|----------|--------|
| Media types | Photos, stickers (static rendered, animated metadata), GIFs |
| Rendering engine | `terminal-image` (ANSI blocks), configurable later |
| Display levels | Placeholder → inline preview (selected) → side panel (Enter) |
| Panel layout | Right side, ~40% width, split view |
| Caching | Download on demand only, no disk cache |
| Sticker handling | Static WebP rendered, animated/video show metadata |
| GIF handling | Static thumbnail normally, animate in panel (stretch) |
| Panel controls | Focus panel on open, Enter/Escape to close |
| Metadata format | Type + size + dimensions `[📷 Photo: 1.2MB, 1920x1080]` |

## Data Model

### New Types (`src/types/index.ts`)

```typescript
type MediaType = 'photo' | 'sticker' | 'gif' | 'video' | 'document';

interface MediaAttachment {
  type: MediaType;
  fileSize?: number;
  width?: number;
  height?: number;
  mimeType?: string;
  emoji?: string;           // for stickers
  isAnimated?: boolean;     // TGS/video stickers
  fileName?: string;
  _message: Api.Message;    // GramJS reference for download
}

interface Message {
  id: number;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: Date;
  isOutgoing: boolean;
  media?: MediaAttachment;  // NEW
}
```

### State Extensions (`src/state/reducer.ts`)

```typescript
interface AppState {
  // ... existing fields
  mediaPanel: {
    isOpen: boolean;
    messageId: number | null;
    loading: boolean;
    imageData: string | null;  // ANSI string from terminal-image
    error: string | null;
  };
}
```

### New Actions

```typescript
type Action =
  | { type: 'OPEN_MEDIA_PANEL'; payload: { messageId: number } }
  | { type: 'CLOSE_MEDIA_PANEL' }
  | { type: 'SET_MEDIA_LOADING'; payload: boolean }
  | { type: 'SET_MEDIA_DATA'; payload: string }
  | { type: 'SET_MEDIA_ERROR'; payload: string }
```

## GramJS Media Extraction

### Extract Media from Messages (`src/services/telegram.ts`)

```typescript
import { Api } from "telegram";

function extractMedia(msg: Api.Message): MediaAttachment | undefined {
  const { media } = msg;
  if (!media) return undefined;

  // Photo
  if (media.className === 'MessageMediaPhoto' && media.photo) {
    const photo = media.photo as Api.Photo;
    const largest = photo.sizes?.slice(-1)[0] as any;
    return {
      type: 'photo',
      fileSize: largest?.size,
      width: largest?.w,
      height: largest?.h,
      mimeType: 'image/jpeg',
      _message: msg,
    };
  }

  // Document (stickers, GIFs, files)
  if (media.className === 'MessageMediaDocument' && media.document) {
    const doc = media.document as Api.Document;
    const attrs = doc.attributes || [];

    // Check for sticker
    const stickerAttr = attrs.find(a => a.className === 'DocumentAttributeSticker');
    if (stickerAttr) {
      const isAnimated = doc.mimeType === 'application/x-tgsticker'
                      || doc.mimeType === 'video/webm';
      return {
        type: 'sticker',
        fileSize: Number(doc.size),
        emoji: (stickerAttr as any).alt,
        isAnimated,
        mimeType: doc.mimeType,
        _message: msg,
      };
    }

    // Check for GIF/animation
    const isAnimated = attrs.some(a => a.className === 'DocumentAttributeAnimated');
    if (isAnimated || doc.mimeType === 'video/mp4') {
      const videoAttr = attrs.find(a => a.className === 'DocumentAttributeVideo') as any;
      return {
        type: 'gif',
        fileSize: Number(doc.size),
        width: videoAttr?.w,
        height: videoAttr?.h,
        mimeType: doc.mimeType,
        _message: msg,
      };
    }
  }

  return undefined;
}
```

### Download Method

```typescript
async downloadMedia(message: Message): Promise<Buffer | undefined> {
  if (!message.media?._message) return undefined;
  const buffer = await client.downloadMedia(message.media._message, {});
  return buffer as Buffer;
}
```

## Component Architecture

### File Structure

```
src/components/
├── MessageView.tsx      (modified - add inline previews)
├── MediaPlaceholder.tsx (NEW - renders [📷 Photo: 1.2MB])
├── MediaPreview.tsx     (NEW - small inline preview when selected)
├── MediaPanel.tsx       (NEW - full side panel view)
└── App.tsx              (modified - add panel to layout)
```

### Layout

```tsx
// Normal layout:
<Box flexDirection="row">
  <ChatList width={35} />
  <MessageView flexGrow={1} />
</Box>

// With media panel open:
<Box flexDirection="row">
  <ChatList width={35} />
  <MessageView flexGrow={1} />
  {state.mediaPanel.isOpen && (
    <MediaPanel width="40%" />
  )}
</Box>
```

### Focus Flow

```
Normal:     chatList ←→ messages ←→ input
                          ↓ (Enter on media message)
Panel open: chatList     messages     input
                              ↓
                         mediaPanel (focused)
                              ↓ (Enter/Escape)
                         closes → back to messages
```

## Display States

### Message with Media (Unselected)

```
[10:30] John: Check this out!
[📷 Photo: 1.2MB, 1920x1080]
```

### Message with Media (Selected)

```
[10:30] John: Check this out!
[📷 Photo: 1.2MB, 1920x1080]
┌────────────────────┐
│ ▄▄▀▀▄▄  ▄▄▀▀▄▄    │
│ ██████  ████▀▀    │
│ ▀▀▄▄▀▀  ▀▀▄▄██    │
└────────────────────┘
```

### Media Panel States

```
┌─ Media ─────────────────────┐
│                             │
│      Loading...             │  ← loading state
│                             │
└─────────────────────────────┘

┌─ Media ─────────────────────┐
│                             │
│  ▄▄▀▀▄▄▄▄▀▀▄▄  ▄▄▀▀▄▄      │
│  ████████████  ████▀▀      │  ← loaded image
│  ██▀▀████▀▀██  ▀▀▄▄██      │
│  ▀▀▄▄▀▀▀▀▄▄▀▀  ████▀▀      │
│                             │
│  Photo • 1.2MB • 1920x1080  │  ← metadata footer
└─ Enter/Esc to close ────────┘

┌─ Media ─────────────────────┐
│                             │
│  ⚠ Failed to load image    │  ← error state
│                             │
└─────────────────────────────┘
```

### Metadata Placeholders

```
[📷 Photo: 1.2MB, 1920x1080]
[🎬 GIF: 3.4MB, 320x240]
[😀 Sticker: wave]
[🎭 Animated Sticker: party]
```

## Image Rendering Utilities

### New Service (`src/services/imageRenderer.ts`)

```typescript
import terminalImage from 'terminal-image';

interface RenderOptions {
  width?: number | string;
  height?: number | string;
  preserveAspectRatio?: boolean;
}

export async function renderImageBuffer(
  buffer: Buffer,
  options: RenderOptions = {}
): Promise<string> {
  return terminalImage.buffer(buffer, {
    width: options.width ?? '90%',
    height: options.height,
    preserveAspectRatio: options.preserveAspectRatio ?? true,
  });
}

export async function renderInlinePreview(buffer: Buffer): Promise<string> {
  return terminalImage.buffer(buffer, {
    height: 5,
    preserveAspectRatio: true,
  });
}

export async function renderPanelImage(
  buffer: Buffer,
  panelWidth: number
): Promise<string> {
  return terminalImage.buffer(buffer, {
    width: Math.floor(panelWidth * 0.9),
    preserveAspectRatio: true,
  });
}

// GIF support (stretch goal)
export function renderGif(
  buffer: Buffer,
  panelWidth: number,
  onFrame: (frame: string) => void
): () => void {
  const stopFn = terminalImage.gifBuffer(buffer, {
    width: Math.floor(panelWidth * 0.9),
    renderFrame: onFrame,
  });
  return stopFn;
}
```

### Metadata Formatter

```typescript
export function formatMediaMetadata(media: MediaAttachment): string {
  const icons: Record<string, string> = {
    photo: '📷',
    sticker: '😀',
    gif: '🎬',
    video: '🎥',
    document: '📄',
  };

  const icon = media.isAnimated ? '🎭' : icons[media.type] ?? '📎';
  const size = media.fileSize ? formatBytes(media.fileSize) : '';
  const dims = media.width && media.height ? `${media.width}x${media.height}` : '';
  const emoji = media.emoji ? `: ${media.emoji}` : '';

  const parts = [size, dims].filter(Boolean).join(', ');
  const label = media.type === 'sticker'
    ? `${media.isAnimated ? 'Animated Sticker' : 'Sticker'}${emoji}`
    : capitalize(media.type);

  return `[${icon} ${label}${parts ? `: ${parts}` : ''}]`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}
```

## MessageView Line Calculation

```typescript
function getMessageLineCount(msg: Message, isSelected: boolean): number {
  let lines = msg.text ? msg.text.split("\n").length : 0;

  if (msg.media) {
    lines += 1; // placeholder line

    if (isSelected && !msg.media.isAnimated) {
      lines += 6; // inline preview height
    }
  }

  return Math.max(lines, 1);
}
```

## Action Flow

```
User presses Enter on selected media message
         ↓
MessageView checks: does selected message have media?
         ↓ yes
dispatch({ type: 'OPEN_MEDIA_PANEL', payload: { messageId } })
         ↓
Focus moves to mediaPanel
         ↓
useEffect triggers download:
  1. Get message from state by messageId
  2. Call telegramService.downloadMedia(message)
  3. Convert buffer: terminalImage.buffer(data, { width: '90%' })
  4. dispatch({ type: 'SET_MEDIA_DATA', payload: ansiString })
         ↓
MediaPanel renders the image
```

## Implementation Plan

### Files to Create

| File | Purpose |
|------|---------|
| `src/components/MediaPlaceholder.tsx` | Inline metadata display |
| `src/components/MediaPreview.tsx` | Small inline preview when selected |
| `src/components/MediaPanel.tsx` | Full side panel view |
| `src/services/imageRenderer.ts` | terminal-image wrapper utilities |

### Files to Modify

| File | Changes |
|------|---------|
| `src/types/index.ts` | Add `MediaAttachment` type, extend `Message` |
| `src/services/telegram.ts` | Add `extractMedia()`, `downloadMedia()` |
| `src/state/reducer.ts` | Add `mediaPanel` state, new actions |
| `src/components/MessageView.tsx` | Integrate placeholders, previews, line counting |
| `src/components/App.tsx` | Add MediaPanel to layout, handle focus |

### New Dependencies

```json
{
  "terminal-image": "^3.0.0"
}
```

### Implementation Order

1. Types and data model
2. GramJS media extraction
3. Image renderer utilities
4. MediaPlaceholder component
5. State management updates
6. MessageView integration
7. MediaPanel component
8. App layout changes
9. GIF animation (stretch goal)

## Out of Scope

- Disk caching
- User configuration for rendering mode
- Sending media
- Video playback
- Voice messages
