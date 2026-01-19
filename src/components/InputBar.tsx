import React, { useState, useCallback, useEffect, memo } from "react";
import { Box, Text } from "ink";
import TextInput from "ink-text-input";

interface InputBarProps {
  isFocused: boolean;
  onSubmit: (text: string) => void;
  selectedChatId: string | null;
}

function InputBarInner({ isFocused, onSubmit, selectedChatId }: InputBarProps) {
  const [inputText, setInputText] = useState("");

  // Clear input when chat changes
  useEffect(() => {
    setInputText("");
  }, [selectedChatId]);

  const handleSubmit = useCallback((value: string) => {
    if (value.trim() && selectedChatId) {
      onSubmit(value.trim());
      setInputText("");
    }
  }, [selectedChatId, onSubmit]);

  return (
    <Box
      borderStyle="single"
      borderColor={isFocused ? "cyan" : undefined}
      paddingX={1}
    >
      <Text bold color={isFocused ? "cyan" : "white"}>{">"} </Text>
      <Box flexGrow={1}>
        <TextInput
          value={inputText}
          onChange={setInputText}
          onSubmit={handleSubmit}
          placeholder={selectedChatId ? "Type a message..." : "Select a chat first"}
          focus={isFocused}
        />
      </Box>
    </Box>
  );
}

export const InputBar = memo(InputBarInner);