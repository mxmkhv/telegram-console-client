import React from "react";
import { Box, Text, useInput } from "ink";

interface WelcomeNewProps {
  userName: string;
  onContinue: () => void;
}

export function WelcomeNew({ userName, onContinue }: WelcomeNewProps) {
  useInput(() => {
    onContinue();
  });

  return (
    <Box
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      borderStyle="single"
      borderColor="cyan"
      paddingX={4}
      paddingY={2}
    >
      <Text bold color="cyan">
        Welcome, {userName}!
      </Text>
      <Text> </Text>
      <Text dimColor>Press any key to continue</Text>
    </Box>
  );
}
