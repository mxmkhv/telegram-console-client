import { describe, it, expect, mock } from "bun:test";
import { render } from "ink-testing-library";
import React from "react";
import { MediaPanel } from "./MediaPanel";
import type { Message, MediaAttachment } from "../types/index.js";
import type { Api } from "telegram";

// Mock the media services to avoid actual media loading
mock.module("../services/mediaCache.js", () => ({
  getMediaBuffer: async () => Buffer.from("mock"),
}));

mock.module("../services/imageRenderer.js", () => ({
  renderPanelImage: async () => "[mock image]",
  formatMediaMetadata: () => "Photo 100x100 | 1KB",
}));

const mockMedia: MediaAttachment = {
  type: "photo",
  width: 100,
  height: 100,
  fileSize: 1024,
  _message: {} as Api.Message,
};

const mockMessage: Message = {
  id: 1,
  senderId: "user1",
  senderName: "Test User",
  text: "",
  timestamp: new Date("2024-01-01T12:00:00Z"),
  isOutgoing: false,
  media: mockMedia,
};

const mockDownloadMedia = async () => Buffer.from("mock");
const mockOnClose = () => {};

describe("MediaPanel", () => {
  it("renders with cyan border when focused", () => {
    const { lastFrame } = render(
      <MediaPanel
        message={mockMessage}
        panelWidth={40}
        panelHeight={20}
        downloadMedia={mockDownloadMedia}
        onClose={mockOnClose}
        isFocused={true}
      />
    );
    expect(lastFrame()).toMatchSnapshot();
  });

  it("renders with blue border when unfocused", () => {
    const { lastFrame } = render(
      <MediaPanel
        message={mockMessage}
        panelWidth={40}
        panelHeight={20}
        downloadMedia={mockDownloadMedia}
        onClose={mockOnClose}
        isFocused={false}
      />
    );
    expect(lastFrame()).toMatchSnapshot();
  });

  it("defaults to focused state", () => {
    const { lastFrame } = render(
      <MediaPanel
        message={mockMessage}
        panelWidth={40}
        panelHeight={20}
        downloadMedia={mockDownloadMedia}
        onClose={mockOnClose}
      />
    );
    // Default isFocused=true should show cyan
    expect(lastFrame()).toMatchSnapshot();
  });
});
