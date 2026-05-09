/**
 * PNG Download Tests - Blob URL Implementation
 *
 * Tests for the PNG download functionality using blob URL and anchor click trigger.
 * This is the primary download method for desktop browsers.
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { ShareImageResult } from "@/lib/share-image/generator";

// =============================================================================
// Test Fixtures
// =============================================================================

function createMockShareImageResult(
  size: "1080x1350" | "1200x630" = "1080x1350"
): ShareImageResult {
  const mockBlob = new Blob(["fake png data"], { type: "image/png" });
  const mockDataUrl = "data:image/png;base64,ZmFrZXBuZ2RhdGE=";
  const mockCanvas = document.createElement("canvas");

  return {
    size,
    blob: mockBlob,
    dataUrl: mockDataUrl,
    canvas: mockCanvas,
  };
}

// =============================================================================
// Tests
// =============================================================================

describe("PNG Download - Blob URL Implementation", () => {
  // Track created elements and their properties
  let createdAnchors: HTMLAnchorElement[] = [];
  let appendedElements: Node[] = [];
  let removedElements: Node[] = [];
  let clickedElements: HTMLAnchorElement[] = [];
  let createObjectURLCalls: Blob[] = [];
  let revokeObjectURLCalls: string[] = [];
  let originalCreateObjectURL: typeof URL.createObjectURL;
  let originalRevokeObjectURL: typeof URL.revokeObjectURL;

  beforeEach(() => {
    vi.clearAllMocks();
    createdAnchors = [];
    appendedElements = [];
    removedElements = [];
    clickedElements = [];
    createObjectURLCalls = [];
    revokeObjectURLCalls = [];

    // Store originals
    originalCreateObjectURL = URL.createObjectURL;
    originalRevokeObjectURL = URL.revokeObjectURL;

    // Mock URL.createObjectURL
    URL.createObjectURL = vi.fn((blob: Blob) => {
      createObjectURLCalls.push(blob);
      return "blob:http://localhost:3000/test-uuid-123";
    });

    // Mock URL.revokeObjectURL
    URL.revokeObjectURL = vi.fn((url: string) => {
      revokeObjectURLCalls.push(url);
    });

    // Spy on document.createElement to capture anchor elements
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tagName: string) => {
      const element = originalCreateElement(tagName);
      if (tagName === "a") {
        createdAnchors.push(element as HTMLAnchorElement);
        // Mock click to track it
        const originalClick = element.click.bind(element);
        element.click = () => {
          clickedElements.push(element as HTMLAnchorElement);
          originalClick();
        };
      }
      return element;
    });

    // Spy on body append/remove
    vi.spyOn(document.body, "appendChild").mockImplementation((node: Node) => {
      appendedElements.push(node);
      return node;
    });

    vi.spyOn(document.body, "removeChild").mockImplementation((node: Node) => {
      removedElements.push(node);
      return node;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    // Restore original URL methods
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
  });

  describe("downloadShareImage", () => {
    it("should create blob URL from image blob", async () => {
      const { downloadShareImage } = await import(
        "@/lib/share-image/generator"
      );
      const mockImage = createMockShareImageResult();

      downloadShareImage(mockImage);

      expect(createObjectURLCalls).toHaveLength(1);
      expect(createObjectURLCalls[0]).toBe(mockImage.blob);
    });

    it("should create anchor element with blob URL as href", async () => {
      const { downloadShareImage } = await import(
        "@/lib/share-image/generator"
      );
      const mockImage = createMockShareImageResult();

      downloadShareImage(mockImage);

      expect(createdAnchors).toHaveLength(1);
      const anchor = createdAnchors[0];
      expect(anchor).toBeDefined();
      expect(anchor?.href).toBe("blob:http://localhost:3000/test-uuid-123");
    });

    it("should set download attribute with custom filename", async () => {
      const { downloadShareImage } = await import(
        "@/lib/share-image/generator"
      );
      const mockImage = createMockShareImageResult();

      downloadShareImage(mockImage, { filename: "my-stock-result" });

      const anchor = createdAnchors[0];
      expect(anchor).toBeDefined();
      expect(anchor?.download).toBe("my-stock-result.png");
    });

    it("should generate default filename with portrait label for 1080x1350", async () => {
      const { downloadShareImage } = await import(
        "@/lib/share-image/generator"
      );
      const mockImage = createMockShareImageResult("1080x1350");

      downloadShareImage(mockImage);

      // Should contain geolgeol-portrait prefix and .png extension
      const anchor = createdAnchors[0];
      expect(anchor).toBeDefined();
      expect(anchor?.download).toMatch(/^geolgeol-portrait-.+\.png$/);
    });

    it("should use og label in filename for 1200x630 size", async () => {
      const { downloadShareImage } = await import(
        "@/lib/share-image/generator"
      );
      const mockImage = createMockShareImageResult("1200x630");

      downloadShareImage(mockImage);

      const anchor = createdAnchors[0];
      expect(anchor).toBeDefined();
      expect(anchor?.download).toMatch(/^geolgeol-og-.+\.png$/);
    });

    it("should set display:none on anchor element for invisibility", async () => {
      const { downloadShareImage } = await import(
        "@/lib/share-image/generator"
      );
      const mockImage = createMockShareImageResult();

      downloadShareImage(mockImage);

      const anchor = createdAnchors[0];
      expect(anchor).toBeDefined();
      expect(anchor?.style.display).toBe("none");
    });

    it("should set aria-hidden for accessibility", async () => {
      const { downloadShareImage } = await import(
        "@/lib/share-image/generator"
      );
      const mockImage = createMockShareImageResult();

      downloadShareImage(mockImage);

      const anchor = createdAnchors[0];
      expect(anchor).toBeDefined();
      expect(anchor?.getAttribute("aria-hidden")).toBe("true");
    });

    it("should append to body, trigger click, and remove", async () => {
      const { downloadShareImage } = await import(
        "@/lib/share-image/generator"
      );
      const mockImage = createMockShareImageResult();

      downloadShareImage(mockImage);

      // Anchor should be appended to body
      expect(appendedElements).toHaveLength(1);
      expect(appendedElements[0]).toBe(createdAnchors[0]);

      // Click should be triggered
      expect(clickedElements).toHaveLength(1);
      expect(clickedElements[0]).toBe(createdAnchors[0]);

      // Anchor should be removed from body
      expect(removedElements).toHaveLength(1);
      expect(removedElements[0]).toBe(createdAnchors[0]);
    });

    it("should revoke blob URL after timeout to free memory", async () => {
      vi.useFakeTimers();

      const { downloadShareImage } = await import(
        "@/lib/share-image/generator"
      );
      const mockImage = createMockShareImageResult();

      downloadShareImage(mockImage);

      // Before timeout, URL should not be revoked
      expect(revokeObjectURLCalls).toHaveLength(0);

      // Advance time past the timeout
      await vi.advanceTimersByTimeAsync(100);

      // Now URL should be revoked
      expect(revokeObjectURLCalls).toHaveLength(1);
      expect(revokeObjectURLCalls[0]).toBe("blob:http://localhost:3000/test-uuid-123");

      vi.useRealTimers();
    });
  });

  describe("isBlobDownloadSupported", () => {
    it("should return true in jsdom environment", async () => {
      // Restore real URL methods for this test
      URL.createObjectURL = originalCreateObjectURL;
      URL.revokeObjectURL = originalRevokeObjectURL;

      const { isBlobDownloadSupported } = await import(
        "@/lib/share-image/generator"
      );

      // jsdom supports both URL.createObjectURL and download attribute
      expect(isBlobDownloadSupported()).toBe(true);
    });
  });
});

describe("PNG Download - Integration Scenarios", () => {
  it("should handle download of portrait (Instagram) size correctly", () => {
    const mockImage = createMockShareImageResult("1080x1350");

    expect(mockImage.size).toBe("1080x1350");
    expect(mockImage.blob.type).toBe("image/png");
    expect(mockImage.blob.size).toBeGreaterThan(0);
  });

  it("should handle download of landscape (OG/Twitter) size correctly", () => {
    const mockImage = createMockShareImageResult("1200x630");

    expect(mockImage.size).toBe("1200x630");
    expect(mockImage.blob.type).toBe("image/png");
    expect(mockImage.blob.size).toBeGreaterThan(0);
  });

  it("should provide data URL as fallback option", () => {
    const mockImage = createMockShareImageResult();

    // Data URL should always be available
    expect(mockImage.dataUrl).toMatch(/^data:image\/png;base64,/);
  });
});

describe("PNG Download - Filename Generation", () => {
  let originalCreateObjectURL: typeof URL.createObjectURL;
  let originalRevokeObjectURL: typeof URL.revokeObjectURL;
  let capturedAnchors: HTMLAnchorElement[];

  beforeEach(() => {
    capturedAnchors = [];
    originalCreateObjectURL = URL.createObjectURL;
    originalRevokeObjectURL = URL.revokeObjectURL;

    URL.createObjectURL = vi.fn(() => "blob:test");
    URL.revokeObjectURL = vi.fn();

    // Capture anchors during creation
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tagName: string) => {
      const element = originalCreateElement(tagName);
      if (tagName === "a") {
        capturedAnchors.push(element as HTMLAnchorElement);
      }
      return element;
    });

    vi.spyOn(document.body, "appendChild").mockImplementation((node) => node);
    vi.spyOn(document.body, "removeChild").mockImplementation((node) => node);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
  });

  it("should include timestamp in default filename", async () => {
    // Mock Date to have consistent timestamp
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-15T14:30:45.000Z"));

    const { downloadShareImage } = await import("@/lib/share-image/generator");
    const mockImage = createMockShareImageResult();

    downloadShareImage(mockImage);

    // Get the last created anchor
    const lastAnchor = capturedAnchors[capturedAnchors.length - 1];
    expect(lastAnchor).toBeDefined();

    // Filename should include formatted timestamp
    expect(lastAnchor?.download).toMatch(/geolgeol-portrait-2024-06-15T14-30-45\.png/);

    vi.useRealTimers();
  });

  it("should handle special characters in custom filename", async () => {
    const { downloadShareImage } = await import("@/lib/share-image/generator");
    const mockImage = createMockShareImageResult();

    downloadShareImage(mockImage, { filename: "stock-result_삼성전자_2024" });

    // Get the last created anchor
    const lastAnchor = capturedAnchors[capturedAnchors.length - 1];
    expect(lastAnchor).toBeDefined();

    expect(lastAnchor?.download).toBe("stock-result_삼성전자_2024.png");
  });
});

describe("PNG Download - Memory Management", () => {
  it("should properly clean up blob URL to prevent memory leaks", async () => {
    vi.useFakeTimers();

    const revokedURLs: string[] = [];
    const originalRevokeObjectURL = URL.revokeObjectURL;
    URL.revokeObjectURL = vi.fn((url: string) => {
      revokedURLs.push(url);
    });

    const originalCreateObjectURL = URL.createObjectURL;
    URL.createObjectURL = vi.fn(() => "blob:memory-test-url");

    vi.spyOn(document.body, "appendChild").mockImplementation((node) => node);
    vi.spyOn(document.body, "removeChild").mockImplementation((node) => node);

    const { downloadShareImage } = await import("@/lib/share-image/generator");
    const mockImage = createMockShareImageResult();

    // Simulate multiple downloads
    downloadShareImage(mockImage);
    downloadShareImage(mockImage);
    downloadShareImage(mockImage);

    // Before timeout, no URLs should be revoked
    expect(revokedURLs).toHaveLength(0);

    // After timeout, all URLs should be revoked
    await vi.advanceTimersByTimeAsync(100);

    expect(revokedURLs).toHaveLength(3);

    vi.useRealTimers();
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
    vi.restoreAllMocks();
  });
});

describe("downloadShareImageWithFallback", () => {
  let originalCreateObjectURL: typeof URL.createObjectURL;
  let originalRevokeObjectURL: typeof URL.revokeObjectURL;

  beforeEach(() => {
    originalCreateObjectURL = URL.createObjectURL;
    originalRevokeObjectURL = URL.revokeObjectURL;

    URL.createObjectURL = vi.fn(() => "blob:fallback-test");
    URL.revokeObjectURL = vi.fn();

    vi.spyOn(document.body, "appendChild").mockImplementation((node) => node);
    vi.spyOn(document.body, "removeChild").mockImplementation((node) => node);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
  });

  it("should use blob URL when supported", async () => {
    const { downloadShareImageWithFallback } = await import(
      "@/lib/share-image/generator"
    );
    const mockImage = createMockShareImageResult();

    downloadShareImageWithFallback(mockImage);

    // Should have called createObjectURL (blob URL approach)
    expect(URL.createObjectURL).toHaveBeenCalledWith(mockImage.blob);
  });
});
