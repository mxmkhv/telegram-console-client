import { memo, useState } from "react";
import { Box, Text, useInput } from "ink";

export const MODAL_EMOJIS = [
  "👍", "❤️", "😂", "😮", "😢", "🎉",
  "🔥", "👏", "🤔", "😅", "🥰", "😍",
  "🙏", "💯", "🤣", "😊", "😭", "😱",
  "🤯", "🥳", "😏", "🤩", "💀", "👀",
  "✨", "💔", "🙄", "😤", "🤝", "👎",
] as const;

const COLS = 6;
const ROWS = 5;

interface ReactionModalProps {
  onSelect: (emoji: string) => void;
  onCancel: () => void;
  isActive?: boolean;
}

function ReactionModalInner({ onSelect, onCancel, isActive = true }: ReactionModalProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [onCancelRow, setOnCancelRow] = useState(false);

  useInput(
    (input, key) => {
      if (key.escape) {
        onCancel();
        return;
      }

      if (key.return) {
        if (onCancelRow) {
          onCancel();
        } else {
          onSelect(MODAL_EMOJIS[selectedIndex]!);
        }
        return;
      }

      if (key.leftArrow && !onCancelRow) {
        setSelectedIndex((i) => (i % COLS === 0 ? i : i - 1));
      } else if (key.rightArrow && !onCancelRow) {
        setSelectedIndex((i) => ((i + 1) % COLS === 0 ? i : i + 1));
      } else if (key.upArrow) {
        if (onCancelRow) {
          setOnCancelRow(false);
        } else if (selectedIndex >= COLS) {
          setSelectedIndex((i) => i - COLS);
        }
      } else if (key.downArrow) {
        if (!onCancelRow && selectedIndex >= COLS * (ROWS - 1)) {
          setOnCancelRow(true);
        } else if (!onCancelRow) {
          setSelectedIndex((i) => i + COLS);
        }
      }
    },
    { isActive }
  );

  const rows: string[][] = [];
  for (let i = 0; i < ROWS; i++) {
    rows.push(MODAL_EMOJIS.slice(i * COLS, (i + 1) * COLS) as unknown as string[]);
  }

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor="cyan"
      paddingX={1}
    >
      <Box justifyContent="center" marginBottom={1}>
        <Text bold color="cyan">React</Text>
      </Box>
      {rows.map((row, rowIndex) => (
        <Box key={rowIndex} justifyContent="center">
          {row.map((emoji, colIndex) => {
            const index = rowIndex * COLS + colIndex;
            const isSelected = !onCancelRow && index === selectedIndex;
            return (
              <Text key={emoji} inverse={isSelected}>
                {" "}{emoji}{" "}
              </Text>
            );
          })}
        </Box>
      ))}
      <Box justifyContent="center" marginTop={1}>
        <Text inverse={onCancelRow} dimColor={!onCancelRow}>
          [Cancel]
        </Text>
      </Box>
    </Box>
  );
}

export const ReactionModal = memo(ReactionModalInner);
