/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface BiometricCheckResult {
  isSupported: boolean;
  hasPlatformScanner: boolean;
  reason?: string;
}

export interface BiometricAuthResult {
  success: boolean;
  error?: string;
  cancelled?: boolean;
}

const CREDENTIAL_STORAGE_KEY = 'orbitgoals_biometric_credential_id';

/**
 * Checks whether the current device and browser have a real hardware fingerprint scanner
 * or platform biometric authenticator available (WebAuthn Platform Authenticator).
 */
export async function checkBiometricAvailability(): Promise<BiometricCheckResult> {
  if (typeof window === 'undefined') {
    return { isSupported: false, hasPlatformScanner: false, reason: 'Window not available' };
  }

  if (!window.isSecureContext) {
    return {
      isSupported: false,
      hasPlatformScanner: false,
      reason: 'Biometric requires a secure context (HTTPS or localhost).',
    };
  }

  if (!window.PublicKeyCredential) {
    return {
      isSupported: false,
      hasPlatformScanner: false,
      reason: 'Web Authentication API is not supported in this browser.',
    };
  }

  try {
    const hasPlatformScanner =
      await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();

    if (!hasPlatformScanner) {
      return {
        isSupported: true,
        hasPlatformScanner: false,
        reason: 'No hardware fingerprint scanner or platform biometric sensor detected on this device.',
      };
    }

    return {
      isSupported: true,
      hasPlatformScanner: true,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      isSupported: false,
      hasPlatformScanner: false,
      reason: msg,
    };
  }
}

/**
 * Helper to convert ArrayBuffer to Base64
 */
function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

/**
 * Helper to convert Base64 to Uint8Array
 */
function base64ToUint8Array(base64: string): Uint8Array {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Enrolls a new fingerprint via WebAuthn platform authenticator.
 * This triggers the device's native fingerprint/biometric prompt.
 */
export async function enrollFingerprint(
  userId = 'orbitgoals-user',
  userName = 'OrbitGoals Achiever'
): Promise<BiometricAuthResult> {
  const avail = await checkBiometricAvailability();
  if (!avail.isSupported || !avail.hasPlatformScanner) {
    return {
      success: false,
      error: avail.reason || 'Hardware fingerprint scanner is not available on this device.',
    };
  }

  try {
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);
    const userHandle = new TextEncoder().encode(userId);

    const credential = (await navigator.credentials.create({
      publicKey: {
        challenge: (challenge as unknown as BufferSource),
        rp: {
          name: 'OrbitGoals Habit Tracker',
          id: window.location.hostname,
        },
        user: {
          id: (userHandle as unknown as BufferSource),
          name: userName,
          displayName: userName,
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' }, // ES256
          { alg: -257, type: 'public-key' }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform', // Enforce built-in hardware biometric scanner
          userVerification: 'required', // Enforce real biometric scan
          residentKey: 'preferred',
        },
        timeout: 60000,
        attestation: 'none',
      },
    })) as PublicKeyCredential | null;

    if (!credential) {
      return { success: false, error: 'Registration failed: no credential received.' };
    }

    const credIdBase64 = bufferToBase64(credential.rawId);
    localStorage.setItem(CREDENTIAL_STORAGE_KEY, credIdBase64);

    return { success: true };
  } catch (err: unknown) {
    if (err instanceof DOMException) {
      if (err.name === 'NotAllowedError') {
        return { success: false, cancelled: true, error: 'Fingerprint scan was cancelled or timed out.' };
      }
      if (err.name === 'InvalidStateError') {
        return { success: false, error: 'This authenticator is already enrolled.' };
      }
      return { success: false, error: `Biometric error: ${err.message}` };
    }
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * Authenticates the user with their real fingerprint scanner.
 * Prompts the OS/device native biometric prompt.
 */
export async function verifyFingerprint(): Promise<BiometricAuthResult> {
  const avail = await checkBiometricAvailability();
  if (!avail.isSupported || !avail.hasPlatformScanner) {
    return {
      success: false,
      error: avail.reason || 'Hardware fingerprint scanner not available on this device.',
    };
  }

  try {
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);
    const storedCredId = localStorage.getItem(CREDENTIAL_STORAGE_KEY);

    const allowCredentials = storedCredId
      ? [
          {
            id: (base64ToUint8Array(storedCredId) as unknown as BufferSource),
            type: 'public-key' as const,
            transports: ['internal' as AuthenticatorTransport],
          },
        ]
      : undefined;

    const assertion = (await navigator.credentials.get({
      publicKey: {
        challenge: (challenge as unknown as BufferSource),
        rpId: window.location.hostname,
        userVerification: 'required', // Requires real fingerprint / biometric hardware check
        timeout: 60000,
        allowCredentials,
      },
    })) as PublicKeyCredential | null;

    if (!assertion) {
      return { success: false, error: 'Fingerprint verification failed.' };
    }

    return { success: true };
  } catch (err: unknown) {
    if (err instanceof DOMException) {
      if (err.name === 'NotAllowedError') {
        return { success: false, cancelled: true, error: 'Fingerprint scan cancelled or timed out.' };
      }
      return { success: false, error: `Fingerprint verification failed: ${err.message}` };
    }
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * Clears stored biometric credential
 */
export function removeBiometricCredential(): void {
  localStorage.removeItem(CREDENTIAL_STORAGE_KEY);
}

/**
 * Checks if a biometric credential is registered
 */
export function hasEnrolledBiometric(): boolean {
  return !!localStorage.getItem(CREDENTIAL_STORAGE_KEY);
}
