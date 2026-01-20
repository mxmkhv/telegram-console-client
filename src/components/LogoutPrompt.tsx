import React, { useState, memo } from "react";
import { Box, Text, useInput } from "ink";
import type { LogoutMode } from "../types";

interface LogoutPromptProps {
  onConfirm: (mode: LogoutMode) => void;
  onCancel: () => void;
}

function LogoutPromptInner({ onConfirm, onCancel }: LogoutPromptProps) {
  const [selected, setSelected] = useState<LogoutMode>("session");

  useInput((input, key) => {
    if (key.escape) {
      onCancel();
      return;
    }

    if (key.leftArrow) {
      setSelected("session");
      return;
    }

    if (key.rightArrow) {
      setSelected("full");
      return;
    }

    if (key.return) {
      onConfirm(selected);
      return;
    }
  });

  return (
    <Box
      flexDirection="column"
      alignItems="center"
      borderStyle="single"
      borderColor="cyan"
      paddingX={4}
      paddingY={1}
    >
      <Text bold color="cyan">
        Log out
      </Text>
      <Text> </Text>
      <Text>What would you like to clear?</Text>
      <Text> </Text>
      <Box>
        <Text
          bold={selected === "session"}
          color={selected === "session" ? "cyan" : undefined}
          dimColor={selected !== "session"}
        >
          [Session only]
        </Text>
        <Text>  </Text>
        <Text
          bold={selected === "full"}
          color={selected === "full" ? "cyan" : undefined}
          dimColor={selected !== "full"}
        >
          [Full reset]
        </Text>
      </Box>
      <Text> </Text>
      <Text dimColor>Press Esc to cancel</Text>
    </Box>
  );
}

export const LogoutPrompt = memo(LogoutPromptInner);
