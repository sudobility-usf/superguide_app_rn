/**
 * AuthContext - Firebase Authentication for Desktop (macOS / Windows)
 *
 * Uses Firebase JS SDK (`firebase/auth`) instead of native @react-native-firebase/auth.
 * Google Sign-In uses the PKCE OAuth flow via WebAuth native module.
 *
 * Provides {@link AuthProvider} and {@link useAuth} for accessing auth state
 * and performing sign-in, sign-up, sign-out, and password reset operations
 * throughout the component tree.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  initializeAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithCredential,
  signOut as firebaseSignOut,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  onAuthStateChanged,
  type Auth,
  type User,
  // @ts-expect-error – getReactNativePersistence is exported at runtime
  getReactNativePersistence,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FIREBASE_CONFIG } from '@/config/env';
import { signInWithGoogleOAuth } from '@/services/googleAuth';

/** Serialisable subset of the Firebase User for consumption by components. */
export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAnonymous: boolean;
}

/** The shape of the value provided by {@link AuthProvider} via React context. */
export interface AuthContextValue {
  /** The currently authenticated user, or `null` if signed out. */
  user: AuthUser | null;
  /** Whether an auth operation (sign-in, sign-up, sign-out) is in progress. */
  isLoading: boolean;
  /** Whether the initial auth state has been determined (Firebase listener fired at least once). */
  isReady: boolean;
  /** The current Firebase ID token, or `null` if not authenticated. */
  token: string | null;
  /** Initiate Google Sign-In via the PKCE OAuth flow. */
  signInWithGoogle: () => Promise<void>;
  /** Sign in with email and password. */
  signInWithEmail: (email: string, password: string) => Promise<void>;
  /** Create a new account with email and password. */
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  /** Sign the current user out. */
  signOut: () => Promise<void>;
  /** Send a password-reset email to the given address. */
  sendPasswordResetEmail: (email: string) => Promise<void>;
  /** Force-refresh the Firebase ID token and return the new token string. */
  refreshToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Lazy Firebase initialization
let app: FirebaseApp | null = null;
let firebaseAuth: Auth | null = null;

/**
 * Lazily initialise the Firebase app and auth instance.
 *
 * Returns `null` when the Firebase API key is not configured (e.g. in
 * test environments), allowing the app to render without Firebase.
 *
 * @returns The Firebase {@link Auth} instance, or `null`.
 */
function getFirebaseAuth(): Auth | null {
  if (!FIREBASE_CONFIG.apiKey) return null;
  if (!app) {
    app = initializeApp(FIREBASE_CONFIG);
    firebaseAuth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  }
  return firebaseAuth;
}

/**
 * Convert a Firebase {@link User} into a plain {@link AuthUser} object.
 *
 * @param firebaseUser - The Firebase user, or `null` if signed out.
 * @returns A serialisable {@link AuthUser}, or `null`.
 */
function toAuthUser(firebaseUser: User | null): AuthUser | null {
  if (!firebaseUser) return null;
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    displayName: firebaseUser.displayName,
    photoURL: firebaseUser.photoURL,
    isAnonymous: firebaseUser.isAnonymous,
  };
}

/**
 * Context provider that manages Firebase Authentication state and exposes
 * auth operations to the component tree.
 *
 * Sets up an `onAuthStateChanged` listener on mount and a periodic token
 * refresh every 50 minutes (Firebase tokens expire after 60 minutes).
 *
 * @param children - The React child elements to render inside the provider.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [rawUser, setRawUser] = useState<User | null>(null);

  // Listen to auth state changes
  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) {
      setIsLoading(false);
      setIsReady(true);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(toAuthUser(firebaseUser));
      setRawUser(firebaseUser);

      if (firebaseUser) {
        try {
          const idToken = await firebaseUser.getIdToken();
          setToken(idToken);
        } catch (error) {
          console.error('[Auth] Error getting ID token:', error);
          setToken(null);
        }
      } else {
        setToken(null);
      }

      setIsLoading(false);
      setIsReady(true);
    });

    return unsubscribe;
  }, []);

  // Refresh token periodically (Firebase tokens expire after 1 hour)
  useEffect(() => {
    if (!rawUser) return;

    const refreshInterval = setInterval(async () => {
      try {
        const newToken = await rawUser.getIdToken(true);
        setToken(newToken);
      } catch (error) {
        console.error('Error refreshing token:', error);
      }
    }, 50 * 60 * 1000); // Refresh every 50 minutes

    return () => clearInterval(refreshInterval);
  }, [rawUser]);

  const signInWithGoogle = useCallback(async () => {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error('Firebase not configured');
    setIsLoading(true);
    try {
      const credential = await signInWithGoogleOAuth();
      if (credential) {
        await signInWithCredential(auth, credential);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error('Firebase not configured');
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error('Firebase not configured');
    setIsLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    const auth = getFirebaseAuth();
    if (!auth) return;
    setIsLoading(true);
    try {
      await firebaseSignOut(auth);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendPasswordResetEmail = useCallback(async (email: string) => {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error('Firebase not configured');
    await firebaseSendPasswordResetEmail(auth, email);
  }, []);

  const refreshToken = useCallback(async () => {
    if (!rawUser) return null;
    try {
      const newToken = await rawUser.getIdToken(true);
      setToken(newToken);
      return newToken;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return null;
    }
  }, [rawUser]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isLoading,
    isReady,
    token,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    sendPasswordResetEmail,
    refreshToken,
  }), [
    user,
    isLoading,
    isReady,
    token,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    sendPasswordResetEmail,
    refreshToken,
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Consume the {@link AuthContextValue} from the nearest {@link AuthProvider}.
 *
 * @throws {Error} If called outside of an {@link AuthProvider}.
 * @returns The current {@link AuthContextValue}.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
