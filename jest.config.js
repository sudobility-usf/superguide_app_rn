module.exports = {
  preset: 'react-native',
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|react-native-svg|react-native-heroicons|react-native-safe-area-context|react-native-screens|react-native-gesture-handler|@react-native-async-storage|react-native-localize|react-native-config|expo|expo-status-bar|@sudobility)/)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^react-native-config$': '<rootDir>/__mocks__/react-native-config.js',
  },
  setupFiles: [],
  testPathIgnorePatterns: ['/node_modules/'],
};
