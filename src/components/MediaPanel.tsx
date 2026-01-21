import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import type { Message } from '../types/index.js';
import { getMediaBuffer } from '../services/mediaCache.js';
import { renderPanelImage, formatMediaMetadata } from '../services/imageRenderer.js';

// Panel chrome: border(2) + header(1) + marginBottom(1) + marginTop(1) + metadata(1) + hint(1) = 7 rows
// Plus 1 for bottom border inner = 8 total non-image rows
const PANEL_CHROME_ROWS = 8;
const MIN_IMAGE_HEIGHT = 4;

interface Props {
  message: Message;
  panelWidth: number;
  panelHeight: number;
  downloadMedia: (message: Message) => Promise<Buffer | undefined>;
  onClose: () => void;
  isFocused?: boolean;
}

export function MediaPanel({ message, panelWidth, panelHeight, downloadMedia, onClose, isFocused = true }: Props) {
  const messageId = message.id;
  const media = message.media!;

  const imageMaxHeight = Math.max(MIN_IMAGE_HEIGHT, panelHeight - PANEL_CHROME_ROWS);

  // Skip panel image cache - dimensions may have changed, always re-render
  // Buffer cache still prevents re-downloads
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Handle Enter/Escape to close
  useInput((input, key) => {
    if (key.return || key.escape) {
      onClose();
    }
  }, { isActive: isFocused });

  useEffect(() => {
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

        const rendered = await renderPanelImage(buffer, panelWidth, imageMaxHeight);
        if (cancelled) return;

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
  }, [messageId, message, downloadMedia, panelWidth, imageMaxHeight]);

  const metadata = formatMediaMetadata(media, messageId);

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor="blue"
      width={panelWidth}
      height={panelHeight}
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
