# Superguide App RN

React Native mobile application for the Superguide project.

**Package**: `superguide_app_rn` (private)

## Tech Stack

- **Language**: TypeScript (JSX)
- **Runtime**: React Native 0.81 + Expo ~54
- **Package Manager**: Bun (do not use npm/yarn/pnpm for installing dependencies)
- **Navigation**: React Navigation 7 (Bottom Tabs + Native Stack)
- **State**: Zustand 5
- **Data Fetching**: TanStack Query 5
- **Auth**: Firebase Auth with AsyncStorage persistence, Google Sign-In
- **i18n**: i18next
- **Test**: Jest
- **Bundler**: Metro (port 8084)

## Project Structure

```
src/
├── polyfills/
│   └── localStorage.ts              # localStorage polyfill for Zustand persist
├── config/
│   ├── constants.ts                  # App name, languages, storage keys, tab names
│   ├── env.ts                        # Environment variable reader
│   └── theme.ts                      # Theme configuration
├── context/
│   ├── index.ts
│   ├── AuthContext.tsx                # Custom auth context (Firebase + Google Sign-In)
│   └── ApiContext.tsx                 # API client + QueryClient provider
├── stores/
│   ├── index.ts
│   └── settingsStore.ts              # Settings persisted via Zustand + AsyncStorage
├── hooks/
│   └── useAppColors.ts               # Theme-aware color hook
├── i18n/
│   └── index.ts                      # i18next setup with react-native-localize
├── navigation/
│   ├── index.ts
│   ├── types.ts                      # Navigation type definitions
│   ├── AppNavigator.tsx              # Root navigator (auth gate)
│   ├── HistoriesStack.tsx            # Histories list + detail stack
│   └── SettingsStack.tsx             # Settings stack
├── screens/
│   ├── index.ts
│   ├── SplashScreen.tsx              # Loading / auth check screen
│   ├── HistoriesScreen.tsx           # History list
│   ├── HistoryDetailScreen.tsx       # Single history detail
│   └── SettingsScreen.tsx            # User settings
└── components/
    └── GoogleIcon.tsx                # Google sign-in button icon
```

## Commands

```bash
bun run start          # Start Metro bundler on port 8084
bun run android        # Run on Android device/emulator
bun run ios            # Run on iOS device/simulator
bun run lint           # Run ESLint
bun run typecheck      # TypeScript check
bun run test           # Run Jest tests
```

## Navigation Structure

Bottom tabs:
- **Histories** tab — HistoriesScreen -> HistoryDetailScreen (stack)
- **Settings** tab — SettingsScreen

## Auth

Uses a custom `AuthContext` (not @sudobility/auth-components) with:
- Firebase Auth initialized with AsyncStorage persistence
- Google Sign-In via `@react-native-google-signin/google-signin`

## Networking

Custom `NetworkClient` implementation (fetch-based) — does not use the web DI layer. Configured via `ApiContext` which provides the superguide_client and QueryClient.

## Dependencies

All `@sudobility/*` packages are installed from npmjs (not local/monorepo links).

## Environment Variables

Via `react-native-config` (EXPO_PUBLIC_* prefix):

| Variable | Description | Default |
|----------|-------------|---------|
| `EXPO_PUBLIC_API_URL` | Backend API URL | `localhost:8022` |
| `EXPO_PUBLIC_FIREBASE_API_KEY` | Firebase API key | required |
| `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase auth domain | required |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID | required |

## Path Alias

`@/*` resolves to `src/*` via both `tsconfig.json` and `babel-plugin-module-resolver`.

## Key Patterns

- **localStorage polyfill**: Bridges `localStorage` API to AsyncStorage for Zustand persist middleware compatibility
- **Settings persistence**: Zustand store with AsyncStorage-backed persist middleware
- **Env merging**: `scripts/merge-env.js` runs as a prestart hook to combine env files

## Related Projects

- **superguide_types** — Shared type definitions
- **superguide_client** — API client SDK
- **superguide_lib** — Business logic library with `useHistoriesManager`
- **superguide_api** — Backend server this app communicates with
- **superguide_app** — Web counterpart of this mobile app; shares superguide_client, superguide_lib, and superguide_types

## Coding Patterns

- Bottom tab navigator with two stacks: Histories (list + detail) and Settings
- `localStorage` polyfill in `src/polyfills/localStorage.ts` bridges the web `localStorage` API to `AsyncStorage` for Zustand persist middleware compatibility
- Pre-start env merge script (`scripts/merge-env.js`) combines environment files before Metro starts
- Google Sign-In is configured via `@react-native-google-signin/google-signin` in `AuthContext`
- Custom `NetworkClient` implementation (fetch-based) is provided via `ApiContext` -- does not share the web DI layer
- Path alias `@/*` resolves to `src/*` via both `tsconfig.json` and `babel-plugin-module-resolver`
- Navigation types are defined in `src/navigation/types.ts` for type-safe navigation

## Gotchas

- The prestart script merges `.env` files -- environment changes require restarting Metro (port 8084)
- Metro runs on port `8084` (not the default 8081) -- ensure no port conflicts
- The `localStorage` polyfill must be imported before any Zustand persist store is created
- Firebase Auth uses `AsyncStorage` for persistence -- different from the web app's approach
- `react-native-config` uses `EXPO_PUBLIC_*` prefix for environment variables

## Testing

- Run tests: `bun test`
- Uses Jest as the test runner (not Vitest like the other projects)
- Tests are located alongside source files
- Type checking: `bun run typecheck`
