import { GoogleAuthProvider, type OAuthCredential } from 'firebase/auth';
import { GOOGLE_OAUTH_CONFIG } from '@/config/env';
import {
  authenticate,
  generateCodeVerifier as nativeGenerateCodeVerifier,
  sha256Base64Url,
} from '@/native/WebAuth';

// --- URL Parameter Parsing ---

function parseCallbackParams(
  callbackUrl: string,
): Record<string, string> {
  const params: Record<string, string> = {};
  const qIndex = callbackUrl.indexOf('?');
  if (qIndex < 0) return params;
  const search = callbackUrl.slice(qIndex + 1);
  for (const pair of search.split('&')) {
    const [key, ...rest] = pair.split('=');
    if (key) {
      params[decodeURIComponent(key)] = decodeURIComponent(rest.join('='));
    }
  }
  return params;
}

// --- Token Exchange ---

interface GoogleTokenResponse {
  id_token: string;
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

function buildFormBody(params: Record<string, string>): string {
  return Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
}

async function exchangeCodeForTokens(
  code: string,
  codeVerifier: string,
  redirectUri: string,
): Promise<GoogleTokenResponse> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: buildFormBody({
      client_id: GOOGLE_OAUTH_CONFIG.clientId,
      code,
      code_verifier: codeVerifier,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Token exchange failed (${response.status}): ${errorBody}`,
    );
  }

  return response.json();
}

// --- Main Public API ---

export async function signInWithGoogleOAuth(): Promise<OAuthCredential | null> {
  const { clientId, reversedClientId } = GOOGLE_OAUTH_CONFIG;
  if (!clientId || !reversedClientId) {
    throw new Error('Google OAuth not configured');
  }

  const codeVerifier = await nativeGenerateCodeVerifier();
  const codeChallenge = await sha256Base64Url(codeVerifier);
  const redirectUri = `${reversedClientId}:/oauth2callback`;

  const authUrl =
    'https://accounts.google.com/o/oauth2/v2/auth?' +
    buildFormBody({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      prompt: 'select_account',
    });

  const callbackUrl = await authenticate(authUrl, reversedClientId);
  if (!callbackUrl) {
    return null; // User cancelled
  }

  const params = parseCallbackParams(callbackUrl);
  if (params.error) {
    throw new Error(
      `Google OAuth error: ${params.error} - ${params.error_description || ''}`,
    );
  }
  const code = params.code;
  if (!code) {
    throw new Error('No authorization code in callback URL');
  }

  const tokens = await exchangeCodeForTokens(code, codeVerifier, redirectUri);
  const credential = GoogleAuthProvider.credential(tokens.id_token);
  return credential;
}
