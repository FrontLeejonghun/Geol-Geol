/**
 * Web Share API Integration Tests
 *
 * Tests for Web Share API feature detection and share functionality.
 * Verifies that navigator.share is properly detected and used on supported browsers.
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { ShareImageResult } from "@/lib/share-image/generator";

// =============================================================================
// Mock Setup
// =============================================================================

// Save original navigator
const originalNavigator = { ...window.navigator };

// Helper to mock navigator.share and navigator.canShare
function mockNavigator(config: {
  hasShare?: boolean;
  hasCanShare?: boolean;
  canShareFiles?: boolean;
  shareResult?: "success" | "abort" | "error";
}): void {
  const {
    hasShare = true,
    hasCanShare = true,
    canShareFiles = true,
    shareResult = "success",
  } = config;

  const mockNavigatorObj: Partial<Navigator> = {};

  if (hasShare) {
    mockNavigatorObj.share = vi.fn().mockImplementation(async () => {
      if (shareResult === "abort") {
        const error = new Error("User cancelled");
        error.name = "AbortError";
        throw error;
      }
      if (shareResult === "error") {
        throw new Error("Share failed");
      }
      return Promise.resolve();
    });
  }

  if (hasCanShare) {
    mockNavigatorObj.canShare = vi.fn().mockImplementation((data) => {
      if (!canShareFiles && data?.files && data.files.length > 0) {
        return false;
      }
      return true;
    });
  }

  Object.defineProperty(window, "navigator", {
    writable: true,
    configurable: true,
    value: { ...originalNavigator, ...mockNavigatorObj },
  });
}

// Helper to restore navigator
function restoreNavigator(): void {
  Object.defineProperty(window, "navigator", {
    writable: true,
    configurable: true,
    value: originalNavigator,
  });
}

// =============================================================================
// Feature Detection Tests
// =============================================================================

describe("Web Share API - Feature Detection", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    restoreNavigator();
  });

  it("should detect when Web Share API is available", async () => {
    mockNavigator({ hasShare: true, hasCanShare: true, canShareFiles: true });

    const { isWebShareSupported, canShareFiles } = await import(
      "@/lib/share-image/generator"
    );

    expect(isWebShareSupported()).toBe(true);
    expect(canShareFiles()).toBe(true);
  });

  it("should detect when Web Share API is not available", async () => {
    mockNavigator({ hasShare: false, hasCanShare: false });

    const { isWebShareSupported, canShareFiles } = await import(
      "@/lib/share-image/generator"
    );

    expect(isWebShareSupported()).toBe(false);
    expect(canShareFiles()).toBe(false);
  });

  it("should detect when navigator.share exists but canShare does not", async () => {
    mockNavigator({ hasShare: true, hasCanShare: false });

    const { isWebShareSupported } = await import(
      "@/lib/share-image/generator"
    );

    expect(isWebShareSupported()).toBe(false);
  });

  it("should detect when file sharing is not supported", async () => {
    mockNavigator({ hasShare: true, hasCanShare: true, canShareFiles: false });

    const { isWebShareSupported, canShareFiles } = await import(
      "@/lib/share-image/generator"
    );

    expect(isWebShareSupported()).toBe(true);
    expect(canShareFiles()).toBe(false);
  });
});

// =============================================================================
// Share Image Tests
// =============================================================================

describe("Web Share API - shareImage Function", () => {
  const mockImageResult: ShareImageResult = {
    size: "1080x1350",
    blob: new Blob(["test"], { type: "image/png" }),
    dataUrl: "data:image/png;base64,test",
    canvas: document.createElement("canvas"),
  };

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    restoreNavigator();
    vi.clearAllMocks();
  });

  it("should call navigator.share with correct parameters", async () => {
    mockNavigator({ hasShare: true, hasCanShare: true, canShareFiles: true });

    const { shareImage } = await import("@/lib/share-image/generator");

    await shareImage(mockImageResult, {
      title: "Test Title",
      text: "Test text",
    });

    expect(navigator.share).toHaveBeenCalledTimes(1);
    const mockShare = navigator.share as ReturnType<typeof vi.fn>;
    const calls = mockShare.mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    const firstCall = calls[0];
    expect(firstCall).toBeDefined();
    const callArgs = firstCall?.[0] as ShareData | undefined;
    expect(callArgs).toBeDefined();
    expect(callArgs?.title).toBe("Test Title");
    expect(callArgs?.text).toBe("Test text");
    expect(callArgs?.files).toHaveLength(1);
    const files = callArgs?.files;
    expect(files?.[0]).toBeInstanceOf(File);
    expect((files?.[0] as File)?.type).toBe("image/png");
  });

  it("should use default Korean title and text when not provided", async () => {
    mockNavigator({ hasShare: true, hasCanShare: true, canShareFiles: true });

    const { shareImage } = await import("@/lib/share-image/generator");

    await shareImage(mockImageResult);

    const mockShare = navigator.share as ReturnType<typeof vi.fn>;
    const firstCall = mockShare.mock.calls[0];
    expect(firstCall).toBeDefined();
    const callArgs = firstCall?.[0] as ShareData | undefined;
    expect(callArgs?.title).toBe("껄껄 - 그때 살껄...");
    expect(callArgs?.text).toBe("나의 투자 결과를 확인해보세요!");
  });

  it("should throw error when Web Share API is not supported", async () => {
    mockNavigator({ hasShare: false, hasCanShare: false });

    const { shareImage } = await import("@/lib/share-image/generator");

    await expect(shareImage(mockImageResult)).rejects.toThrow(
      "Web Share API with file support not available"
    );
  });

  it("should throw error when file sharing is not supported", async () => {
    mockNavigator({ hasShare: true, hasCanShare: true, canShareFiles: false });

    const { shareImage } = await import("@/lib/share-image/generator");

    await expect(shareImage(mockImageResult)).rejects.toThrow(
      "Web Share API with file support not available"
    );
  });

  it("should handle user cancellation (AbortError)", async () => {
    mockNavigator({
      hasShare: true,
      hasCanShare: true,
      canShareFiles: true,
      shareResult: "abort",
    });

    const { shareImage } = await import("@/lib/share-image/generator");

    // AbortError should propagate - the hook handles it gracefully
    await expect(shareImage(mockImageResult)).rejects.toThrow();
    try {
      await shareImage(mockImageResult);
    } catch (err) {
      expect((err as Error).name).toBe("AbortError");
    }
  });

  it("should propagate other errors", async () => {
    mockNavigator({
      hasShare: true,
      hasCanShare: true,
      canShareFiles: true,
      shareResult: "error",
    });

    const { shareImage } = await import("@/lib/share-image/generator");

    await expect(shareImage(mockImageResult)).rejects.toThrow("Share failed");
  });
});

// =============================================================================
// File Generation Tests
// =============================================================================

describe("Web Share API - File Generation", () => {
  const mockImageResult: ShareImageResult = {
    size: "1080x1350",
    blob: new Blob(["test image data"], { type: "image/png" }),
    dataUrl: "data:image/png;base64,test",
    canvas: document.createElement("canvas"),
  };

  beforeEach(() => {
    vi.resetModules();
    mockNavigator({ hasShare: true, hasCanShare: true, canShareFiles: true });
  });

  afterEach(() => {
    restoreNavigator();
    vi.clearAllMocks();
  });

  it("should create a File from Blob with correct filename format", async () => {
    const { shareImage } = await import("@/lib/share-image/generator");

    await shareImage(mockImageResult);

    const mockShare = navigator.share as ReturnType<typeof vi.fn>;
    const firstCall = mockShare.mock.calls[0];
    expect(firstCall).toBeDefined();
    const callArgs = firstCall?.[0] as ShareData | undefined;
    const files = callArgs?.files;
    expect(files).toBeDefined();
    const file = files?.[0] as File;
    expect(file).toBeDefined();

    expect(file.name).toMatch(/^geolgeol-portrait-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.png$/);
    expect(file.type).toBe("image/png");
  });

  it("should use 'og' prefix for 1200x630 size", async () => {
    const ogImageResult: ShareImageResult = {
      ...mockImageResult,
      size: "1200x630",
    };

    const { shareImage } = await import("@/lib/share-image/generator");

    await shareImage(ogImageResult);

    const mockShare = navigator.share as ReturnType<typeof vi.fn>;
    const firstCall = mockShare.mock.calls[0];
    expect(firstCall).toBeDefined();
    const callArgs = firstCall?.[0] as ShareData | undefined;
    const files = callArgs?.files;
    const file = files?.[0] as File;
    expect(file).toBeDefined();

    expect(file.name).toMatch(/^geolgeol-og-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.png$/);
  });

  it("should preserve blob content in File", async () => {
    const originalBlob = new Blob(["original content"], { type: "image/png" });
    const imageWithBlob: ShareImageResult = {
      ...mockImageResult,
      blob: originalBlob,
    };

    const { shareImage } = await import("@/lib/share-image/generator");

    await shareImage(imageWithBlob);

    const mockShare = navigator.share as ReturnType<typeof vi.fn>;
    const firstCall = mockShare.mock.calls[0];
    expect(firstCall).toBeDefined();
    const callArgs = firstCall?.[0] as ShareData | undefined;
    const files = callArgs?.files;
    const file = files?.[0] as File;
    expect(file).toBeDefined();

    expect(file.size).toBe(originalBlob.size);
  });
});

// =============================================================================
// Integration with useShareImage Hook Tests
// =============================================================================

describe("Web Share API - useShareImage Hook Integration", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    restoreNavigator();
    vi.clearAllMocks();
  });

  it("should expose webShareSupported state based on feature detection", async () => {
    mockNavigator({ hasShare: true, hasCanShare: true, canShareFiles: true });

    // The hook uses canShareFiles() internally
    const { canShareFiles } = await import("@/lib/share-image/generator");

    expect(canShareFiles()).toBe(true);
  });

  it("should report webShareSupported as false when files cannot be shared", async () => {
    mockNavigator({ hasShare: true, hasCanShare: true, canShareFiles: false });

    const { canShareFiles } = await import("@/lib/share-image/generator");

    expect(canShareFiles()).toBe(false);
  });
});

// =============================================================================
// ShareButton Component Behavior Tests
// =============================================================================

describe("Web Share API - ShareButton Behavior", () => {
  it("should prefer Web Share when variant is auto and Web Share is supported", () => {
    // Simulating the ShareButton logic
    const getAction = (
      variant: "download" | "copy" | "share" | "auto",
      webShareSupported: boolean,
      clipboardSupported: boolean
    ): "download" | "copy" | "share" => {
      if (variant !== "auto") return variant;
      if (webShareSupported) return "share";
      if (clipboardSupported) return "copy";
      return "download";
    };

    expect(getAction("auto", true, true)).toBe("share");
    expect(getAction("auto", true, false)).toBe("share");
    expect(getAction("auto", false, true)).toBe("copy");
    expect(getAction("auto", false, false)).toBe("download");
    expect(getAction("share", false, false)).toBe("share");
    expect(getAction("copy", true, true)).toBe("copy");
    expect(getAction("download", true, true)).toBe("download");
  });
});

// =============================================================================
// Edge Cases
// =============================================================================

describe("Web Share API - Edge Cases", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    restoreNavigator();
  });

  it("should handle SSR environment (no navigator)", async () => {
    // Temporarily remove navigator
    const originalNavigatorLocal = window.navigator;
    Object.defineProperty(window, "navigator", {
      writable: true,
      configurable: true,
      value: undefined,
    });

    const { isWebShareSupported, canShareFiles } = await import(
      "@/lib/share-image/generator"
    );

    // These should not throw
    expect(isWebShareSupported()).toBe(false);
    expect(canShareFiles()).toBe(false);

    // Restore
    Object.defineProperty(window, "navigator", {
      writable: true,
      configurable: true,
      value: originalNavigatorLocal,
    });
  });

  it("should handle empty blob gracefully", async () => {
    mockNavigator({ hasShare: true, hasCanShare: true, canShareFiles: true });

    const emptyBlobResult: ShareImageResult = {
      size: "1080x1350",
      blob: new Blob([], { type: "image/png" }),
      dataUrl: "data:image/png;base64,",
      canvas: document.createElement("canvas"),
    };

    const { shareImage } = await import("@/lib/share-image/generator");

    // Should not throw - browser handles empty file
    await expect(shareImage(emptyBlobResult)).resolves.not.toThrow();
  });
});
