# Media Display Feature Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add image, sticker, and GIF display support to the TUI Telegram client with progressive disclosure UX (placeholder → inline preview → full side panel view).

**Architecture:** Three-layer display system with LRU-cached media downloads. MediaPlaceholder shows metadata, MediaPreview renders inline when selected, MediaPanel shows full view on Enter. All components memoized to prevent re-renders.

**Tech Stack:** React/Ink TUI, GramJS, terminal-image for ANSI rendering, lru-cache for in-memory caching

---

## Task 1: Add MediaAttachment Type and Extend Message

**Files:**
- Modify: `src/types/index.ts`

**Step 1: Add the MediaType union and MediaAttachment interface**

```typescript
// Add after existing type definitions

export type MediaType = 'photo' | 'sticker' | 'gif' | 'video' | 'document';

export interface MediaAttachment {
  type: MediaType;
  fileSize?: number;
  width?: number;
  height?: number;
  mimeType?: string;
  emoji?: string;           // for stickers
  isAnimated?: boolean;     // TGS/video stickers
  fileName?: string;
  _message: import('telegram').Api.Message;    // GramJS reference for download
}
```

**Step 2: Extend Message interface**

Find the existing `Message` interface and add:

```typescript
export interface Message {
  // ... existing fields
  media?: MediaAttachment;  // NEW
}
```

**Step 3: Verify typecheck**

Run: `bun run typecheck`
Expected: PASS (no errors)

**Step 4: Commit**

```bash
git add src/types/index.ts
git commit -m "$(cat <<'EOF'
feat(types): add MediaAttachment type and extend Message interface

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Add extractMedia Function

**Files:**
- Modify: `src/services/telegram.ts`

**Step 1: Add the extractMedia function**

```typescript
import { Api } from "telegram";
import type { MediaAttachment } from "../types/index.js";

