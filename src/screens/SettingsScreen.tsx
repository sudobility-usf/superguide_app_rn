/**
 * SettingsScreen - App settings and preferences
 *
 * Displays appearance settings (theme), account info with sign-in/sign-out,
 * and about section. Uses the shared AuthModal for authentication flows.
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTabBarHeight } from '@/hooks/useTabBarHeight';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import { useAuth } from '@/context/AuthContext';
import { useSettingsStore, type ThemeMode } from '@/stores/settingsStore';
import { useAppColors } from '@/hooks/useAppColors';
import { changeLanguage } from '@/i18n';
import { SUPPORTED_LANGUAGES } from '@/config/constants';
import AuthModal from '@/components/AuthModal';
import type { SettingsScreenProps } from '@/navigation/types';

/** Display names for supported languages (in their native script). */
const LANGUAGE_LABELS: Record<string, string> = {
  en: 'English',
  ar: 'العربية',
  de: 'Deutsch',
  es: 'Español',
  fr: 'Français',
  it: 'Italiano',
  ja: '日本語',
  ko: '한국어',
  pt: 'Português',
  ru: 'Русский',
  sv: 'Svenska',
  th: 'ไทย',
  uk: 'Українська',
  vi: 'Tiếng Việt',
  zh: '中文(简体)',
  'zh-Hant': '中文(繁體)',
};

/** Available theme options for the theme picker. */
const themes: { value: ThemeMode; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export default function SettingsScreen(_props: SettingsScreenProps) {
  const { t } = useTranslation();
  const appColors = useAppColors();
  const { user, isLoading: authLoading, signOut } = useAuth();
  const { theme, setTheme } = useSettingsStore();

  const tabBarHeight = useTabBarHeight();

  // Auth modal state
  const [showAuthModal, setShowAuthModal] = useState(false);

  /** Show an alert to pick a theme mode. */
  const handleThemeChange = useCallback(() => {
    const currentIndex = themes.findIndex(th => th.value === theme);

    Alert.alert(
      t('settings.selectTheme'),
      undefined,
      [
        ...themes.map((th, index) => ({
          text: `${t(`settings.theme.${th.value}`, th.label)}${index === currentIndex ? ' \u2713' : ''}`,
          onPress: () => setTheme(th.value),
        })),
        { text: t('common.cancel'), style: 'cancel' as const },
      ]
    );
  }, [theme, setTheme, t]);

  /** Show an alert to pick a language. */
  const handleLanguageChange = useCallback(() => {
    const activeLang = i18n.language;
    Alert.alert(
      t('settings.language'),
      undefined,
      [
        ...SUPPORTED_LANGUAGES.map((lang) => ({
          text: `${LANGUAGE_LABELS[lang] ?? lang}${lang === activeLang ? ' \u2713' : ''}`,
          onPress: () => changeLanguage(lang),
        })),
        { text: t('common.cancel'), style: 'cancel' as const },
      ]
    );
  }, [t]);

  /** Confirm and execute sign-out. */
  const handleSignOut = useCallback(async () => {
    Alert.alert(
      t('auth.signOut'),
      t('auth.signOutConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('auth.signOut'),
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              console.error('Sign out error:', error);
            }
          },
        },
      ]
    );
  }, [signOut, t]);

  const currentTheme = themes.find(th => th.value === theme)?.label ?? 'System';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: appColors.background }]} edges={['left', 'right']}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: tabBarHeight + 16 }]}>
        {/* Appearance Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: appColors.textMuted }]}>
            {t('settings.appearance')}
          </Text>
          <View style={[styles.group, { backgroundColor: appColors.card }]}>
            <Pressable
              style={styles.settingRow}
              onPress={handleThemeChange}
              accessibilityRole="button"
              accessibilityLabel={`${t('settings.theme.label')}: ${t(`settings.theme.${theme}`, currentTheme)}`}
            >
              <View style={styles.settingContent}>
                <Text style={[styles.settingLabel, { color: appColors.text }]}>
                  {t('settings.theme.label')}
                </Text>
                <Text style={[styles.settingDescription, { color: appColors.textMuted }]}>
                  {t('settings.themeDescription')}
                </Text>
              </View>
              <Text style={[styles.settingValue, { color: appColors.textMuted }]}>
                {t(`settings.theme.${theme}`, currentTheme)}
              </Text>
            </Pressable>
            <View style={[styles.separator, { backgroundColor: appColors.border }]} />
            <Pressable
              style={styles.settingRow}
              onPress={handleLanguageChange}
              accessibilityRole="button"
              accessibilityLabel={`${t('settings.language')}: ${LANGUAGE_LABELS[i18n.language] ?? i18n.language}`}
            >
              <View style={styles.settingContent}>
                <Text style={[styles.settingLabel, { color: appColors.text }]}>
                  {t('settings.language')}
                </Text>
                <Text style={[styles.settingDescription, { color: appColors.textMuted }]}>
                  {t('settings.languageDescription')}
                </Text>
              </View>
              <Text style={[styles.settingValue, { color: appColors.textMuted }]}>
                {LANGUAGE_LABELS[i18n.language] ?? i18n.language}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: appColors.textMuted }]}>
            {t('settings.account')}
          </Text>
          <View style={[styles.group, { backgroundColor: appColors.card }]}>
            {authLoading ? (
              <View style={styles.settingRow}>
                <ActivityIndicator size="small" color={appColors.primary} />
              </View>
            ) : user ? (
              <View style={styles.settingRow}>
                <View style={styles.settingContent}>
                  <Text style={[styles.settingLabel, { color: appColors.text }]}>
                    {user.email || t('auth.signedIn')}
                  </Text>
                  <Text style={[styles.settingDescription, { color: appColors.textMuted }]}>
                    {user.displayName || user.uid.substring(0, 8)}
                  </Text>
                </View>
                <Pressable onPress={handleSignOut} accessibilityRole="button" accessibilityLabel={t('auth.signOut')}>
                  <Text style={[styles.signOutText, { color: appColors.primary }]}>
                    {t('auth.signOut')}
                  </Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                style={styles.settingRow}
                onPress={() => {
                  setShowAuthModal(true);
                }}
                accessibilityRole="button"
                accessibilityLabel={t('auth.signIn')}
              >
                <View style={styles.settingContent}>
                  <Text style={[styles.settingLabel, { color: appColors.text }]}>
                    {t('auth.signIn')}
                  </Text>
                  <Text style={[styles.settingDescription, { color: appColors.textMuted }]}>
                    {t('settings.signInDescription')}
                  </Text>
                </View>
                <Text style={[styles.arrow, { color: appColors.textMuted }]}>{'\u203A'}</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: appColors.textMuted }]}>
            {t('settings.about')}
          </Text>
          <Text style={[styles.versionText, { color: appColors.textMuted }]}>
            {t('settings.version')}
          </Text>
          <Text style={[styles.copyrightText, { color: appColors.textMuted }]}>
            {t('settings.copyright')}
          </Text>
        </View>
      </ScrollView>

      <AuthModal
        visible={showAuthModal}
        onDismiss={() => setShowAuthModal(false)}
        initialMode="signin"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  group: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  settingContent: {
    flex: 1,
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 16,
  },
  settingDescription: {
    fontSize: 13,
    marginTop: 2,
  },
  settingValue: {
    fontSize: 16,
  },
  arrow: {
    fontSize: 20,
  },
  signOutText: {
    fontSize: 16,
  },
  versionText: {
    fontSize: 14,
    paddingHorizontal: 4,
  },
  copyrightText: {
    fontSize: 12,
    marginTop: 4,
    paddingHorizontal: 4,
  },
});
