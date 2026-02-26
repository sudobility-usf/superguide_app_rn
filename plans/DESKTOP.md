# Desktop Support Plan (macOS + Windows)

## Context

starter_app_rn currently supports iOS and Android only. This plan adds macOS and Windows desktop support using `react-native-macos` and `react-native-windows` (Microsoft forks), following patterns from `svgr_app_rn` which has working desktop support.

Key challenges:
- **Firebase Auth**: Native SDK (`@react-native-firebase/auth`) doesn't work on desktop. Use Firebase JS SDK (`firebase/auth`) instead, with platform-specific file resolution.
- **Google Sign-In**: Native `@react-native-google-signin/google-signin` doesn't work on desktop. Use custom WebAuth native modules (PKCE OAuth flow via system browser).
- **Navigation**: Bottom tabs are mobile-centric. Desktop gets a fixed narrow sidebar.

## Decisions

| Decision | Choice |
|----------|--------|
| Platforms | Both macOS and Windows |
| Firebase (desktop) | Firebase JS SDK (`firebase/auth`) |
| Google Sign-In (desktop) | WebAuth native modules (PKCE OAuth) |
| WebAuth location | Add to `@sudobility/building_blocks_rn` |
| Navigation (desktop) | Fixed narrow sidebar (icons + labels) |
| Goal | Template app, just get it working |

## Reference

- `~/projects/svgr_app_rn` — working macOS + Windows desktop app
- `~/projects/building_blocks_rn` — shared RN component library (currently pure TS)
- `~/projects/mail_box_rn` — reference for Podfile patterns

---

## Phase 1: Add WebAuth Native Modules to building_blocks_rn

**Goal**: Add WebAuth native module for macOS (Obj-C) and Windows (C++) to the existing `@sudobility/building_blocks_rn` package, plus a TypeScript wrapper.

Currently `building_blocks_rn` is pure TypeScript (no native code). This phase adds native directories and autolinking config.

### Source files to port from svgr_app_rn:
- `svgr_app_rn/macos/SvgrApp-macOS/WebAuthModule.{h,m}` — macOS (ASWebAuthenticationSession + CommonCrypto)
- `svgr_app_rn/windows/SvgrApp/WebAuthModule.{h,cpp}` — Windows (WinHTTP + BCrypt)
- `svgr_app_rn/src/native/WebAuth.ts` — TypeScript wrapper

### Files to create in building_blocks_rn:

| File | Description |
|------|-------------|
| `macos/WebAuthModule.h` | Obj-C header (port from svgr_app_rn) |
| `macos/WebAuthModule.m` | Obj-C impl — ASWebAuthenticationSession, SecRandom, CommonCrypto |
| `windows/WebAuthModule.h` | C++ header (namespace: `BuildingBlocksRN`) |
| `windows/WebAuthModule.cpp` | C++ impl — BCryptGenRandom, SHA-256, localhost socket listener |
| `src/native/WebAuth.ts` | TS wrapper: `authenticate()`, `generateCodeVerifier()`, `sha256Base64Url()` |
| `react-native.config.js` | Autolinking config (macos podspec, ios/android null) |
| `building-blocks-rn-macos.podspec` | CocoaPods spec for macOS autolinking |

### Files to modify in building_blocks_rn:

| File | Change |
|------|--------|
| `index.ts` | Export WebAuth functions |
| `package.json` | Bump version, add `macos/`, `windows/` to `files`, add `react-native` field |

### Notes:
- Windows C++ namespace changes from `SvgrApp` to `BuildingBlocksRN`
- Windows modules are embedded in consuming apps' vcxproj (not true autolinking — same pattern as svgr_app_rn)
- macOS uses CocoaPods podspec for autolinking

---

## Phase 2: Create macOS Native Project

**Goal**: Add `macos/` directory with Xcode project, Podfile, AppDelegate, and WebAuth module.

### Approach:
Copy `svgr_app_rn/macos/` as starting point, then:
1. Rename all `SvgrApp` references to `StarterApp`
2. Remove svgr-specific native modules (FilePicker, MenuBar, PdfExport, PopupMenu)
3. Keep only WebAuthModule
4. Update bundle identifier to `com.sudobility.starter`
5. Update Info.plist for Starter App branding

