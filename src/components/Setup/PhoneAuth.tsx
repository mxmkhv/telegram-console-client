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

  const handlePhoneSubmit = (value: string) => {
    if (value.trim()) {
      onSubmitPhone(value.trim());
    }
  };

  const handleCodeSubmit = (value: string) => {
    if (value.trim()) {
      onSubmitCode(value.trim());
    }
  };

  const handle2FASubmit = (value: string) => {
    if (value) {
      onSubmit2FA(value);
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
              focus={step === "phone"}
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
              focus={step === "code"}
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
              focus={step === "2fa"}
            />
          )}
        </Box>
      )}
    </Box>
  );
}
