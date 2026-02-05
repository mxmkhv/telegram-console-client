import { describe, it, expect } from "bun:test";
import { render } from "ink-testing-library";
import React from "react";
import { InputBar } from "./InputBar";

// Emoji constants for testing (matching emoticonMap.ts)
const SLIGHTLY_SMILING_FACE = "\u{1F642}"; // 🙂
const GRINNING_FACE = "\u{1F603}"; // 😃
const TONGUE_FACE = "\u{1F61B}"; // 😛
const RED_HEART = "\u{2764}\u{FE0F}"; // ❤️

describe("InputBar", () => {
  const mockOnSubmit = () => {};

  it("renders correctly when focused", () => {
    const { lastFrame } = render(
      <InputBar isFocused={true} onSubmit={mockOnSubmit} selectedChatId="123" />
    );
    expect(lastFrame()).toMatchSnapshot();
  });

  it("renders correctly when unfocused", () => {
    const { lastFrame } = render(
      <InputBar isFocused={false} onSubmit={mockOnSubmit} selectedChatId="123" />
    );
    expect(lastFrame()).toMatchSnapshot();
  });

  it("renders with no chat selected", () => {
    const { lastFrame } = render(
      <InputBar isFocused={true} onSubmit={mockOnSubmit} selectedChatId={null} />
    );
    expect(lastFrame()).toMatchSnapshot();
  });

  it("cursor stays on same line after typing first character", async () => {
    const { lastFrame, stdin } = render(
      <InputBar isFocused={true} onSubmit={mockOnSubmit} selectedChatId="123" />
    );

    // Type a character
    stdin.write("a");

    // Wait for state update
    await new Promise((resolve) => setTimeout(resolve, 50));

    const frame = lastFrame();
    // Split by newlines and check that content row has both 'a' and cursor on same line
    const lines = frame?.split("\n") ?? [];
    // The content should be on the second line (after top border)
    // Look for the line with "> " prefix that contains the typed character
    const contentLine = lines.find((line) => line.includes(">") && line.includes("a"));
    expect(contentLine).toBeDefined();
    // The cursor (inverse space) should be on the same line, not a separate line
    // If bug exists, 'a' would be on one line and cursor on next
    expect(lines.filter((line) => line.includes(">")).length).toBe(1);
  });

  describe("emoji conversion integration", () => {
    it("converts :) to emoji when space is typed", async () => {
      const { lastFrame, stdin } = render(
        <InputBar isFocused={true} onSubmit={mockOnSubmit} selectedChatId="123" />
      );

      // Type :) followed by space
      stdin.write(":)");
      await new Promise((resolve) => setTimeout(resolve, 50));
      stdin.write(" ");
      await new Promise((resolve) => setTimeout(resolve, 50));

      const frame = lastFrame();
      // The emoji should be visible in the rendered output
      expect(frame).toContain(SLIGHTLY_SMILING_FACE);
      // The original emoticon should NOT be present
      expect(frame).not.toContain(":)");
    });

    it("converts :D to emoji when Enter is pressed to submit", async () => {
      let submittedText = "";
      const captureSubmit = (text: string) => {
        submittedText = text;
      };

      const { stdin } = render(
        <InputBar isFocused={true} onSubmit={captureSubmit} selectedChatId="123" />
      );

      // Type :D and press Enter to submit
      stdin.write(":D");
      await new Promise((resolve) => setTimeout(resolve, 50));
      stdin.write("\r");
      await new Promise((resolve) => setTimeout(resolve, 50));

      // onSubmit should receive the transformed text with emoji
      expect(submittedText).toBe(GRINNING_FACE);
    });

    it("converts emoticon in message text when submitting", async () => {
      let submittedText = "";
      const captureSubmit = (text: string) => {
        submittedText = text;
      };

      const { stdin } = render(
        <InputBar isFocused={true} onSubmit={captureSubmit} selectedChatId="123" />
      );

      // Type "hello :)" followed by space, then more text, then submit
      stdin.write("hello :)");
      await new Promise((resolve) => setTimeout(resolve, 50));
      stdin.write(" ");
      await new Promise((resolve) => setTimeout(resolve, 50));
      stdin.write("world");
      await new Promise((resolve) => setTimeout(resolve, 50));
      stdin.write("\r");
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(submittedText).toBe(`hello ${SLIGHTLY_SMILING_FACE} world`);
    });

    it("converts trailing emoticon on submit without needing space", async () => {
      let submittedText = "";
      const captureSubmit = (text: string) => {
        submittedText = text;
      };

      const { stdin } = render(
        <InputBar isFocused={true} onSubmit={captureSubmit} selectedChatId="123" />
      );

      // Type message ending with emoticon (no trailing space)
      stdin.write("great news :D");
      await new Promise((resolve) => setTimeout(resolve, 50));
      stdin.write("\r");
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(submittedText).toBe(`great news ${GRINNING_FACE}`);
    });

    it("shows converted emoji in input field after space trigger", async () => {
      const { lastFrame, stdin } = render(
        <InputBar isFocused={true} onSubmit={mockOnSubmit} selectedChatId="123" />
      );

      // Type hello :P followed by space
      stdin.write("hello :P");
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Before space, the emoticon should still be visible as text
      let frame = lastFrame();
      expect(frame).toContain(":P");

      // After space, the emoji should appear
      stdin.write(" ");
      await new Promise((resolve) => setTimeout(resolve, 50));

      frame = lastFrame();
      expect(frame).toContain(TONGUE_FACE);
      expect(frame).not.toContain(":P");
    });

    it("converts multiple emoticons in sequence when each is followed by space", async () => {
      let submittedText = "";
      const captureSubmit = (text: string) => {
        submittedText = text;
      };

      const { stdin } = render(
        <InputBar isFocused={true} onSubmit={captureSubmit} selectedChatId="123" />
      );

      // Type ":) :D" with spaces triggering conversions
      stdin.write(":)");
      await new Promise((resolve) => setTimeout(resolve, 50));
      stdin.write(" ");
      await new Promise((resolve) => setTimeout(resolve, 50));
      stdin.write(":D");
      await new Promise((resolve) => setTimeout(resolve, 50));
      stdin.write("\r");
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(submittedText).toBe(`${SLIGHTLY_SMILING_FACE} ${GRINNING_FACE}`);
    });

    it("converts text shortcuts like :heart: to emoji", async () => {
      let submittedText = "";
      const captureSubmit = (text: string) => {
        submittedText = text;
      };

      const { stdin } = render(
        <InputBar isFocused={true} onSubmit={captureSubmit} selectedChatId="123" />
      );

      // Type "I " first
      stdin.write("I ");
      await new Promise((resolve) => setTimeout(resolve, 50));
      // Type ":heart:" then space to trigger conversion
      stdin.write(":heart:");
      await new Promise((resolve) => setTimeout(resolve, 50));
      stdin.write(" ");
      await new Promise((resolve) => setTimeout(resolve, 50));
      // Type "this" and submit
      stdin.write("this");
      await new Promise((resolve) => setTimeout(resolve, 50));
      stdin.write("\r");
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(submittedText).toBe(`I ${RED_HEART} this`);
    });
  });
});
