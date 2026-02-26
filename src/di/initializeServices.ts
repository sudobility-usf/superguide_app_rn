/**
 * Service initialization for starter_app_rn (Desktop: macOS / Windows)
 *
 * Desktop platforms use Firebase JS SDK which initializes lazily in AuthContext.
 * No native Firebase analytics or DI services are available on desktop.
 */

/**
 * Initialize all services (desktop no-op).
 *
 * On desktop, Firebase Auth is initialized lazily in AuthContext using the
 * Firebase JS SDK. Native analytics and DI services are not available.
 */
export async function initializeAllServices(): Promise<null> {
  return null;
}

/**
 * Get the analytics service (not available on desktop)
 */
export function getAnalytics(): null {
  return null;
}
