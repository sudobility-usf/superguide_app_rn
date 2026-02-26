/**
 * AuthModal - Shared authentication modal component
 *
 * Provides a reusable modal with Google Sign-In, email/password form,
 * mode toggle (sign-in vs sign-up), and error display. Used by both
 * HistoriesScreen and SettingsScreen to avoid duplicating ~100 lines
 * of auth UI and handler logic in each screen.
 *
 * @example
 * ```tsx
 * <AuthModal visible={showAuthModal} onDismiss={() => setShowAuthModal(false)} />
 * ```
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { useAppColors } from '@/hooks/useAppColors';
import GoogleIcon from '@/components/GoogleIcon';

/** Props for the AuthModal component. */
export interface AuthModalProps {
  /** Whether the modal is visible. */
  visible: boolean;
  /** Callback invoked when the modal should be dismissed (cancel or successful auth). */
  onDismiss: () => void;
  /** The initial auth mode to display. Defaults to 'signin'. */
  initialMode?: 'signin' | 'signup';
}

/**
 * A full-screen modal that handles user authentication via Google Sign-In
 * or email/password. Manages its own internal state for form fields,
 * loading indicators, and error messages.
 *
 * @param props - {@link AuthModalProps}
 */
export default function AuthModal({ visible, onDismiss, initialMode = 'signin' }: AuthModalProps) {
  const { t } = useTranslation();
  const appColors = useAppColors();
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();

  const [authMode, setAuthMode] = useState<'signin' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /** Reset form state when the modal closes. */
  const handleDismiss = useCallback(() => {
    setEmail('');
    setPassword('');
    setAuthError(null);
    setIsSubmitting(false);
    onDismiss();
  }, [onDismiss]);

  /** Submit email/password authentication (sign-in or sign-up). */
  const handleAuthSubmit = useCallback(async () => {
    if (!email.trim() || !password.trim()) {
      setAuthError(t('auth.fillAllFields'));
      return;
    }
    setIsSubmitting(true);
    setAuthError(null);
    try {
      if (authMode === 'signin') {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password);
      }
      handleDismiss();
    } catch (error: unknown) {
      const authErr = error as { message?: string };
      setAuthError(authErr.message || t('auth.error'));
    } finally {
      setIsSubmitting(false);
    }
  }, [email, password, authMode, signInWithEmail, signUpWithEmail, t, handleDismiss]);

  /** Initiate Google Sign-In via the PKCE OAuth flow. */
  const handleGoogleSignIn = useCallback(async () => {
    setIsSubmitting(true);
    setAuthError(null);
    try {
      await signInWithGoogle();
      handleDismiss();
    } catch (error: unknown) {
      const authErr = error as { message?: string; code?: string };
      if (authErr.code !== 'SIGN_IN_CANCELLED' && authErr.code !== 'sign_in_cancelled') {
        setAuthError(authErr.message || t('auth.error'));
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [signInWithGoogle, t, handleDismiss]);

  const modalContent = (
    <SafeAreaView style={[styles.modalContainer, { backgroundColor: appColors.background }]}>
      <View style={[styles.modalHeader, { borderBottomColor: appColors.border, backgroundColor: appColors.card }]}>
        <Pressable onPress={handleDismiss} accessibilityRole="button" accessibilityLabel={t('common.cancel')}>
          <Text style={[styles.modalCancel, { color: appColors.primary }]}>{t('common.cancel')}</Text>
        </Pressable>
        <Text style={[styles.modalTitle, { color: appColors.text }]}>
          {authMode === 'signin' ? t('auth.signIn') : t('auth.signUp')}
        </Text>
        <View style={styles.modalHeaderSpacer} />
      </View>

      <View style={styles.modalContent}>
        <Pressable
          style={[styles.googleButton, { backgroundColor: appColors.card, borderColor: appColors.border }, isSubmitting && styles.buttonDisabled]}
          onPress={handleGoogleSignIn}
          disabled={isSubmitting}
          accessibilityRole="button"
          accessibilityLabel={t('auth.continueWithGoogle')}
        >
          <GoogleIcon size={20} />
          <Text style={[styles.googleButtonText, { color: appColors.textSecondary }]}>
            {t('auth.continueWithGoogle')}
          </Text>
        </Pressable>

        <View style={styles.dividerRow}>
          <View style={[styles.dividerLine, { backgroundColor: appColors.border }]} />
          <Text style={[styles.dividerText, { color: appColors.textMuted }]}>{t('common.or')}</Text>
          <View style={[styles.dividerLine, { backgroundColor: appColors.border }]} />
        </View>

        <TextInput
          style={[styles.input, { backgroundColor: appColors.card, borderColor: appColors.border, color: appColors.text }]}
          placeholder={t('auth.email')}
          placeholderTextColor={appColors.textMuted}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          accessibilityLabel={t('auth.email')}
        />

        <TextInput
          style={[styles.input, { backgroundColor: appColors.card, borderColor: appColors.border, color: appColors.text }]}
          placeholder={t('auth.password')}
          placeholderTextColor={appColors.textMuted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password"
          accessibilityLabel={t('auth.password')}
        />

        {authError && (
          <Text style={[styles.errorText, { color: appColors.error }]} accessibilityRole="alert">
            {authError}
          </Text>
        )}

        <Pressable
          style={[styles.submitButton, { backgroundColor: appColors.primary }, isSubmitting && styles.buttonDisabled]}
          onPress={handleAuthSubmit}
          disabled={isSubmitting}
          accessibilityRole="button"
          accessibilityLabel={authMode === 'signin' ? t('auth.signIn') : t('auth.signUp')}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.submitButtonText}>
              {authMode === 'signin' ? t('auth.signIn') : t('auth.signUp')}
            </Text>
          )}
        </Pressable>

        <Pressable
          onPress={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
          style={styles.switchAuthMode}
          accessibilityRole="button"
          accessibilityLabel={authMode === 'signin' ? t('auth.noAccount') : t('auth.hasAccount')}
        >
          <Text style={[styles.switchAuthModeText, { color: appColors.primary }]}>
            {authMode === 'signin' ? t('auth.noAccount') : t('auth.hasAccount')}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );

  // Modal is not supported on macOS/Windows — use a full-screen overlay instead.
  if (Platform.OS === 'macos' || Platform.OS === 'windows') {
    if (!visible) return null;
    return <View style={styles.fullScreenOverlay}>{modalContent}</View>;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleDismiss}
    >
      {modalContent}
    </Modal>
  );
}

const styles = StyleSheet.create({
  fullScreenOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  modalCancel: {
    fontSize: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  modalHeaderSpacer: {
    width: 60,
  },
  modalContent: {
    padding: 24,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
  },
  submitButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  switchAuthMode: {
    marginTop: 24,
    alignItems: 'center',
  },
  switchAuthModeText: {
    fontSize: 14,
  },
  googleButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  dividerText: {
    fontSize: 14,
    paddingHorizontal: 12,
  },
});
