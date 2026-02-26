import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import {
  ClockIcon,
  Cog6ToothIcon,
} from 'react-native-heroicons/outline';
import {
  ClockIcon as ClockIconSolid,
  Cog6ToothIcon as Cog6ToothIconSolid,
} from 'react-native-heroicons/solid';
import { useAppColors } from '@/hooks/useAppColors';

export type SidebarTab = 'HistoriesTab' | 'SettingsTab';

interface DesktopSidebarProps {
  activeTab: SidebarTab;
  onTabPress: (tab: SidebarTab) => void;
}

const ICON_SIZE = 22;

const tabs: { key: SidebarTab; label: string }[] = [
  { key: 'HistoriesTab', label: 'Histories' },
  { key: 'SettingsTab', label: 'Settings' },
];

function TabIcon({ tab, focused, color }: { tab: SidebarTab; focused: boolean; color: string }) {
  switch (tab) {
    case 'HistoriesTab':
      return focused
        ? <ClockIconSolid color={color} size={ICON_SIZE} />
        : <ClockIcon color={color} size={ICON_SIZE} />;
    case 'SettingsTab':
      return focused
        ? <Cog6ToothIconSolid color={color} size={ICON_SIZE} />
        : <Cog6ToothIcon color={color} size={ICON_SIZE} />;
  }
}

export function DesktopSidebar({ activeTab, onTabPress }: DesktopSidebarProps) {
  const appColors = useAppColors();

  return (
    <View style={[styles.sidebar, { backgroundColor: appColors.card, borderRightColor: appColors.border }]}>
      <View style={styles.logo}>
        <Text style={[styles.logoText, { color: appColors.primary }]}>S</Text>
      </View>
      {tabs.map(({ key, label }) => {
        const focused = activeTab === key;
        const color = focused ? appColors.primary : appColors.textMuted;
        return (
          <Pressable
            key={key}
            style={[styles.tabItem, focused && { backgroundColor: appColors.background }]}
            onPress={() => onTabPress(key)}
          >
            <TabIcon tab={key} focused={focused} color={color} />
            <Text style={[styles.tabLabel, { color }]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: 80,
    borderRightWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
    alignItems: 'center',
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 22,
    fontWeight: '700',
  },
  tabItem: {
    width: 64,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 4,
    fontWeight: '500',
  },
});
