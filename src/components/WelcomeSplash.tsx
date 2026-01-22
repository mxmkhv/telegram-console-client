import React from "react";
import { Box, Text, useInput } from "ink";
import Gradient from "ink-gradient";
import pkg from "../../package.json";

const LOGO = `
 ████████╗███████╗██╗     ███████╗ ██████╗ ██████╗  █████╗ ███╗   ███╗
 ╚══██╔══╝██╔════╝██║     ██╔════╝██╔════╝ ██╔══██╗██╔══██╗████╗ ████║
    ██║   █████╗  ██║     █████╗  ██║  ███╗██████╔╝███████║██╔████╔██║
    ██║   ██╔══╝  ██║     ██╔══╝  ██║   ██║██╔══██╗██╔══██║██║╚██╔╝██║
    ██║   ███████╗███████╗███████╗╚██████╔╝██║  ██║██║  ██║██║ ╚═╝ ██║
    ╚═╝   ╚══════╝╚══════╝╚══════╝ ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝
  ██████╗ ██████╗ ███╗   ██╗███████╗ ██████╗ ██╗     ███████╗
 ██╔════╝██╔═══██╗████╗  ██║██╔════╝██╔═══██╗██║     ██╔════╝
 ██║     ██║   ██║██╔██╗ ██║███████╗██║   ██║██║     █████╗
 ██║     ██║   ██║██║╚██╗██║╚════██║██║   ██║██║     ██╔══╝
 ╚██████╗╚██████╔╝██║ ╚████║███████║╚██████╔╝███████╗███████╗
  ╚═════╝ ╚═════╝ ╚═╝  ╚═══╝╚══════╝ ╚═════╝ ╚══════╝╚══════╝
`.trim();

interface WelcomeSplashProps {
  onContinue: () => void;
}

export function WelcomeSplash({ onContinue }: WelcomeSplashProps) {
  useInput(() => {
    onContinue();
  });

  return (
    <Box
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      flexGrow={1}
    >
      <Gradient colors={["cyan", "blue"]}>
        <Text>{LOGO}</Text>
      </Gradient>
      <Text dimColor>v{pkg.version}</Text>
      <Text> </Text>
      <Text dimColor>Press any key to continue</Text>
    </Box>
  );
}
