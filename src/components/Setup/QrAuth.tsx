import React, { useState, useEffect } from "react";
import { Box, Text, useInput } from "ink";
import qrcode from "qrcode-terminal";

interface QrAuthProps {
  qrCode: string | null;
  onSwitchToPhone: () => void;
  isLoading: boolean;
}

export function QrAuth({ qrCode, onSwitchToPhone, isLoading }: QrAuthProps) {
  const [qrDisplay, setQrDisplay] = useState<string>("");

  useEffect(() => {
    if (qrCode) {
      qrcode.generate(qrCode, { small: true }, (output) => {
        setQrDisplay(output);
      });
    }
  }, [qrCode]);

  useInput((input) => {
    if (input === "p" || input === "P") {
      onSwitchToPhone();
    }
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold color="cyan">Scan QR Code</Text>
      <Text></Text>
      <Text>Open Telegram on your phone:</Text>
      <Text>Settings → Devices → Scan QR Code</Text>
      <Text></Text>

      {isLoading ? (
        <Text dimColor>Generating QR code...</Text>
      ) : qrDisplay ? (
        <Box flexDirection="column">
          <Text>{qrDisplay}</Text>
        </Box>
      ) : (
        <Text dimColor>Waiting for QR code...</Text>
      )}

      <Text></Text>
      <Text dimColor>[Press 'p' to use phone number instead]</Text>
    </Box>
  );
}
