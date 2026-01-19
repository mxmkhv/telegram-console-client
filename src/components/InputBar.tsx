import React from "react";
import { Box, Text } from "ink";
import TextInput from "ink-text-input";
import { useAppState, useAppDispatch } from "../state/context";

interface InputBarProps {
  isFocused: boolean;
  onSubmit: (text: string) => void;
}

export function InputBar({ isFocused, onSubmit }: InputBarProps) {
  const { inputText, selectedChatId } = useAppState();
  const dispatch = useAppDispatch();

  const handleChange = (value: string) => {
    dispatch({ type: "SET_INPUT_TEXT", payload: value });
  };

  const handleSubmit = (value: string) => {
    if (value.trim() && selectedChatId) {
      onSubmit(value.trim());
      dispatch({ type: "SET_INPUT_TEXT", payload: "" });
    }
  };

  return (
    <Box borderStyle="single" paddingX={1}>
      <Text bold color={isFocused ? "cyan" : undefined}>{">"} </Text>
      {isFocused ? (
        <TextInput
          value={inputText}
          onChange={handleChange}
          onSubmit={handleSubmit}
          placeholder={selectedChatId ? "Type a message..." : "Select a chat first"}
        />
      ) : (
        <Text dimColor>{inputText || "Type a message..."}</Text>
      )}
    </Box>
  );
}
