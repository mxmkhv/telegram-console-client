export const NARROW_THRESHOLD = 60;
const MIN_MESSAGE_WIDTH = 30;

export function isNarrowLayout(terminalWidth: number): boolean {
  return terminalWidth < NARROW_THRESHOLD;
}

export function getChatListWidth(terminalWidth: number): number {
  return Math.min(35, terminalWidth - MIN_MESSAGE_WIDTH);
}

export function getMessageViewWidth(terminalWidth: number, narrow: boolean): number {
  return narrow ? terminalWidth : terminalWidth - getChatListWidth(terminalWidth);
}
