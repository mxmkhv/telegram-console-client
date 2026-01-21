import React, { memo, useState, useEffect } from 'react';
import { Text, Box } from 'ink';
import type { Message } from '../types/index.js';
import { getMediaBuffer, getCachedInlinePreview, setCachedInlinePreview } from '../services/mediaCache.js';
import { renderInlinePreview } from '../services/imageRenderer.js';

interface Props {
  message: Message;
  downloadMedia: (message: Message) => Promise<Buffer | undefined>;
}

export const MediaPreview = memo(function MediaPreview({ message, downloadMedia }: Props) {
  const messageId = message.id;

  // Synchronous cache check - no flicker on cache hit
  const cachedPreview = getCachedInlinePreview(messageId);
  const [preview, setPreview] = useState<string | null>(cachedPreview);
  const [loading, setLoading] = useState(!cachedPreview);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cachedPreview) return;

    let cancelled = false;

    // 200ms debounce - cancel pending on selection change
    const timeoutId = setTimeout(async () => {
      if (cancelled) return;

      try {
        const buffer = await getMediaBuffer(messageId, () => downloadMedia(message));
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
    }, 200); // 200ms debounce

    return () => {
      cancelled = true;
      clearTimeout(timeoutId); // Cancel pending debounced download
    };
  }, [messageId, cachedPreview, message, downloadMedia]);

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
        <Text color="red">Warning: {error}</Text>
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
