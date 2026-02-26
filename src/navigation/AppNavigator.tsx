import React, { useState } from 'react';
import { View, StyleSheet, Platform, useColorScheme } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  ClockIcon,
  Cog6ToothIcon,
} from 'react-native-heroicons/outline';
import {
  ClockIcon as ClockIconSolid,
  Cog6ToothIcon as Cog6ToothIconSolid,
} from 'react-native-heroicons/solid';

import { lightTheme, darkTheme } from '@/config/theme';
import { useSettingsStore } from '@/stores/settingsStore';
import type { RootTabParamList } from './types';

import { HistoriesStack } from './HistoriesStack';
import { SettingsStack } from './SettingsStack';
import { DesktopSidebar, type SidebarTab } from './DesktopSidebar';

const isDesktop = Platform.OS === 'macos' || Platform.OS === 'windows';

const Tab = createBottomTabNavigator<RootTabParamList>();

// Tab icon render functions defined outside component to avoid unstable references
function renderHistoriesIcon({ focused, color, size }: { focused: boolean; color: string; size: number }) {
  return focused ? (
    <ClockIconSolid color={color} size={size} />
  ) : (
    <ClockIcon color={color} size={size} />
  );
}

function renderSettingsIcon({ focused, color, size }: { focused: boolean; color: string; size: number }) {
  return focused ? (
    <Cog6ToothIconSolid color={color} size={size} />
  ) : (
    <Cog6ToothIcon color={color} size={size} />
  );
}

const tabComponents: Record<SidebarTab, React.ComponentType> = {
  HistoriesTab: HistoriesStack,
  SettingsTab: SettingsStack,
};

function DesktopNavigator({ theme }: { theme: typeof lightTheme }) {
  const [activeTab, setActiveTab] = useState<SidebarTab>('HistoriesTab');
  const ActiveComponent = tabComponents[activeTab];

  return (
    <NavigationContainer theme={theme}>
      <View style={styles.desktopContainer}>
        <DesktopSidebar activeTab={activeTab} onTabPress={setActiveTab} />
        <View style={styles.desktopContent}>
          <ActiveComponent />
        </View>
      </View>
    </NavigationContainer>
  );
}

function MobileNavigator({ theme }: { theme: typeof lightTheme }) {
  return (
    <NavigationContainer theme={theme}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.dark ? '#9ca3af' : '#6b7280',
          tabBarStyle: {
            backgroundColor: theme.colors.card,
            borderTopColor: theme.colors.border,
          },
        }}
      >
        <Tab.Screen
          name="HistoriesTab"
          component={HistoriesStack}
          options={{
            tabBarLabel: 'Histories',
            tabBarIcon: renderHistoriesIcon,
          }}
        />
        <Tab.Screen
          name="SettingsTab"
          component={SettingsStack}
          options={{
            tabBarLabel: 'Settings',
            tabBarIcon: renderSettingsIcon,
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

export function AppNavigator() {
  const systemColorScheme = useColorScheme();
  const { theme: userTheme } = useSettingsStore();
  const isDark = userTheme === 'system'
    ? systemColorScheme === 'dark'
    : userTheme === 'dark';
  const theme = isDark ? darkTheme : lightTheme;

  if (isDesktop) {
    return <DesktopNavigator theme={theme} />;
  }

  return <MobileNavigator theme={theme} />;
}

const styles = StyleSheet.create({
  desktopContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  desktopContent: {
    flex: 1,
  },
});
