/**
 * useDeviceProfile — PREDATOR Device Adaptation Engine
 * 
 * Determines the device class (phone, tablet, laptop, desktop, ultrawide)
 * based on capabilities (pointer type, hover, screen width, orientation).
 * 
 * This is NOT just a width breakpoint. It uses CSS media queries and
 * User-Agent heuristics to classify the device behavior profile.
 */
import { useState, useEffect, useMemo, useCallback } from 'react';

export type DeviceClass = 'phone' | 'tablet' | 'laptop' | 'desktop' | 'ultrawide';
export type InputMode = 'touch' | 'mouse' | 'keyboard';
export type Orientation = 'portrait' | 'landscape';

export interface DeviceProfile {
  /** Current device class */
  deviceClass: DeviceClass;
  /** Primary input mode */
  inputMode: InputMode;
  /** Whether hover is supported */
  hasHover: boolean;
  /** Current orientation */
  orientation: Orientation;
  /** Whether it's a touch-primary device */
  isTouch: boolean;
  /** Whether it's a phone */
  isPhone: boolean;
  /** Whether it's a tablet */
  isTablet: boolean;
  /** Whether it's a laptop or larger */
  isDesktopOrLarger: boolean;
  /** Whether it's ultrawide */
  isUltrawide: boolean;
  /** Safe area insets (for iOS notch/Dynamic Island) */
  safeAreaInsets: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  /** Viewport dimensions */
  viewport: {
    width: number;
    height: number;
  };
  /** Whether reduced motion is preferred */
  prefersReducedMotion: boolean;
  /** Minimum touch target size in px */
  minTouchTarget: number;
}

function getDeviceClass(width: number, isCoarsePointer: boolean): DeviceClass {
  if (width < 768 || (isCoarsePointer && width < 768)) return 'phone';
  if (width < 1024 || (isCoarsePointer && width < 1200)) return 'tablet';
  if (width < 1440) return 'laptop';
  if (width < 2560) return 'desktop';
  return 'ultrawide';
}

function getSafeAreaInsets(): { top: number; bottom: number; left: number; right: number } {
  if (typeof window === 'undefined' || typeof getComputedStyle === 'undefined') {
    return { top: 0, bottom: 0, left: 0, right: 0 };
  }
  
  const root = document.documentElement;
  const style = getComputedStyle(root);
  
  const parse = (prop: string): number => {
    const value = style.getPropertyValue(prop);
    return parseInt(value, 10) || 0;
  };
  
  return {
    top: parse('--sat') || parse('env(safe-area-inset-top)') || 0,
    bottom: parse('--sab') || parse('env(safe-area-inset-bottom)') || 0,
    left: parse('--sal') || parse('env(safe-area-inset-left)') || 0,
    right: parse('--sar') || parse('env(safe-area-inset-right)') || 0,
  };
}

export function useDeviceProfile(): DeviceProfile {
  const [viewport, setViewport] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1440,
    height: typeof window !== 'undefined' ? window.innerHeight : 900,
  });

  const [orientation, setOrientation] = useState<Orientation>(
    typeof window !== 'undefined' && window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
  );

  const isCoarsePointer = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(pointer: coarse)').matches;
  }, []);

  const hasHover = useMemo(() => {
    if (typeof window === 'undefined') return true;
    return window.matchMedia('(hover: hover)').matches;
  }, []);

  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const handleResize = useCallback(() => {
    setViewport({ width: window.innerWidth, height: window.innerHeight });
    setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
  }, []);

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [handleResize]);

  const deviceClass = useMemo(
    () => getDeviceClass(viewport.width, isCoarsePointer),
    [viewport.width, isCoarsePointer]
  );

  const profile: DeviceProfile = useMemo(() => ({
    deviceClass,
    inputMode: isCoarsePointer ? 'touch' : 'mouse',
    hasHover,
    orientation,
    isTouch: isCoarsePointer,
    isPhone: deviceClass === 'phone',
    isTablet: deviceClass === 'tablet',
    isDesktopOrLarger: deviceClass === 'laptop' || deviceClass === 'desktop' || deviceClass === 'ultrawide',
    isUltrawide: deviceClass === 'ultrawide',
    safeAreaInsets: getSafeAreaInsets(),
    viewport,
    prefersReducedMotion,
    minTouchTarget: isCoarsePointer ? 44 : 32,
  }), [deviceClass, isCoarsePointer, hasHover, orientation, viewport, prefersReducedMotion]);

  return profile;
}
