import React, { memo } from "react";
import { Box, Text } from "ink";

function SettingsPanelInner() {
  return (
    <Box
      flexDirection="column"
      borderStyle="single"
      borderColor="cyan"
      paddingX={2}
      paddingY={1}
      flexGrow={1}
    >
      <Text bold color="cyan">
        Settings
      </Text>
      <Text> </Text>
      <Text>Settings coming soon.</Text>
      <Text> </Text>
      <Text dimColor>Press Esc to go back</Text>
    </Box>
  );
}

export const SettingsPanel = memo(SettingsPanelInner);
