/**
 * Platform detection helpers.
 *
 * `isNativeApp` is true when the app is running inside a Capacitor
 * native shell (iOS / iPadOS / macOS Catalyst / visionOS / Android).
 * In that mode we render the Cosmos Explorer in a dedicated full-bleed
 * layout — no marketing chrome, no fullscreen toggle.
 */
export const isNativeApp = (): boolean => {
  if (typeof window === 'undefined') return false;
  // Capacitor injects this global on native runtimes.
  const cap = (window as any).Capacitor;
  return !!(cap && typeof cap.isNativePlatform === 'function' && cap.isNativePlatform());
};