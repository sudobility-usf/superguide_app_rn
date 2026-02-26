import '@/polyfills/localStorage'; // Must be first — before any Zustand store import
import 'react-native-gesture-handler';
import '@/i18n'; // Initialize i18n
import React, { useState, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { loadStoredLanguagePreference } from '@/i18n';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/context/AuthContext';
import { ApiProvider } from '@/context/ApiContext';
import { useAuth } from '@/context/AuthContext';
import { ThemeProvider } from '@sudobility/building_blocks_rn';
import { AppNavigator } from '@/navigation';
import SplashScreen from '@/screens/SplashScreen';
import { initializeAllServices } from '@/di/initializeServices';

// Create a QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    },
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

function AppContent() {
  const { isReady } = useAuth();

  if (!isReady) {
    return <SplashScreen />;
  }

  return (
    <>
      <AppNavigator />
      <StatusBar style="auto" />
    </>
  );
}

export default function App() {
  const [servicesReady, setServicesReady] = useState(false);

  useEffect(() => {
    initializeAllServices()
      .then(() => setServicesReady(true))
      .catch((error) => {
        console.error('[App] Failed to initialize services:', error);
        // Still allow app to render even if some services fail
        setServicesReady(true);
      });
    loadStoredLanguagePreference();
  }, []);

  if (!servicesReady) {
    return <SplashScreen />;
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <ApiProvider>
              <QueryClientProvider client={queryClient}>
                <AppContent />
              </QueryClientProvider>
            </ApiProvider>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
