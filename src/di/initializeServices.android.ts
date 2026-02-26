/**
 * Service initialization for starter_app_rn (Android)
 *
 * Uses @sudobility/di_rn for centralized initialization
 * and @sudobility/auth_lib for Firebase Auth.
 */

import {
  initializeRNApp,
  type FirebaseAnalyticsService,
} from '@sudobility/di_rn';
import { initializeFirebaseAuth } from '@sudobility/auth_lib';

let servicesInitialized = false;
let analyticsService: FirebaseAnalyticsService | null = null;

/**
 * Initialize all services using di_rn's centralized initialization.
 *
 * This sets up:
 * - Storage service
 * - Firebase service (analytics, remote config)
 * - Network service
 * - Info service (for toast notifications)
 * - Firebase Auth (via auth_lib)
 */
export async function initializeAllServices(): Promise<FirebaseAnalyticsService> {
  if (servicesInitialized && analyticsService) {
    return analyticsService;
  }

  // 1. Initialize DI services (storage, firebase analytics, network, info)
  analyticsService = await initializeRNApp();

  // 2. Initialize Firebase Auth (uses @react-native-firebase/auth)
  initializeFirebaseAuth();

  servicesInitialized = true;
  return analyticsService;
}

/**
 * Get the analytics service
 */
export function getAnalytics(): FirebaseAnalyticsService | null {
  return analyticsService;
}
