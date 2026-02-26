module.exports = {
  dependencies: {
    // Disable native Firebase packages on macOS — desktop uses Firebase JS SDK
    '@react-native-firebase/app': {
      platforms: { macos: null },
    },
    '@react-native-firebase/auth': {
      platforms: { macos: null },
    },
    '@react-native-firebase/analytics': {
      platforms: { macos: null },
    },
    // Google Sign-In native module doesn't support macOS — desktop uses WebAuth PKCE flow
    '@react-native-google-signin/google-signin': {
      platforms: { macos: null },
    },
  },
  project: {
    macos: {
      sourceDir: 'macos',
    },
  },
};
