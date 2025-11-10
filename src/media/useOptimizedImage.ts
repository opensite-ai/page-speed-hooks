"use client";

import { useEffect, useState, useCallback, useRef } from "react";

export interface UseOptimizedImageOptions {
  /** Image source URL */
  src: string;

  /** Load eagerly (above-fold images) */
  eager?: boolean;

  /** IntersectionObserver threshold */
  threshold?: number;

  /** IntersectionObserver root margin */
  rootMargin?: string;
}

export interface UseOptimizedImageState {
  /** Ref to attach to img element */
  ref: (node: HTMLImageElement | null) => void;

  /** Current src to use */
  src: string;

  /** Whether image has loaded */
  isLoaded: boolean;

  /** Whether image is in viewport */
  isInView: boolean;

  /** Loading state */
  loading: "lazy" | "eager";
}

/**
 * useOptimizedImage
 *
 * Optimizes image loading with lazy loading, intersection observer,
 * and automatic loading strategy based on viewport position.
 *
 * @example
 * ```tsx
 * function ProductImage() {
 *   const { ref, src, isLoaded, loading } = useOptimizedImage({
 *     src: '/product.jpg',
 *     threshold: 0.1,
 *     rootMargin: '50px'
 *   })
 *
 *   return (
 *     <img
 *       ref={ref}
 *       src={src}
 *       loading={loading}
 *       className={isLoaded ? 'loaded' : 'loading'}
 *       alt="Product"
 *     />
 *   )
 * }
 * ```
 */
export function useOptimizedImage(
  options: UseOptimizedImageOptions
): UseOptimizedImageState {
  const { src, eager = false, threshold = 0.1, rootMargin = "50px" } = options;
  const [state, setState] = useState({
    isLoaded: false,
    isInView: false,
  });

  const imgRef = useRef<HTMLImageElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

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
      { threshold, rootMargin }
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

  return {
    ref,
    src: state.isInView || eager ? src : "",
    isLoaded: state.isLoaded,
    isInView: state.isInView,
    loading: eager ? "eager" : "lazy",
  };
}