### Key files:

| File | Description |
|------|-------------|
| `macos/Podfile` | Platform :macos, '14.0', use_react_native with react-native-macos path |
| `macos/StarterApp-macOS/AppDelegate.{h,mm}` | moduleName = "main", window title = "Starter App" |
| `macos/StarterApp-macOS/main.m` | NSApplicationMain entry |
| `macos/StarterApp-macOS/WebAuthModule.{h,m}` | Copy from building_blocks_rn |
| `macos/StarterApp-macOS/Info.plist` | Bundle config, URL scheme for OAuth callback |
| `macos/StarterApp-macOS/StarterApp.entitlements` | Sandbox + network.client |
| `macos/StarterApp-macOS/Base.lproj/Main.storyboard` | Standard NSWindow storyboard |
| `macos/StarterApp.xcodeproj/project.pbxproj` | Xcode project (adapted from svgr_app_rn) |

### Critical Podfile patch:
The `post_install` must patch `RCTThirdPartyComponentsProvider.mm` for nil-safe class references (same as svgr_app_rn). Without this, libraries that don't support macOS cause crashes.

---

## Phase 3: Create Windows Native Project

**Goal**: Add `windows/` directory with Visual Studio solution, app entry, and WebAuth module.

### Approach:
Copy `svgr_app_rn/windows/` as starting point, then:
1. Rename `SvgrApp` to `StarterApp` in all files
2. Remove svgr-specific native modules (FilePicker, PdfExport, PopupMenu)
3. Keep only WebAuthModule
4. Update window title to "Starter App"
5. Set `ComponentName(L"main")` matching app.json

### Key files:

| File | Description |
|------|-------------|
| `windows/StarterApp.sln` | VS solution file |
| `windows/ExperimentalFeatures.props` | MSBuild props (New Arch, NuGet) |
| `windows/StarterApp/StarterApp.cpp` | WinMain entry, registers WebAuthModule |
| `windows/StarterApp/StarterApp.h` | Header |
| `windows/StarterApp/StarterApp.vcxproj` | Project file — must include WebAuth + link bcrypt, ws2_32, etc. |
| `windows/StarterApp/WebAuthModule.{h,cpp}` | Port from building_blocks_rn (namespace: StarterApp) |
| `windows/StarterApp/pch.h` | Precompiled header — must include winsock2.h before windows.h |
| `windows/StarterApp.Package/` | MSIX packaging (Package.appxmanifest, wapproj, Images) |

---

## Phase 4: Platform-Specific Firebase Auth

**Goal**: Split auth into platform-specific files. Desktop uses Firebase JS SDK; mobile keeps native SDK.

### Platform file resolution (Metro):
- `AuthContext.ios.tsx` → iOS (native SDK)
- `AuthContext.android.tsx` → Android (native SDK)
- `AuthContext.tsx` → default/desktop (Firebase JS SDK)

### Files to create:

| File | Description |
|------|-------------|
| `src/context/AuthContext.ios.tsx` | Current AuthContext.tsx content (native @react-native-firebase/auth) |
| `src/context/AuthContext.android.tsx` | Same as .ios.tsx |
| `src/services/googleAuth.ts` | PKCE OAuth flow using WebAuth module (port from svgr_app_rn) |
| `src/native/WebAuth.ts` | Local TS wrapper for WebAuth native module |
| `src/di/initializeServices.ios.ts` | Current initializeServices.ts content (di_rn + auth_lib) |
| `src/di/initializeServices.android.ts` | Same as .ios.ts |

### Files to modify:

| File | Change |
|------|--------|
| `src/context/AuthContext.tsx` | Rewrite for desktop: Firebase JS SDK + googleAuth service |
| `src/di/initializeServices.ts` | Desktop no-op (Firebase JS SDK initializes lazily in AuthContext) |
| `src/config/env.ts` | Add `FIREBASE_CONFIG` object and `GOOGLE_OAUTH_CONFIG` for desktop |

