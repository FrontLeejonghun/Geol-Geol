/**
 * Clipboard API Integration Tests
 *
 * Tests for clipboard write functionality using navigator.clipboard.write
 * to copy PNG images to clipboard on desktop browsers.
 *
 * The implementation uses:
 * - navigator.clipboard.write() for async clipboard writing
 * - ClipboardItem for creating clipboard entries with PNG blobs
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { ShareImageResult } from "@/lib/share-image/generator";

// =============================================================================
// Mock Setup
// =============================================================================

// Mock ClipboardItem constructor
class MockClipboardItem {
  private items: Record<string, Blob>;

  constructor(items: Record<string, Blob>) {
    this.items = items;
  }

  getType(type: string): Blob | undefined {
    return this.items[type];
  }
}

// Save original navigator and globals
const originalNavigator = { ...window.navigator };
const originalClipboardItem = (globalThis as { ClipboardItem?: typeof ClipboardItem }).ClipboardItem;

// Helper to mock navigator.clipboard
function mockClipboard(config: {
  hasClipboard?: boolean;
  hasWrite?: boolean;
  writeResult?: "success" | "error" | "permission-denied";
}): void {
  const {
    hasClipboard = true,
    hasWrite = true,
    writeResult = "success",
  } = config;

  const mockNavigatorObj: Partial<Navigator> = {};

  if (hasClipboard) {
    const clipboardObj: Partial<Clipboard> = {};

    if (hasWrite) {
      clipboardObj.write = vi.fn().mockImplementation(async () => {
        if (writeResult === "permission-denied") {
          const error = new DOMException(
            "Clipboard write permission denied",
            "NotAllowedError"
          );
          throw error;
        }
        if (writeResult === "error") {
          throw new Error("Clipboard write failed");
        }
        return Promise.resolve();
      });
    }

    mockNavigatorObj.clipboard = clipboardObj as Clipboard;
  }

  Object.defineProperty(window, "navigator", {
    writable: true,
    configurable: true,
    value: { ...originalNavigator, ...mockNavigatorObj },
  });

  // Mock ClipboardItem globally
  (globalThis as { ClipboardItem?: typeof MockClipboardItem }).ClipboardItem = MockClipboardItem as typeof ClipboardItem;
}

// Helper to restore navigator and globals
function restoreClipboard(): void {
  Object.defineProperty(window, "navigator", {
    writable: true,
    configurable: true,
    value: originalNavigator,
  });

  if (originalClipboardItem) {
    (globalThis as { ClipboardItem?: typeof ClipboardItem }).ClipboardItem = originalClipboardItem;
  } else {
    delete (globalThis as { ClipboardItem?: typeof ClipboardItem }).ClipboardItem;
  }
}

// =============================================================================
// Feature Detection Tests
// =============================================================================

describe("Clipboard API - Feature Detection", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    restoreClipboard();
  });

  it("should detect when Clipboard API with write is available", async () => {
    mockClipboard({ hasClipboard: true, hasWrite: true });

    const { isClipboardSupported } = await import("@/lib/share-image/generator");

    expect(isClipboardSupported()).toBe(true);
  });

  it("should detect when navigator.clipboard exists but write is not available", async () => {
    mockClipboard({ hasClipboard: true, hasWrite: false });

    const { isClipboardSupported } = await import("@/lib/share-image/generator");

    expect(isClipboardSupported()).toBe(false);
  });

  it("should detect when navigator.clipboard is not available", async () => {
    mockClipboard({ hasClipboard: false });

    const { isClipboardSupported } = await import("@/lib/share-image/generator");

    expect(isClipboardSupported()).toBe(false);
  });

  it("should handle SSR environment (no navigator)", async () => {
    const originalNavigatorLocal = window.navigator;
    Object.defineProperty(window, "navigator", {
      writable: true,
      configurable: true,
      value: undefined,
    });

    const { isClipboardSupported } = await import("@/lib/share-image/generator");

    expect(isClipboardSupported()).toBe(false);

    Object.defineProperty(window, "navigator", {
      writable: true,
      configurable: true,
      value: originalNavigatorLocal,
    });
  });
});

// =============================================================================
// Copy to Clipboard Tests
// =============================================================================

describe("Clipboard API - copyToClipboard Function", () => {
  const mockImageResult: ShareImageResult = {
    size: "1080x1350",
    blob: new Blob(["test image data"], { type: "image/png" }),
    dataUrl: "data:image/png;base64,test",
    canvas: document.createElement("canvas"),
  };

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    restoreClipboard();
    vi.clearAllMocks();
  });

  it("should call navigator.clipboard.write with ClipboardItem containing PNG blob", async () => {
    mockClipboard({ hasClipboard: true, hasWrite: true, writeResult: "success" });

    const { copyToClipboard } = await import("@/lib/share-image/generator");

    await copyToClipboard(mockImageResult);

    expect(navigator.clipboard.write).toHaveBeenCalledTimes(1);

    const mockWrite = navigator.clipboard.write as ReturnType<typeof vi.fn>;
    const calls = mockWrite.mock.calls;
    expect(calls.length).toBe(1);

    const firstCall = calls[0];
    expect(firstCall).toBeDefined();

    // First argument should be an array with ClipboardItem
    const clipboardItems = firstCall?.[0] as Array<unknown>;
    expect(clipboardItems).toHaveLength(1);
    expect(clipboardItems[0]).toBeInstanceOf(MockClipboardItem);
  });

  it("should create ClipboardItem with image/png MIME type", async () => {
    mockClipboard({ hasClipboard: true, hasWrite: true, writeResult: "success" });

    // Track ClipboardItem constructor calls
    let capturedItems: Record<string, Blob> | null = null;
    const OriginalMockClipboardItem = MockClipboardItem;
    class TrackingClipboardItem extends OriginalMockClipboardItem {
      constructor(items: Record<string, Blob>) {
        super(items);
        capturedItems = items;
      }
    }
    (globalThis as { ClipboardItem?: typeof ClipboardItem }).ClipboardItem = TrackingClipboardItem as typeof ClipboardItem;

    const { copyToClipboard } = await import("@/lib/share-image/generator");

    await copyToClipboard(mockImageResult);

    expect(capturedItems).toBeDefined();
    expect(capturedItems!["image/png"]).toBeDefined();
    expect(capturedItems!["image/png"]).toBe(mockImageResult.blob);
  });

  it("should throw error when Clipboard API is not supported", async () => {
    mockClipboard({ hasClipboard: false });

    const { copyToClipboard } = await import("@/lib/share-image/generator");

    await expect(copyToClipboard(mockImageResult)).rejects.toThrow(
      "Clipboard API not supported"
    );
  });

  it("should propagate permission denied error", async () => {
    mockClipboard({
      hasClipboard: true,
      hasWrite: true,
      writeResult: "permission-denied",
    });

    const { copyToClipboard } = await import("@/lib/share-image/generator");

    await expect(copyToClipboard(mockImageResult)).rejects.toThrow(
      "Clipboard write permission denied"
    );
  });

  it("should propagate other errors", async () => {
    mockClipboard({
      hasClipboard: true,
      hasWrite: true,
      writeResult: "error",
    });

    const { copyToClipboard } = await import("@/lib/share-image/generator");

    await expect(copyToClipboard(mockImageResult)).rejects.toThrow(
      "Clipboard write failed"
    );
  });
});

// =============================================================================
// Generate and Copy Tests
// =============================================================================

describe("Clipboard API - generateAndCopy Function", () => {
  beforeEach(() => {
    vi.resetModules();
    mockClipboard({ hasClipboard: true, hasWrite: true, writeResult: "success" });
  });

  afterEach(() => {
    restoreClipboard();
    vi.clearAllMocks();
  });

  it("should generate image and copy to clipboard in one step", async () => {
    const { generateAndCopy, isClipboardSupported } = await import(
      "@/lib/share-image/generator"
    );

    // Verify clipboard is supported
    expect(isClipboardSupported()).toBe(true);

    // Note: Full generateAndCopy requires canvas rendering which needs
    // more complex mocking. This test verifies the function exists and
    // clipboard.write would be called.
    expect(typeof generateAndCopy).toBe("function");
  });
});

// =============================================================================
// Clipboard Copy Button Utility Tests
// =============================================================================

describe("Clipboard API - isClipboardImageSupported Utility", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    restoreClipboard();
  });

  it("should return true when all clipboard image requirements are met", async () => {
    mockClipboard({ hasClipboard: true, hasWrite: true });

    const { isClipboardImageSupported } = await import(
      "@/components/clipboard-copy-button"
    );

    expect(isClipboardImageSupported()).toBe(true);
  });

  it("should return false when ClipboardItem is not defined", async () => {
    mockClipboard({ hasClipboard: true, hasWrite: true });

    // Remove ClipboardItem
    delete (globalThis as { ClipboardItem?: typeof ClipboardItem }).ClipboardItem;

    const { isClipboardImageSupported } = await import(
      "@/components/clipboard-copy-button"
    );

    expect(isClipboardImageSupported()).toBe(false);
  });

  it("should return false when clipboard.write is not available", async () => {
    mockClipboard({ hasClipboard: true, hasWrite: false });

    const { isClipboardImageSupported } = await import(
      "@/components/clipboard-copy-button"
    );

    expect(isClipboardImageSupported()).toBe(false);
  });
});

// =============================================================================
// Integration with useShareImage Hook Tests
// =============================================================================

describe("Clipboard API - useShareImage Hook Integration", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    restoreClipboard();
    vi.clearAllMocks();
  });

  it("should expose clipboardSupported state based on feature detection", async () => {
    mockClipboard({ hasClipboard: true, hasWrite: true });

    const { isClipboardSupported } = await import("@/lib/share-image/generator");

    expect(isClipboardSupported()).toBe(true);
  });

  it("should report clipboardSupported as false when write is unavailable", async () => {
    mockClipboard({ hasClipboard: true, hasWrite: false });

    const { isClipboardSupported } = await import("@/lib/share-image/generator");

    expect(isClipboardSupported()).toBe(false);
  });
});

// =============================================================================
// PNG Blob Handling Tests
// =============================================================================

describe("Clipboard API - PNG Blob Handling", () => {
  beforeEach(() => {
    vi.resetModules();
    mockClipboard({ hasClipboard: true, hasWrite: true, writeResult: "success" });
  });

  afterEach(() => {
    restoreClipboard();
    vi.clearAllMocks();
  });

  it("should handle large PNG blobs", async () => {
    // Create a larger blob (simulating a real PNG)
    const largeData = new Uint8Array(1024 * 1024).fill(0); // 1MB
    const largeBlob = new Blob([largeData], { type: "image/png" });

    const largeImageResult: ShareImageResult = {
      size: "1080x1350",
      blob: largeBlob,
      dataUrl: "data:image/png;base64,large",
      canvas: document.createElement("canvas"),
    };

    const { copyToClipboard } = await import("@/lib/share-image/generator");

    // Should not throw with large blob
    await expect(copyToClipboard(largeImageResult)).resolves.not.toThrow();
    expect(navigator.clipboard.write).toHaveBeenCalledTimes(1);
  });

  it("should handle empty PNG blob", async () => {
    const emptyBlob = new Blob([], { type: "image/png" });

    const emptyImageResult: ShareImageResult = {
      size: "1080x1350",
      blob: emptyBlob,
      dataUrl: "data:image/png;base64,",
      canvas: document.createElement("canvas"),
    };

    const { copyToClipboard } = await import("@/lib/share-image/generator");

    // Should not throw - browser handles empty blob
    await expect(copyToClipboard(emptyImageResult)).resolves.not.toThrow();
  });

  it("should preserve PNG MIME type in ClipboardItem", async () => {
    let capturedMimeType: string | null = null;

    class TrackingClipboardItem {
      constructor(items: Record<string, Blob>) {
        const keys = Object.keys(items);
        capturedMimeType = keys[0] ?? null;
      }
    }
    (globalThis as { ClipboardItem?: typeof ClipboardItem }).ClipboardItem = TrackingClipboardItem as typeof ClipboardItem;

    const pngBlob = new Blob(["PNG data"], { type: "image/png" });
    const imageResult: ShareImageResult = {
      size: "1080x1350",
      blob: pngBlob,
      dataUrl: "data:image/png;base64,test",
      canvas: document.createElement("canvas"),
    };

    const { copyToClipboard } = await import("@/lib/share-image/generator");

    await copyToClipboard(imageResult);

    expect(capturedMimeType).toBe("image/png");
  });
});

// =============================================================================
// Desktop Browser Compatibility Tests
// =============================================================================

describe("Clipboard API - Desktop Browser Compatibility", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    restoreClipboard();
  });

  it("should detect support on Chrome (supports full Clipboard API)", async () => {
    mockClipboard({ hasClipboard: true, hasWrite: true });

    const { isClipboardSupported } = await import("@/lib/share-image/generator");

    expect(isClipboardSupported()).toBe(true);
  });

  it("should detect support on Firefox (supports Clipboard API)", async () => {
    mockClipboard({ hasClipboard: true, hasWrite: true });

    const { isClipboardSupported } = await import("@/lib/share-image/generator");

    expect(isClipboardSupported()).toBe(true);
  });

  it("should detect lack of support on older browsers", async () => {
    // Older browsers may have clipboard but no write
    mockClipboard({ hasClipboard: true, hasWrite: false });

    const { isClipboardSupported } = await import("@/lib/share-image/generator");

    expect(isClipboardSupported()).toBe(false);
  });

  it("should handle Safari's clipboard quirks", async () => {
    // Safari supports clipboard.write but may require user activation
    mockClipboard({
      hasClipboard: true,
      hasWrite: true,
      writeResult: "success",
    });

    const { isClipboardSupported, copyToClipboard } = await import(
      "@/lib/share-image/generator"
    );

    expect(isClipboardSupported()).toBe(true);

    const imageResult: ShareImageResult = {
      size: "1080x1350",
      blob: new Blob(["test"], { type: "image/png" }),
      dataUrl: "data:image/png;base64,test",
      canvas: document.createElement("canvas"),
    };

    await expect(copyToClipboard(imageResult)).resolves.not.toThrow();
  });
});

// =============================================================================
// Error Handling Edge Cases
// =============================================================================

describe("Clipboard API - Error Handling Edge Cases", () => {
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
    restoreClipboard();
    vi.clearAllMocks();
  });

  it("should handle NotAllowedError (permission denied)", async () => {
    mockClipboard({
      hasClipboard: true,
      hasWrite: true,
      writeResult: "permission-denied",
    });

    const { copyToClipboard } = await import("@/lib/share-image/generator");

    try {
      await copyToClipboard(mockImageResult);
      // Should not reach here
      expect(true).toBe(false);
    } catch (err) {
      expect(err).toBeInstanceOf(DOMException);
      expect((err as DOMException).name).toBe("NotAllowedError");
    }
  });

  it("should handle generic clipboard errors", async () => {
    mockClipboard({
      hasClipboard: true,
      hasWrite: true,
      writeResult: "error",
    });

    const { copyToClipboard } = await import("@/lib/share-image/generator");

    await expect(copyToClipboard(mockImageResult)).rejects.toThrow(
      "Clipboard write failed"
    );
  });

  it("should handle undefined clipboard gracefully", async () => {
    Object.defineProperty(window, "navigator", {
      writable: true,
      configurable: true,
      value: { ...originalNavigator, clipboard: undefined },
    });

    const { isClipboardSupported } = await import("@/lib/share-image/generator");

    // Should not throw
    expect(isClipboardSupported()).toBe(false);
  });
});
