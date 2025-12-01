import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useOptimizedImage } from "./useOptimizedImage";

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn();
const mockObserve = vi.fn();
const mockDisconnect = vi.fn();

beforeEach(() => {
  mockIntersectionObserver.mockImplementation((callback) => ({
    observe: mockObserve,
    disconnect: mockDisconnect,
    unobserve: vi.fn(),
  }));
  vi.stubGlobal("IntersectionObserver", mockIntersectionObserver);

  // Mock ResizeObserver
  vi.stubGlobal(
    "ResizeObserver",
    vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      disconnect: vi.fn(),
      unobserve: vi.fn(),
    })),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("useOptimizedImage", () => {
  it("is a function", () => {
    expect(typeof useOptimizedImage).toBe("function");
  });

  it("returns initial state with default values", () => {
    const { result } = renderHook(() =>
      useOptimizedImage({ src: "/test.jpg" }),
    );

    expect(result.current.isLoaded).toBe(false);
    expect(result.current.isInView).toBe(false);
    expect(result.current.loading).toBe("lazy");
    expect(result.current.size).toEqual({ width: 0, height: 0 });
    expect(typeof result.current.ref).toBe("function");
  });

  it("returns eager loading when eager option is true", () => {
    const { result } = renderHook(() =>
      useOptimizedImage({ src: "/test.jpg", eager: true }),
    );

    expect(result.current.loading).toBe("eager");
  });

  it("returns original src when not in view and not eager", () => {
    const { result } = renderHook(() =>
      useOptimizedImage({ src: "/test.jpg" }),
    );

    expect(result.current.src).toBe("/test.jpg");
  });

  it("initializes size with explicit width and height", () => {
    const { result } = renderHook(() =>
      useOptimizedImage({ src: "/test.jpg", width: 800, height: 600 }),
    );

    expect(result.current.size).toEqual({ width: 800, height: 600 });
  });

  it("updates size when width/height props change", async () => {
    const { result, rerender } = renderHook(
      ({ width, height }) => useOptimizedImage({ src: "/test.jpg", width, height }),
      { initialProps: { width: 400, height: 300 } },
    );

    expect(result.current.size).toEqual({ width: 400, height: 300 });

    rerender({ width: 800, height: 600 });

    await waitFor(() => {
      expect(result.current.size).toEqual({ width: 800, height: 600 });
    });
  });

  describe("dynamicSrc generation", () => {
    it("returns original src when optixFlowConfig is not provided", () => {
      const { result } = renderHook(() =>
        useOptimizedImage({ src: "/test.jpg", eager: true }),
      );

      expect(result.current.src).toBe("/test.jpg");
    });

    it("returns OptixFlow URL when optixFlowConfig is provided", () => {
      const { result } = renderHook(() =>
        useOptimizedImage({
          src: "https://example.com/image.jpg",
          eager: true,
          width: 420,
          height: 700,
          optixFlowConfig: {
            apiKey: "test-api-key",
            compressionLevel: 85,
            renderedFileType: "webp",
          },
        }),
      );

      expect(result.current.src).toContain(
        "https://octane.cdn.ing/api/v1/images/transform?",
      );
      expect(result.current.src).toContain(
        "url=https%3A%2F%2Fexample.com%2Fimage.jpg",
      );
      expect(result.current.src).toContain("w=420");
      expect(result.current.src).toContain("h=700");
      expect(result.current.src).toContain("q=85");
      expect(result.current.src).toContain("f=webp");
      expect(result.current.src).toContain("apiKey=test-api-key");
    });

    it("uses default compressionLevel of 75 when not specified", () => {
      const { result } = renderHook(() =>
        useOptimizedImage({
          src: "https://example.com/image.jpg",
          eager: true,
          width: 100,
          height: 100,
          optixFlowConfig: {
            apiKey: "test-api-key",
          },
        }),
      );

      expect(result.current.src).toContain("q=75");
    });

    it("uses default renderedFileType of jpeg for primary src when not specified", () => {
      const { result } = renderHook(() =>
        useOptimizedImage({
          src: "https://example.com/image.jpg",
          eager: true,
          width: 100,
          height: 100,
          optixFlowConfig: {
            apiKey: "test-api-key",
          },
        }),
      );

      // Primary src defaults to jpeg for broadest browser compatibility
      expect(result.current.src).toContain("f=jpeg");
    });

    it("updates dynamicSrc when size changes", async () => {
      const { result, rerender } = renderHook(
        ({ width, height }) =>
          useOptimizedImage({
            src: "https://example.com/image.jpg",
            eager: true,
            width,
            height,
            optixFlowConfig: {
              apiKey: "test-api-key",
            },
          }),
        { initialProps: { width: 100, height: 100 } },
      );

      expect(result.current.src).toContain("w=100");
      expect(result.current.src).toContain("h=100");

      rerender({ width: 200, height: 300 });

      await waitFor(() => {
        expect(result.current.src).toContain("w=200");
        expect(result.current.src).toContain("h=300");
      });
    });
  });

  describe("ref callback", () => {
    it("provides a ref callback function", () => {
      const { result } = renderHook(() =>
        useOptimizedImage({ src: "/test.jpg" }),
      );

      expect(typeof result.current.ref).toBe("function");
    });

    it("ref callback accepts HTMLImageElement or null", () => {
      const { result } = renderHook(() =>
        useOptimizedImage({ src: "/test.jpg" }),
      );

      // Should not throw when called with null
      expect(() => result.current.ref(null)).not.toThrow();
    });
  });

  describe("intersection observer options", () => {
    it("uses default threshold and rootMargin", () => {
      const mockElement = document.createElement("img");

      renderHook(() => useOptimizedImage({ src: "/test.jpg" }));

      // Simulate ref being set
      act(() => {
        // The observer is created when ref is set
      });
    });

    it("uses custom threshold and rootMargin when provided", () => {
      renderHook(() =>
        useOptimizedImage({
          src: "/test.jpg",
          threshold: 0.5,
          rootMargin: "100px",
        }),
      );
    });
  });

  describe("srcset generation", () => {
    it("returns empty srcset when not in view and not eager", () => {
      const { result } = renderHook(() =>
        useOptimizedImage({
          src: "https://example.com/image.jpg",
          width: 480,
          height: 300,
          optixFlowConfig: {
            apiKey: "test-api-key",
          },
        }),
      );

      expect(result.current.srcset).toEqual({ avif: "", webp: "", jpeg: "" });
    });

    it("returns srcset object with avif, webp, and jpeg formats when eager", () => {
      const { result } = renderHook(() =>
        useOptimizedImage({
          src: "https://example.com/image.jpg",
          eager: true,
          width: 480,
          height: 300,
          optixFlowConfig: {
            apiKey: "test-api-key",
          },
        }),
      );

      expect(result.current.srcset.avif).toBeTruthy();
      expect(result.current.srcset.webp).toBeTruthy();
      expect(result.current.srcset.jpeg).toBeTruthy();
    });

    it("generates srcset with 1x and 2x DPR variants", () => {
      const { result } = renderHook(() =>
        useOptimizedImage({
          src: "https://example.com/image.jpg",
          eager: true,
          width: 480,
          height: 300,
          optixFlowConfig: {
            apiKey: "test-api-key",
          },
        }),
      );

      // Check avif srcset contains 1x and 2x variants
      expect(result.current.srcset.avif).toContain("1x");
      expect(result.current.srcset.avif).toContain("2x");

      // Check that 1x variant has original dimensions
      expect(result.current.srcset.avif).toContain("w=480");
      expect(result.current.srcset.avif).toContain("h=300");

      // Check that 2x variant has doubled dimensions
      expect(result.current.srcset.avif).toContain("w=960");
      expect(result.current.srcset.avif).toContain("h=600");
    });

    it("includes correct format parameter in each srcset", () => {
      const { result } = renderHook(() =>
        useOptimizedImage({
          src: "https://example.com/image.jpg",
          eager: true,
          width: 100,
          height: 100,
          optixFlowConfig: {
            apiKey: "test-api-key",
          },
        }),
      );

      expect(result.current.srcset.avif).toContain("f=avif");
      expect(result.current.srcset.webp).toContain("f=webp");
      expect(result.current.srcset.jpeg).toContain("f=jpeg");
    });

    it("returns empty srcset when OptixFlow is not configured", () => {
      const { result } = renderHook(() =>
        useOptimizedImage({
          src: "https://example.com/image.jpg",
          eager: true,
          width: 480,
          height: 300,
        }),
      );

      expect(result.current.srcset).toEqual({ avif: "", webp: "", jpeg: "" });
    });

    it("returns empty srcset when dimensions are zero", () => {
      const { result } = renderHook(() =>
        useOptimizedImage({
          src: "https://example.com/image.jpg",
          eager: true,
          optixFlowConfig: {
            apiKey: "test-api-key",
          },
        }),
      );

      expect(result.current.srcset).toEqual({ avif: "", webp: "", jpeg: "" });
    });
  });

  describe("sizes attribute", () => {
    it("returns empty sizes when not in view and not eager", () => {
      const { result } = renderHook(() =>
        useOptimizedImage({
          src: "https://example.com/image.jpg",
          width: 480,
          height: 300,
          optixFlowConfig: {
            apiKey: "test-api-key",
          },
        }),
      );

      expect(result.current.sizes).toBe("");
    });

    it("returns sizes attribute based on width when eager", () => {
      const { result } = renderHook(() =>
        useOptimizedImage({
          src: "https://example.com/image.jpg",
          eager: true,
          width: 480,
          height: 300,
          optixFlowConfig: {
            apiKey: "test-api-key",
          },
        }),
      );

      expect(result.current.sizes).toBe("480px");
    });

    it("updates sizes when dimensions change", async () => {
      const { result, rerender } = renderHook(
        ({ width, height }) =>
          useOptimizedImage({
            src: "https://example.com/image.jpg",
            eager: true,
            width,
            height,
            optixFlowConfig: {
              apiKey: "test-api-key",
            },
          }),
        { initialProps: { width: 480, height: 300 } },
      );

      expect(result.current.sizes).toBe("480px");

      rerender({ width: 800, height: 600 });

      await waitFor(() => {
        expect(result.current.sizes).toBe("800px");
      });
    });

    it("returns empty sizes when width is zero", () => {
      const { result } = renderHook(() =>
        useOptimizedImage({
          src: "https://example.com/image.jpg",
          eager: true,
          optixFlowConfig: {
            apiKey: "test-api-key",
          },
        }),
      );

      expect(result.current.sizes).toBe("");
    });
  });

  describe("primary src (Lighthouse compliance)", () => {
    it("uses exact rendered dimensions for primary src", () => {
      const { result } = renderHook(() =>
        useOptimizedImage({
          src: "https://example.com/image.jpg",
          eager: true,
          width: 480,
          height: 300,
          optixFlowConfig: {
            apiKey: "test-api-key",
          },
        }),
      );

      // Primary src should have exact dimensions (not scaled for DPR)
      expect(result.current.src).toContain("w=480");
      expect(result.current.src).toContain("h=300");
    });

    it("uses renderedFileType for primary src format", () => {
      const { result } = renderHook(() =>
        useOptimizedImage({
          src: "https://example.com/image.jpg",
          eager: true,
          width: 480,
          height: 300,
          optixFlowConfig: {
            apiKey: "test-api-key",
            renderedFileType: "webp",
          },
        }),
      );

      expect(result.current.src).toContain("f=webp");
    });
  });
});
