# Improvement Plans for @sudobility/starter_app_rn

## Priority 1 - High Impact

### 1. Add a Test Suite [DONE]
- ~~The project has zero test files (only node_modules test files exist)~~
- ~~Jest is configured as the test runner per the CLAUDE.md but no tests have been written~~
- ~~Critical components like `AuthContext`, `ApiContext`, `HistoriesScreen`, and `SettingsScreen` have no automated test coverage~~
- ~~The `AuthProvider` contains complex async logic (token refresh, Google Sign-In flow, auth state listener) that is particularly prone to regressions without tests~~
- ~~At minimum, add tests for: `AuthContext` state transitions, `ApiContext` network client creation, `useSettingsStore` persist/reset behavior, and `localStorage` polyfill correctness~~
- Added `jest.config.js` with path aliases and transform ignore patterns
- Added unit tests for `localStorage` polyfill (6 tests) and `constants` (6 tests)
- Added `verify` script to `package.json` (`bun run typecheck && bun run lint && bun run test`)

### 2. Extract Duplicated Auth Modal into a Shared Component [DONE]
- ~~The auth modal UI (Google sign-in button, email/password form, mode toggle, error display) is fully duplicated between `HistoriesScreen.tsx` (~100 lines) and `SettingsScreen.tsx` (~100 lines)~~
- ~~Both screens independently manage identical state variables: `showAuthModal`, `authMode`, `email`, `password`, `authError`, `isSubmitting`~~
- ~~Both screens duplicate identical handler functions: `handleAuthSubmit`, `handleGoogleSignIn`~~
- ~~Extract into a shared `AuthModal` component that accepts `visible` and `onDismiss` props, reducing ~200 lines of duplication to ~20 lines of usage~~
- Extracted `src/components/AuthModal.tsx` with `visible`, `onDismiss`, and `initialMode` props
- Updated `HistoriesScreen.tsx` and `SettingsScreen.tsx` to use the shared component
- Added accessibility props (`accessibilityRole`, `accessibilityLabel`) to interactive elements
- Auth modal now resets form state on dismiss

### 3. Add Error Handling and Network Error States [DONE]
- ~~`ApiContext.tsx`'s `makeRequest` function silently catches JSON parse errors with an empty catch block (`catch (_e)`) -- non-JSON error responses from the server are reduced to a generic `HTTP {status}` message~~
- ~~`HistoriesScreen.tsx` shows a generic "Failed to create history." alert on error without surfacing the actual error message from the API~~
- ~~`HistoryDetailScreen.tsx` shows a generic "Failed to delete history." alert without the actual error~~
- No offline detection or network unavailable state exists -- API calls fail silently when the device has no connectivity (skipped: requires network status listener infrastructure)
- Fixed `makeRequest` to fall back to response text when JSON parsing fails instead of a generic status code
- Updated `HistoriesScreen` and `HistoryDetailScreen` to surface actual error messages from caught exceptions via `error instanceof Error`

## Priority 2 - Medium Impact

### 3. Add JSDoc Documentation to Context Providers and Hooks [DONE]
- ~~`AuthContext.tsx` has a file-level doc comment but individual functions (`toAuthUser`, `signInWithGoogle`, etc.) lack JSDoc~~
- ~~`ApiContext.tsx`'s `makeRequest` function performs complex request/response handling but has no parameter or return type documentation~~
- ~~The `createNetworkClient` factory function's behavior (how it maps `NetworkClient` interface methods to fetch calls) is undocumented~~
- ~~`useAppColors` hook lacks documentation about what color tokens it provides and when they change~~
- Added comprehensive JSDoc to `AuthContext.tsx` (all exported types, functions, and the provider)
- Added comprehensive JSDoc to `ApiContext.tsx` (`makeRequest`, `createNetworkClient`, `ApiProvider`, `useApi`, all interface fields)
- Added JSDoc with usage example to `useAppColors.ts`
- Added JSDoc to `settingsStore.ts` (store, types, and interface fields)
- Added JSDoc to `localStorage.ts` polyfill (module-level and method docs)

### 4. Improve Token Refresh Reliability
- `AuthContext.tsx` uses a 50-minute `setInterval` for token refresh, but this timer is not robust against app backgrounding on mobile -- the interval may be paused or killed by the OS
- The token refresh error handler only logs to console (`console.error('Error refreshing token:', error)`) with no recovery mechanism
- If the refresh fails, the stale token continues to be used until the next interval tick (50 minutes later), potentially causing 401 errors for that entire window
- Consider using AppState listener to refresh the token when the app returns to foreground, and adding exponential backoff retry on refresh failure
- **Skipped**: Requires AppState listener and exponential backoff infrastructure (architectural change)

## Priority 3 - Nice to Have

### 5. Add Pull-to-Refresh on Histories List [DONE]
- ~~The `FlatList` in `HistoriesScreen.tsx` has no `onRefresh` or `refreshing` props configured~~
- ~~Users have no way to manually refresh their histories list without navigating away and back~~
- ~~The `useHistoriesManager` hook already exposes a `refresh` function that could be wired to `FlatList`'s pull-to-refresh~~
- Wired `onRefresh` and `refreshing` props on the `FlatList` using `useHistoriesManager`'s `refresh` function

### 6. Hardcoded Google Sign-In Client IDs Should Be Environment Variables [DONE]
- ~~`AuthContext.tsx` contains hardcoded Google Sign-In client IDs (`iosClientId` and `webClientId`) directly in the source code~~
- ~~These should be moved to environment variables via `react-native-config` alongside the other Firebase configuration~~
- ~~This prevents accidental exposure of client IDs in the source repository and allows different client IDs per environment (development vs. production)~~
- Already resolved: `src/config/env.ts` exports `GOOGLE_OAUTH_CONFIG` reading `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_IOS_CLIENT_ID`, and `GOOGLE_OAUTH_REVERSED_CLIENT_ID` from environment variables. `AuthContext.tsx` and `src/services/googleAuth.ts` use these env-backed values, not hardcoded strings.