function extractMedia(msg: Api.Message): MediaAttachment | undefined {
  const { media } = msg;
  if (!media) return undefined;

  // Photo
  if (media.className === 'MessageMediaPhoto' && media.photo) {
    const photo = media.photo as Api.Photo;
    const largest = photo.sizes?.slice(-1)[0] as Api.TypePhotoSize & { size?: number; w?: number; h?: number };
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
    const stickerAttr = attrs.find(a => a.className === 'DocumentAttributeSticker') as Api.DocumentAttributeSticker | undefined;
    if (stickerAttr) {
      const isAnimated = doc.mimeType === 'application/x-tgsticker'
                      || doc.mimeType === 'video/webm';
      return {
        type: 'sticker',
        fileSize: Number(doc.size),
        emoji: stickerAttr.alt,
        isAnimated,
        mimeType: doc.mimeType,
        _message: msg,
      };
    }

    // Check for GIF/animation
    const hasAnimatedAttr = attrs.some(a => a.className === 'DocumentAttributeAnimated');
    if (hasAnimatedAttr || doc.mimeType === 'video/mp4') {
      const videoAttr = attrs.find(a => a.className === 'DocumentAttributeVideo') as Api.DocumentAttributeVideo | undefined;
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

**Step 2: Verify typecheck**

Run: `bun run typecheck`
Expected: PASS

**Step 3: Commit**

```bash
git add src/services/telegram.ts
git commit -m "$(cat <<'EOF'
feat(telegram): add extractMedia function for GramJS messages

Extracts photos, stickers, and GIFs from Api.Message with metadata.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Add downloadMedia Method

**Files:**
- Modify: `src/services/telegram.ts`

**Step 1: Add the downloadMedia method to the telegram service class/object**

```typescript
async downloadMedia(message: Message): Promise<Buffer | undefined> {
  if (!message.media?._message) return undefined;
  const buffer = await this.client.downloadMedia(message.media._message, {});
  return buffer as Buffer;
}
```

**Step 2: Verify typecheck**

Run: `bun run typecheck`
Expected: PASS

**Step 3: Commit**

```bash
git add src/services/telegram.ts
git commit -m "$(cat <<'EOF'
feat(telegram): add downloadMedia method

Downloads media buffer from Telegram servers using GramJS.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Install lru-cache Dependency

**Step 1: Install package**

Run: `bun add lru-cache`

**Step 2: Verify installation**

Run: `cat package.json | grep lru-cache`
Expected: Shows lru-cache in dependencies

**Step 3: Commit**

```bash
git add package.json bun.lockb
git commit -m "$(cat <<'EOF'
chore(deps): add lru-cache for media caching

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Create mediaCache Service

**Files:**
- Create: `src/services/mediaCache.ts`

**Step 1: Create the media cache service**

```typescript
import { LRUCache } from 'lru-cache';

interface CachedMedia {
  buffer: Buffer;
  inlinePreview: string | null;
  panelImage: string | null;
}

const mediaCache = new LRUCache<number, CachedMedia>({
  max: 50,
  maxSize: 100 * 1024 * 1024, // 100MB
  sizeCalculation: (value) => value.buffer.length,
});

const pendingDownloads = new Map<number, Promise<Buffer | undefined>>();

export async function getMediaBuffer(
  messageId: number,
  downloadFn: () => Promise<Buffer | undefined>
): Promise<Buffer | undefined> {
  const cached = mediaCache.get(messageId);
  if (cached) return cached.buffer;

  const pending = pendingDownloads.get(messageId);
  if (pending) return pending;

  const downloadPromise = downloadFn();
  pendingDownloads.set(messageId, downloadPromise);

  try {
    const buffer = await downloadPromise;
    if (buffer) {
      mediaCache.set(messageId, {
        buffer,
        inlinePreview: null,
        panelImage: null,
      });
    }
    return buffer;
  } finally {
    pendingDownloads.delete(messageId);
  }
}

export function getCachedInlinePreview(messageId: number): string | null {
  return mediaCache.get(messageId)?.inlinePreview ?? null;
}

export function setCachedInlinePreview(messageId: number, preview: string): void {
  const cached = mediaCache.get(messageId);
  if (cached) {
    cached.inlinePreview = preview;
  }
}

export function getCachedPanelImage(messageId: number): string | null {
  return mediaCache.get(messageId)?.panelImage ?? null;
}

export function setCachedPanelImage(messageId: number, image: string): void {
  const cached = mediaCache.get(messageId);
  if (cached) {
    cached.panelImage = image;
  }
}

export function clearCache(): void {
  mediaCache.clear();
  pendingDownloads.clear();
}
```

**Step 2: Verify typecheck**

Run: `bun run typecheck`
Expected: PASS

**Step 3: Commit**

```bash
git add src/services/mediaCache.ts
git commit -m "$(cat <<'EOF'
feat(services): add mediaCache with LRU eviction and request deduplication

- 50 item / 100MB max cache
- pendingDownloads prevents duplicate concurrent requests
- Caches both buffer and rendered ANSI strings

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Install terminal-image Dependency

**Step 1: Install package**

Run: `bun add terminal-image`

**Step 2: Verify installation**

Run: `cat package.json | grep terminal-image`
Expected: Shows terminal-image in dependencies

**Step 3: Commit**

```bash
git add package.json bun.lockb
git commit -m "$(cat <<'EOF'
chore(deps): add terminal-image for ANSI image rendering

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Create imageRenderer Service

**Files:**
- Create: `src/services/imageRenderer.ts`

**Step 1: Create the image renderer service**

```typescript
import terminalImage from 'terminal-image';
import type { MediaAttachment } from '../types/index.js';

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

// Memoization caches
const formatBytesCache = new Map<number, string>();

function formatBytes(bytes: number): string {
  const cached = formatBytesCache.get(bytes);
  if (cached) return cached;

  let result: string;
  if (bytes < 1024) {
    result = `${bytes}B`;
  } else if (bytes < 1024 * 1024) {
    result = `${(bytes / 1024).toFixed(1)}KB`;
  } else {
    result = `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  }

  formatBytesCache.set(bytes, result);
  return result;
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const metadataCache = new Map<number, string>();

export function formatMediaMetadata(media: MediaAttachment, messageId: number): string {
  const cached = metadataCache.get(messageId);
  if (cached) return cached;

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

  const result = `[${icon} ${label}${parts ? `: ${parts}` : ''}]`;
  metadataCache.set(messageId, result);
  return result;
}
```

**Step 2: Verify typecheck**

Run: `bun run typecheck`
Expected: PASS

**Step 3: Commit**

```bash
git add src/services/imageRenderer.ts
git commit -m "$(cat <<'EOF'
feat(services): add imageRenderer with terminal-image wrappers

- renderInlinePreview for small previews (height: 5)
- renderPanelImage for full panel view
- formatMediaMetadata with memoization

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: Add mediaPanel State and Actions to Reducer

**Files:**
- Modify: `src/state/reducer.ts`

**Step 1: Add state interface extensions**

Add to AppState interface:

```typescript
mediaPanel: {
  isOpen: boolean;
  messageId: number | null;
  loading: boolean;
  imageData: string | null;
  error: string | null;
};
inlinePreviews: Map<number, {
  loading: boolean;
  imageData: string | null;
  error: string | null;
}>;
```

**Step 2: Add initial state**

```typescript
mediaPanel: {
  isOpen: false,
  messageId: null,
  loading: false,
  imageData: null,
  error: null,
},
inlinePreviews: new Map(),
```

**Step 3: Add action types**

```typescript
| { type: 'OPEN_MEDIA_PANEL'; payload: { messageId: number } }
| { type: 'CLOSE_MEDIA_PANEL' }
| { type: 'SET_MEDIA_LOADING'; payload: boolean }
| { type: 'SET_MEDIA_DATA'; payload: string }
| { type: 'SET_MEDIA_ERROR'; payload: string }
| { type: 'SET_INLINE_PREVIEW_LOADING'; payload: { messageId: number } }
| { type: 'SET_INLINE_PREVIEW_DATA'; payload: { messageId: number; imageData: string } }
| { type: 'SET_INLINE_PREVIEW_ERROR'; payload: { messageId: number; error: string } }
```

**Step 4: Add reducer cases**

```typescript
case 'OPEN_MEDIA_PANEL':
  return {
    ...state,
    mediaPanel: {
      ...state.mediaPanel,
      isOpen: true,
      messageId: action.payload.messageId,
      loading: false,
      imageData: null,
      error: null,
    },
  };

case 'CLOSE_MEDIA_PANEL':
  return {
    ...state,
    mediaPanel: {
      ...state.mediaPanel,
      isOpen: false,
      messageId: null,
      loading: false,
      imageData: null,
      error: null,
    },
  };

case 'SET_MEDIA_LOADING':
  return {
    ...state,
    mediaPanel: {
      ...state.mediaPanel,
      loading: action.payload,
    },
  };

case 'SET_MEDIA_DATA':
  return {
    ...state,
    mediaPanel: {
      ...state.mediaPanel,
      loading: false,
      imageData: action.payload,
      error: null,
    },
  };

case 'SET_MEDIA_ERROR':
  return {
    ...state,
    mediaPanel: {
      ...state.mediaPanel,
      loading: false,
      error: action.payload,
    },
  };

case 'SET_INLINE_PREVIEW_LOADING': {
  const newPreviews = new Map(state.inlinePreviews);
  newPreviews.set(action.payload.messageId, {
    loading: true,
    imageData: null,
    error: null,
  });
  return { ...state, inlinePreviews: newPreviews };
}

case 'SET_INLINE_PREVIEW_DATA': {
  const newPreviews = new Map(state.inlinePreviews);
  newPreviews.set(action.payload.messageId, {
    loading: false,
    imageData: action.payload.imageData,
    error: null,
  });
  return { ...state, inlinePreviews: newPreviews };
}

case 'SET_INLINE_PREVIEW_ERROR': {
  const newPreviews = new Map(state.inlinePreviews);
  newPreviews.set(action.payload.messageId, {
    loading: false,
    imageData: null,
    error: action.payload.error,
  });
  return { ...state, inlinePreviews: newPreviews };
}
```

**Step 5: Verify typecheck**

Run: `bun run typecheck`
Expected: PASS

**Step 6: Commit**

```bash
git add src/state/reducer.ts
git commit -m "$(cat <<'EOF'
feat(state): add mediaPanel and inlinePreviews state management

Actions for opening/closing panel and managing preview loading states.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: Create MediaPlaceholder Component

**Files:**
- Create: `src/components/MediaPlaceholder.tsx`

**Step 1: Create the component**

```tsx
import React, { memo } from 'react';
import { Text } from 'ink';
import type { MediaAttachment } from '../types/index.js';
import { formatMediaMetadata } from '../services/imageRenderer.js';

interface Props {
  media: MediaAttachment;
  messageId: number;
}

export const MediaPlaceholder = memo(function MediaPlaceholder({
  media,
  messageId,
}: Props) {
  const metadata = formatMediaMetadata(media, messageId);
  return <Text dimColor>{metadata}</Text>;
});
```

**Step 2: Verify typecheck**

Run: `bun run typecheck`
Expected: PASS

**Step 3: Commit**

```bash
git add src/components/MediaPlaceholder.tsx
git commit -m "$(cat <<'EOF'
feat(components): add MediaPlaceholder for inline metadata display

Memoized component showing [📷 Photo: 1.2MB, 1920x1080] format.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 10: Create MediaPreview Component

**Files:**
- Create: `src/components/MediaPreview.tsx`

**Step 1: Create the component**

```tsx
import React, { memo, useState, useEffect } from 'react';
import { Text, Box } from 'ink';
import type { MediaAttachment, Message } from '../types/index.js';
import { getMediaBuffer, getCachedInlinePreview, setCachedInlinePreview } from '../services/mediaCache.js';
import { renderInlinePreview } from '../services/imageRenderer.js';
import { telegramService } from '../services/telegram.js';

interface Props {
  message: Message;
}

export const MediaPreview = memo(function MediaPreview({ message }: Props) {
  const messageId = message.id;

  // Synchronous cache check - no flicker on cache hit
  const cachedPreview = getCachedInlinePreview(messageId);
  const [preview, setPreview] = useState<string | null>(cachedPreview);
  const [loading, setLoading] = useState(!cachedPreview);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cachedPreview) return;

    let cancelled = false;

    (async () => {
      try {
        const buffer = await getMediaBuffer(messageId, () =>
          telegramService.downloadMedia(message)
        );
        if (cancelled || !buffer) {
          if (!cancelled && !buffer) {
            setError('Failed to download');
            setLoading(false);
          }
          return;
        }

        const rendered = await renderInlinePreview(buffer);
        if (cancelled) return;

        setCachedInlinePreview(messageId, rendered);
        setPreview(rendered);
        setLoading(false);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unknown error');
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [messageId, cachedPreview, message]);

  if (loading) {
    return (
      <Box borderStyle="round" paddingX={1}>
        <Text dimColor>Loading preview...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box borderStyle="round" paddingX={1}>
        <Text color="red">⚠ {error}</Text>
      </Box>
    );
  }

  if (!preview) return null;

  return (
    <Box borderStyle="round">
      <Text>{preview}</Text>
    </Box>
  );
});
```

**Step 2: Verify typecheck**

Run: `bun run typecheck`
Expected: PASS

**Step 3: Commit**

```bash
git add src/components/MediaPreview.tsx
git commit -m "$(cat <<'EOF'
feat(components): add MediaPreview with cache integration

- Synchronous cache check prevents flicker
- Downloads via mediaCache with deduplication
- Memoized to prevent re-renders

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Tasks 11-18: Continue with Integration

The remaining tasks follow the same pattern:

- **Task 11**: Integrate extractMedia into message fetching in telegram.ts
- **Task 12**: Update MessageView to show MediaPlaceholder
- **Task 13**: Update MessageView to show MediaPreview when selected
- **Task 14**: Create MediaPanel component with full image view
- **Task 15**: Add Enter key handler in MessageView to open panel
- **Task 16**: Update App.tsx layout to include MediaPanel
- **Task 17**: Handle panel close with Enter/Escape keys
- **Task 18**: End-to-end verification

Each task should follow the same structure:
1. Read existing code to understand integration points
2. Make minimal changes
3. Run typecheck
4. Commit with descriptive message

---

## Progress Tracking

Use `progress.json` to track completion status. After each user story passes all acceptance criteria, set `"passes": true`.

## Verification Commands

```bash
# Typecheck
bun run typecheck

# Run the app
bun run dev

# View git log
git log --oneline -10
```
