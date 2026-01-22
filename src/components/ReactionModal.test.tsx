import { describe, it, expect } from "bun:test";
import { render } from "ink-testing-library";
import React from "react";
import { ReactionModal, MODAL_EMOJIS } from "./ReactionModal";

describe("ReactionModal", () => {
  it("renders grid of emojis", () => {
    const { lastFrame } = render(
      <ReactionModal
        onSelect={() => {}}
        onCancel={() => {}}
      />
    );
    const frame = lastFrame() ?? "";
    expect(frame).toContain("👍");
    expect(frame).toContain("❤️");
    expect(frame).toContain("😂");
  });

  it("renders cancel option", () => {
    const { lastFrame } = render(
      <ReactionModal
        onSelect={() => {}}
        onCancel={() => {}}
      />
    );
    expect(lastFrame()).toContain("Cancel");
  });

  it("has correct number of emojis", () => {
    expect(MODAL_EMOJIS).toHaveLength(30);
  });
});
