import { describe, it, expect } from "bun:test";
import { render } from "ink-testing-library";
import React from "react";
import { ReactionPicker } from "./ReactionPicker";

describe("ReactionPicker", () => {
  const defaultEmojis = ["👍", "❤️", "😂", "😮", "😢", "🎉"];

  it("renders all emojis and more option", () => {
    const { lastFrame } = render(
      <ReactionPicker
        emojis={defaultEmojis}
        selectedIndex={0}
        onSelect={() => {}}
        onOpenModal={() => {}}
        onCancel={() => {}}
      />
    );
    const frame = lastFrame() ?? "";
    for (const emoji of defaultEmojis) {
      expect(frame).toContain(emoji);
    }
    expect(frame).toContain("[...]");
  });

  it("highlights selected emoji", () => {
    const { lastFrame } = render(
      <ReactionPicker
        emojis={defaultEmojis}
        selectedIndex={2}
        onSelect={() => {}}
        onOpenModal={() => {}}
        onCancel={() => {}}
      />
    );
    expect(lastFrame()).toMatchSnapshot();
  });
});
