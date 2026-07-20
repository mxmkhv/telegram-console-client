import terminalImage from 'terminal-image';
import type { MediaAttachment } from '../types/index.js';
import { stripAnsi } from './ansiViewport.js';

/**
 * Wrapper that forces ANSI half-block rendering instead of native inline-image
 * protocols (iTerm2, Kitty/Ghostty, Sixel). Those protocols write escape codes
 * directly to stdout and return an empty string, which Ink's frame renderer then
 * clobbers — leaving the media panel blank. `preferNativeRender: false` makes
 * terminal-image skip all protocol detection and emit ANSI blocks, the only mode
 * that composes with Ink's <Text>.
 */
async function renderWithAnsiBlocks(
  buffer: Buffer,
  options: { width?: number | string; height?: number | string; preserveAspectRatio?: boolean }
): Promise<string> {
  return terminalImage.buffer(buffer, { ...options, preferNativeRender: false });
}

interface RenderOptions {
  width?: number | string;
  height?: number | string;
  preserveAspectRatio?: boolean;
}

export async function renderImageBuffer(
  buffer: Buffer,
  options: RenderOptions = {}
): Promise<string> {
  return renderWithAnsiBlocks(buffer, {
    width: options.width ?? '90%',
    height: options.height,
    preserveAspectRatio: options.preserveAspectRatio ?? true,
  });
}

// Inline preview constraints
const MAX_PREVIEW_WIDTH = 25;
const MAX_PREVIEW_HEIGHT = 15;

export function calculatePreviewDimensions(imageWidth: number, imageHeight: number): { width: number; height: number } {
  const aspectRatio = imageWidth / imageHeight;

  // Try fitting by height first
  let width = Math.round(MAX_PREVIEW_HEIGHT * aspectRatio);
  let height = MAX_PREVIEW_HEIGHT;

  // If width exceeds max, fit by width instead
  if (width > MAX_PREVIEW_WIDTH) {
    width = MAX_PREVIEW_WIDTH;
    height = Math.round(MAX_PREVIEW_WIDTH / aspectRatio);
  }

  // Ensure minimum dimensions
  return {
    width: Math.max(5, Math.min(width, MAX_PREVIEW_WIDTH)),
    height: Math.max(3, Math.min(height, MAX_PREVIEW_HEIGHT)),
  };
}

export interface PreviewResult {
  image: string;
  width: number;
  height: number;
}

export async function renderInlinePreview(buffer: Buffer, width: number, height: number): Promise<PreviewResult> {
  const result = await renderWithAnsiBlocks(buffer, {
    width,
    height,
    preserveAspectRatio: true,
  });

  // Trim trailing newlines
  const image = result.replace(/\n+$/, '');

  // Measure actual dimensions
  const lines = image.split('\n');
  const actualHeight = lines.length;
  const actualWidth = Math.max(...lines.map(line => stripAnsi(line).length));

  return { image, width: actualWidth, height: actualHeight };
}

export async function renderPanelImage(
  buffer: Buffer,
  panelWidth: number,
  maxHeight?: number,
  zoom = 1
): Promise<string> {
  // Account for border (2 chars) + paddingX (2 chars) = 4 chars overhead.
  // Magnify by `zoom` — the caller slices a viewport-sized window out of the
  // oversized render (see sliceAnsiViewport) so zoom > 1 can be panned.
  const contentWidth = Math.round((panelWidth - 4) * zoom);
  const height = maxHeight != null ? Math.round(maxHeight * zoom) : undefined;

  const result = await renderWithAnsiBlocks(buffer, {
    width: contentWidth,
    height,
    preserveAspectRatio: true,
  });

  // Trim trailing newlines to prevent extra spacing
  return result.replace(/\n+$/, '');
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

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
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
    voice: '🎤',
  };

  const icon = media.isAnimated ? '🎭' : icons[media.type] ?? '📎';
  const size = media.fileSize ? formatBytes(media.fileSize) : '';
  const dims = media.width && media.height ? `${media.width}x${media.height}` : '';
  const emoji = media.emoji ? `: ${media.emoji}` : '';
  const duration = media.duration != null ? formatDuration(media.duration) : '';

  const parts = [size, dims, duration].filter(Boolean).join(', ');
  let label: string;
  if (media.type === 'sticker') {
    label = `${media.isAnimated ? 'Animated Sticker' : 'Sticker'}${emoji}`;
  } else if (media.type === 'voice') {
    label = 'Voice';
  } else {
    label = capitalize(media.type);
  }

  const result = `[${icon} ${label}${parts ? `: ${parts}` : ''}]`;
  metadataCache.set(messageId, result);
  return result;
}
