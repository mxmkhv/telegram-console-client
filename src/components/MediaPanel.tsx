import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import type { Message } from '../types/index.js';
import { getMediaBuffer, getCachedPanelImage, setCachedPanelImage } from '../services/mediaCache.js';
import { renderPanelImage, formatMediaMetadata } from '../services/imageRenderer.js';

interface Props {
  message: Message;
  panelWidth: number;
  downloadMedia: (message: Message) => Promise<Buffer | undefined>;
  onClose: () => void;
  isFocused?: boolean;
}

export function MediaPanel({ message, panelWidth, downloadMedia, onClose, isFocused = true }: Props) {
  const messageId = message.id;
  const media = message.media!;

  // Synchronous cache check
  const cachedImage = getCachedPanelImage(messageId);
  const [image, setImage] = useState<string | null>(cachedImage);
  const [loading, setLoading] = useState(!cachedImage);
  const [error, setError] = useState<string | null>(null);

  // Handle Enter/Escape to close
  useInput((input, key) => {
    if (key.return || key.escape) {
      onClose();
    }
  }, { isActive: isFocused });

  useEffect(() => {
    if (cachedImage) return;

    let cancelled = false;

    (async () => {
      try {
        const buffer = await getMediaBuffer(messageId, () => downloadMedia(message));
        if (cancelled || !buffer) {
          if (!cancelled && !buffer) {
            setError('Failed to download');
            setLoading(false);
          }
          return;
        }

        const rendered = await renderPanelImage(buffer, panelWidth);
        if (cancelled) return;

        setCachedPanelImage(messageId, rendered);
        setImage(rendered);
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
  }, [messageId, cachedImage, message, downloadMedia, panelWidth]);

  const metadata = formatMediaMetadata(media, messageId);

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor="blue"
      width={panelWidth}
      paddingX={1}
    >
      <Box marginBottom={1}>
        <Text bold color="blue">Media</Text>
      </Box>

      <Box flexDirection="column">
        {loading && <Text dimColor>Loading...</Text>}
        {error && <Text color="red">⚠ {error}</Text>}
        {image && <Text>{image}</Text>}
      </Box>

      <Box marginTop={1} flexDirection="column">
        <Text dimColor>{metadata}</Text>
        <Text dimColor>Enter/Esc to close</Text>
      </Box>
    </Box>
  );
}
