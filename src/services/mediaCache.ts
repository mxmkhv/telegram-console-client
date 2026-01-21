import { LRUCache } from 'lru-cache';

interface CachedMedia {
  buffer: Buffer;
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
      mediaCache.set(messageId, { buffer });
    }
    return buffer;
  } finally {
    pendingDownloads.delete(messageId);
  }
}

export function clearCache(): void {
  mediaCache.clear();
  pendingDownloads.clear();
}
