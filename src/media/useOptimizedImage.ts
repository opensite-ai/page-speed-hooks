"use client";

import { useMemo, useEffect, useState, useCallback, useRef } from "react";

/** Supported image format types */
export type ImageFormat = "avif" | "webp" | "jpeg" | "png";

export interface UseOptimizedImageOptions {
  /** Image source URL */
  src: string;

  /** Load eagerly (above-fold images) */
  eager?: boolean;

  /** IntersectionObserver threshold */
  threshold?: number;

  /** IntersectionObserver root margin */
  rootMargin?: string;

  /** Explicit width in pixels (overrides detected width) */
  width?: number;

  /** Explicit height in pixels (overrides detected height) */
  height?: number;

  /** OptixFlow API Key */
  optixFlowConfig?: {
    apiKey: string;
    compressionLevel?: number;
    renderedFileType?: ImageFormat;
  };
}

/**
 * Srcset object containing responsive srcset strings for each format
 * Used with <picture> element sources for format negotiation
 */
export interface SrcsetByFormat {
  /** AVIF srcset with 1x and 2x DPR variants */
  avif: string;
  /** WebP srcset with 1x and 2x DPR variants */
  webp: string;
  /** JPEG srcset with 1x and 2x DPR variants */
  jpeg: string;
}

export interface UseOptimizedImageState {
  /** Ref to attach to img element */
  ref: (node: HTMLImageElement | null) => void;

  /**
   * Primary src for the <img> element - uses exact rendered dimensions
   * This is what Lighthouse audits against for "Properly size images"
   */
  src: string;

  /**
   * Responsive srcset object for <picture> element sources
   * Each format contains 1x and 2x DPR variants for optimal device support
   */
  srcset: SrcsetByFormat;

  /**
   * The sizes attribute value for responsive image selection
   * Defaults to image width in pixels if no custom sizes needed
   */
  sizes: string;

  /** Whether image has loaded */
  isLoaded: boolean;

  /** Whether image is in viewport */
  isInView: boolean;

  /** Loading state */
  loading: "lazy" | "eager";

  /** Current rendered dimensions of the image */
  size: { width: number; height: number };
}

/**
 * useOptimizedImage
 *
 * Optimizes image loading with lazy loading, intersection observer,
 * responsive srcset generation, and automatic loading strategy based on viewport position.
 *
 * Implements web.dev best practices for:
 * - Pixel-perfect sizing for Lighthouse "Properly size images" audit
 * - DPR-aware srcset with 1x and 2x variants
 * - Format negotiation with AVIF, WebP, and JPEG fallback
 * - CLS prevention through explicit dimensions
 *
 * @example
 * ```tsx
 * function ProductImage() {
 *   const { ref, src, srcset, sizes, isLoaded, loading, size } = useOptimizedImage({
 *     src: 'https://example.com/product.jpg',
 *     width: 480,
 *     height: 300,
 *     optixFlowConfig: { apiKey: 'your-api-key', compressionLevel: 80 }
 *   })
 *
 *   return (
 *     <picture>
 *       <source srcSet={srcset.avif} sizes={sizes} type="image/avif" />
 *       <source srcSet={srcset.webp} sizes={sizes} type="image/webp" />
 *       <img
 *         ref={ref}
 *         src={src}
 *         loading={loading}
 *         className={isLoaded ? 'loaded' : 'loading'}
 *         alt="Product"
 *         width={size.width}
 *         height={size.height}
 *         decoding="async"
 *       />
 *     </picture>
 *   )
 * }
 * ```
 */

const BASE_URL: string = "https://octane.cdn.ing/api/v1/images/transform?";

/** DPR multipliers for srcset generation (1x for standard, 2x for high-density displays) */
const DPR_MULTIPLIERS = [1, 2] as const;

