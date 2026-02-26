import { NativeModules, Platform } from 'react-native';

interface WebAuthModuleInterface {
  authenticate(url: string, callbackURLScheme: string): Promise<string | null>;
  generateCodeVerifier(): Promise<string>;
  sha256(input: string): Promise<string>;
}

const { WebAuthModule } = NativeModules;

export async function authenticate(
  url: string,
  callbackURLScheme: string,
): Promise<string | null> {
  if ((Platform.OS === 'macos' || Platform.OS === 'windows') && WebAuthModule) {
    return (WebAuthModule as WebAuthModuleInterface).authenticate(
      url,
      callbackURLScheme,
    );
  }
  throw new Error(`Web auth not implemented for ${Platform.OS}`);
}

export async function generateCodeVerifier(): Promise<string> {
  if ((Platform.OS === 'macos' || Platform.OS === 'windows') && WebAuthModule) {
    return (WebAuthModule as WebAuthModuleInterface).generateCodeVerifier();
  }
  throw new Error(`Code verifier generation not implemented for ${Platform.OS}`);
}

export async function sha256Base64Url(input: string): Promise<string> {
  if ((Platform.OS === 'macos' || Platform.OS === 'windows') && WebAuthModule) {
    return (WebAuthModule as WebAuthModuleInterface).sha256(input);
  }
  throw new Error(`SHA-256 not implemented for ${Platform.OS}`);
}
