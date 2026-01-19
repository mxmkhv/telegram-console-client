import React, { useState } from "react";
import { Box, Text } from "ink";
import TextInput from "ink-text-input";

interface PhoneAuthProps {
  onSubmitPhone: (phone: string) => void;
  onSubmitCode: (code: string) => void;
  onSubmit2FA: (password: string) => void;
  step: "phone" | "code" | "2fa";
  isLoading: boolean;
  error?: string;
}

export function PhoneAuth({
  onSubmitPhone,
  onSubmitCode,
  onSubmit2FA,
  step,
  isLoading,
  error,
}: PhoneAuthProps) {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");

  const handlePhoneSubmit = () => {
    if (phone.trim()) {
      onSubmitPhone(phone.trim());
    }
  };

  const handleCodeSubmit = () => {
    if (code.trim()) {
      onSubmitCode(code.trim());
    }
  };

  const handle2FASubmit = () => {
    if (password) {
      onSubmit2FA(password);
    }
  };

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold color="cyan">Phone Authentication</Text>
      <Text></Text>

      {error && (
        <Box>
          <Text color="red">Error: {error}</Text>
          <Text></Text>
        </Box>
      )}

      {step === "phone" && (
        <Box>
          <Text bold>Phone number (with country code): </Text>
          {isLoading ? (
            <Text dimColor>Sending code...</Text>
          ) : (
            <TextInput
              value={phone}
              onChange={setPhone}
              onSubmit={handlePhoneSubmit}
              placeholder="+1234567890"
            />
          )}
        </Box>
      )}

      {step === "code" && (
        <Box>
          <Text bold>Enter the code sent to your Telegram: </Text>
          {isLoading ? (
            <Text dimColor>Verifying...</Text>
          ) : (
            <TextInput
              value={code}
              onChange={setCode}
              onSubmit={handleCodeSubmit}
              placeholder="12345"
            />
          )}
        </Box>
      )}

      {step === "2fa" && (
        <Box>
          <Text bold>Enter your 2FA password: </Text>
          {isLoading ? (
            <Text dimColor>Verifying...</Text>
          ) : (
            <TextInput
              value={password}
              onChange={setPassword}
              onSubmit={handle2FASubmit}
              mask="*"
            />
          )}
        </Box>
      )}
    </Box>
  );
}