export function useOptimizedImage(
  options: UseOptimizedImageOptions,
): UseOptimizedImageState {
  const {
    src,
    eager = false,
    threshold = 0.1,
    rootMargin = "50px",
    width,
    height,
    optixFlowConfig,
  } = options;

  const optixFlowApiKey: string | undefined = useMemo(() => {
    return optixFlowConfig?.apiKey;
  }, [optixFlowConfig?.apiKey]);

  const useOptixFlow: boolean = useMemo(() => {
    return optixFlowApiKey ? true : false;
  }, [optixFlowApiKey]);

  const [state, setState] = useState({
    isLoaded: false,
    isInView: false,
  });

  // Size state for pixel-based width and height
  const [size, setSize] = useState<{ width: number; height: number }>({
    width: width ?? 0,
    height: height ?? 0,
  });

  const imgRef = useRef<HTMLImageElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Update size when explicit width/height props change
  useEffect(() => {
    if (width !== undefined || height !== undefined) {
      setSize((prev) => ({
        width: width ?? prev.width,
        height: height ?? prev.height,
      }));
    }
  }, [width, height]);

  // Detect and update size from the image element
  // CRITICAL: Use clientWidth/clientHeight (rendered dimensions) for Lighthouse compliance
  // Lighthouse audits the actual rendered size, not the intrinsic/natural dimensions
  useEffect(() => {
    if (!imgRef.current) return;

    const calculateRenderedSize = () => {
      const img = imgRef.current;
      if (!img) return;

      // Priority: explicit props > clientWidth/clientHeight (rendered) > naturalWidth/naturalHeight
      // clientWidth/clientHeight are the ACTUAL rendered dimensions that Lighthouse audits
      const renderedWidth = width ?? (Math.round(img.clientWidth) || img.naturalWidth || 0);
      const renderedHeight = height ?? (Math.round(img.clientHeight) || img.naturalHeight || 0);

      // Only update if we have valid dimensions and they've changed
      if ((renderedWidth > 0 || renderedHeight > 0)) {
        setSize((prev) => {
          if (prev.width !== renderedWidth || prev.height !== renderedHeight) {
            return { width: renderedWidth, height: renderedHeight };
          }
          return prev;
        });
      }
    };

    // Calculate immediately if element is already laid out
    if (imgRef.current.clientWidth > 0) {
      calculateRenderedSize();
    }

    // Listen for load event to recalculate after image loads
    const img = imgRef.current;
    img.addEventListener("load", calculateRenderedSize);

    // Use ResizeObserver to track size changes dynamically (responsive layouts)
    // This ensures srcset URLs update when rendered dimensions change
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        calculateRenderedSize();
      });
      resizeObserver.observe(img);
    }

    return () => {
      img.removeEventListener("load", calculateRenderedSize);
      resizeObserver?.disconnect();
    };
  }, [width, height, state.isLoaded]);

  /**
   * Build OptixFlow URL for specific dimensions and format
   * This generates the pixel-perfect URL that Lighthouse audits
   */
  const buildOptixFlowUrl = useCallback(
    (imgWidth: number, imgHeight: number, format: ImageFormat): string => {
      if (!useOptixFlow) return src;
      if (!imgWidth || !imgHeight) return src;

      const params = new URLSearchParams();
      params.set("url", src);
      params.set("w", String(imgWidth));
      params.set("h", String(imgHeight));
      params.set("q", String(optixFlowConfig?.compressionLevel ?? 75));
      params.set("f", format);
      params.set("apiKey", optixFlowApiKey!);

      return `${BASE_URL}${params.toString()}`;
    },
    [useOptixFlow, src, optixFlowConfig?.compressionLevel, optixFlowApiKey],
  );

  /**
   * Generate srcset string for a specific format with DPR variants
   * Creates 1x and 2x versions based on rendered dimensions
   *
   * @example Output: "url?w=480&h=300&f=avif 1x, url?w=960&h=600&f=avif 2x"
   */
  const generateSrcset = useCallback(
    (baseWidth: number, baseHeight: number, format: ImageFormat): string => {
      if (!useOptixFlow || baseWidth === 0 || baseHeight === 0) return "";

      return DPR_MULTIPLIERS.map((dpr) => {
        const scaledWidth = Math.round(baseWidth * dpr);
        const scaledHeight = Math.round(baseHeight * dpr);
        const url = buildOptixFlowUrl(scaledWidth, scaledHeight, format);
        return `${url} ${dpr}x`;
      }).join(", ");
    },
    [useOptixFlow, buildOptixFlowUrl],
  );

  /**
   * Primary src - uses exact rendered dimensions for Lighthouse compliance
   * This is the fallback src that Lighthouse audits against
   */
  const primarySrc = useMemo(() => {
    const hasDimensions = size.width > 0 && size.height > 0;
    if (!useOptixFlow || !hasDimensions) return src;
    // Use the configured renderedFileType or default to jpeg for broadest compatibility
    const fallbackFormat = optixFlowConfig?.renderedFileType ?? "jpeg";
    return buildOptixFlowUrl(size.width, size.height, fallbackFormat);
  }, [useOptixFlow, src, size.width, size.height, optixFlowConfig?.renderedFileType, buildOptixFlowUrl]);

  /**
   * Srcset object with format variants for <picture> element
   * Each format contains 1x and 2x DPR srcset strings
   */
  const srcset = useMemo<SrcsetByFormat>(() => {
    return {
      avif: generateSrcset(size.width, size.height, "avif"),
      webp: generateSrcset(size.width, size.height, "webp"),
      jpeg: generateSrcset(size.width, size.height, "jpeg"),
    };
  }, [size.width, size.height, generateSrcset]);

  /**
   * Sizes attribute for responsive image selection
   * Defaults to the current width in pixels
   */
  const sizes = useMemo(() => {
    if (size.width === 0) return "";
    return `${size.width}px`;
  }, [size.width]);

  useEffect(() => {
    if (typeof window === "undefined" || !imgRef.current) {
      return;
    }

    // If eager loading, skip intersection observer
    if (eager) {
      setState({ isLoaded: false, isInView: true });
      return;
    }

    // Set up intersection observer for lazy loading
    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setState((prev) => ({ ...prev, isInView: true }));
          observerRef.current?.disconnect();
        }
      },
      { threshold, rootMargin },
    );

    observerRef.current.observe(imgRef.current);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [eager, threshold, rootMargin]);

  // Handle image load event
  useEffect(() => {
    if (!imgRef.current) return;

    const handleLoad = () => {
      setState((prev) => ({ ...prev, isLoaded: true }));
    };

    const img = imgRef.current;

    // If image already loaded (cached)
    if (img.complete) {
      handleLoad();
    } else {
      img.addEventListener("load", handleLoad);
      return () => img.removeEventListener("load", handleLoad);
    }
  }, [state.isInView]);

  const ref = useCallback((node: HTMLImageElement | null) => {
    imgRef.current = node;
  }, []);

  // Empty srcset for non-visible state
  const emptySrcset: SrcsetByFormat = { avif: "", webp: "", jpeg: "" };

  return {
    ref,
    // Primary src uses exact rendered dimensions for Lighthouse "Properly size images" compliance
    src: state.isInView || eager ? primarySrc : "",
    // Srcset with format variants and DPR multipliers for <picture> element
    srcset: state.isInView || eager ? srcset : emptySrcset,
    // Sizes attribute for responsive image selection
    sizes: state.isInView || eager ? sizes : "",
    isLoaded: state.isLoaded,
    isInView: state.isInView,
    loading: eager ? "eager" : "lazy",
    size,
  };
}
