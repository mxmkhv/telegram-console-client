import React, { memo, useState, useEffect, useMemo } from 'react';
import { Text, Box } from 'ink';
import type { Message } from '../types/index.js';
import { getMediaBuffer } from '../services/mediaCache.js';
import { renderInlinePreview, calculatePreviewDimensions, type PreviewResult } from '../services/imageRenderer.js';

interface Props {
  message: Message;
  downloadMedia: (message: Message) => Promise<Buffer | undefined>;
}

export const MediaPreview = memo(function MediaPreview({ message, downloadMedia }: Props) {
  const messageId = message.id;
  const media = message.media!;

  // Calculate optimal preview dimensions from image aspect ratio
  const { width: previewWidth, height: previewHeight } = useMemo(() => {
    const imgWidth = media.width ?? 100;
    const imgHeight = media.height ?? 100;
    return calculatePreviewDimensions(imgWidth, imgHeight);
  }, [media.width, media.height]);

  // State for preview result (includes image and actual dimensions)
  const [previewResult, setPreviewResult] = useState<PreviewResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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

        const result = await renderInlinePreview(buffer, previewWidth, previewHeight);
        if (cancelled) return;

        setPreviewResult(result);
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
  }, [messageId, message, downloadMedia, previewWidth, previewHeight]);

  if (loading) {
    return (
      <Box borderStyle="round" paddingX={1}>
        <Text dimColor>Loading...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box borderStyle="round" paddingX={1}>
        <Text color="red">{error}</Text>
      </Box>
    );
  }

  if (!previewResult) return null;

  // Box size: actual image dimensions + border (2 chars each side)
  const _boxWidth = previewResult.width + 2;
  const _boxHeight = previewResult.height + 2;

  return (
    <Box borderStyle="round" flexDirection="column">
      <Box width={previewResult.width} height={previewResult.height} overflow="hidden">
        <Text>{previewResult.image}</Text>
      </Box>
    </Box>
  );
});