### Desktop AuthContext.tsx pattern (from svgr_app_rn):
```typescript
import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Lazy init: Firebase only initializes when getFirebaseAuth() is called
let app = null, auth = null;
function getFirebaseAuth() {
  if (!app) {
    app = initializeApp(FIREBASE_CONFIG);
    auth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
  }
  return auth;
}
```

### New env vars needed:
```
GOOGLE_OAUTH_CLIENT_ID=<web-client-id>
GOOGLE_OAUTH_REVERSED_CLIENT_ID=<reversed-client-id-for-url-scheme>
```

### New dependency:
```
"firebase": "^12.4.0"
```

---

## Phase 5: Desktop Navigation (Sidebar)

**Goal**: On desktop, render a fixed narrow sidebar (80px) instead of bottom tabs.

### Layout:
```
┌──────┬───────────────────────────┐
│ Logo │                           │
├──────┤                           │
│      │                           │
│ [H]  │     Content Area          │
│ Hist │     (Stack navigator)     │
│      │                           │
│ [S]  │                           │
│ Sett │                           │
│      │                           │
└──────┴───────────────────────────┘
```

### Files to create:

| File | Description |
|------|-------------|
| `src/navigation/DesktopSidebar.tsx` | Sidebar with icon + label items, themed |
| `src/hooks/useTabBarHeight.ts` | Returns `useBottomTabBarHeight()` on mobile, `0` on desktop |

### Files to modify:

| File | Change |
|------|--------|
| `src/navigation/AppNavigator.tsx` | Platform check: desktop → sidebar + content, mobile → bottom tabs |
| `src/screens/HistoriesScreen.tsx` | Replace `useBottomTabBarHeight` with `useTabBarHeight` |
| `src/screens/SettingsScreen.tsx` | Replace `useBottomTabBarHeight` with `useTabBarHeight` |

### Platform detection:
```typescript
const isDesktop = Platform.OS === 'macos' || Platform.OS === 'windows';
```

---

## Phase 6: Metro & Build Configuration

### Files to modify:

| File | Change |
|------|--------|
| `metro.config.js` | Block Windows build artifacts, add RNW path resolution |
| `.gitignore` | Add `macos/Pods/`, `macos/build/`, `windows/packages/`, etc. |
| `package.json` | Add deps (`react-native-macos`, `react-native-windows`, `firebase`), add scripts (`macos`, `windows`) |
| `react-native.config.js` | Add macOS platform config |
| `tsconfig.json` | Add `@/services/*`, `@/native/*` path aliases |
| `babel.config.js` | Add matching module resolver aliases |

### New scripts:
```json
"premacos": "node scripts/merge-env.js",
"macos": "ENVFILE=.env.merged react-native run-macos",
"prewindows": "node scripts/merge-env.js",
"windows": "ENVFILE=.env.merged npx @react-native-community/cli run-windows"
```

---

## Known Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| `react-native-screens` may not support macOS | Podfile nil-safe patch for RCTThirdPartyComponentsProvider; may need to use `@react-navigation/stack` (JS-based) on desktop |
| `react-native-config` may not work on desktop | env.ts already has `process.env` fallback |
| `Alert.alert()` behavior on desktop | Should work on macOS (NSAlert); verify on Windows |
| Metro port not passed to macOS build | May need explicit `--port 8084` in macos script |
| Windows autolinking for WebAuth | Embed module directly in app's vcxproj (same as svgr_app_rn pattern) |

## Verification

1. **macOS**: `bun run macos` — app launches, sidebar navigation works, Google Sign-In via system browser works, email/password auth works
2. **Windows**: `bun run windows` — app launches, sidebar navigation works, auth works
3. **iOS**: `bun run ios` — verify existing mobile flow still works with platform-specific files
4. **Android**: `bun run android` — verify existing mobile flow still works

## Execution Order

```
Phase 6 (config) ─── partial: package.json deps, metro.config, .gitignore
       │
Phase 1 (building_blocks_rn WebAuth)
       │
Phase 2 (macOS project) ──────────┐
Phase 3 (Windows project) ────────┤
       │                           │
Phase 4 (platform-specific auth) ──┘
       │
Phase 5 (desktop navigation)
       │
Phase 6 (config) ─── remaining: scripts, tsconfig, babel
```
