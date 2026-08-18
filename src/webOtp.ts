/**
 * Feature-detected WebOTP API integration for automatic SMS OTP fill.
 * Tree-shakeable — import only when `enableWebOtp` is used.
 */

export interface WebOtpOptions {
  /** Called when an OTP code is received from the WebOTP API. */
  onOtp: (code: string) => void;
  /** AbortSignal to cancel the credential request. */
  signal?: AbortSignal;
}

export interface WebOtpCredential extends Credential {
  code: string;
}

export interface WebOtpRequestOptions {
  otp: { transport: string[] };
  signal?: AbortSignal;
}

declare global {
  interface CredentialsContainer {
    get(options?: CredentialRequestOptions | WebOtpRequestOptions): Promise<Credential | null>;
  }

  interface CredentialRequestOptions {
    otp?: { transport: string[] };
    signal?: AbortSignal;
  }
}

/**
 * Returns true if the WebOTP API is available in the current environment.
 */
export function isWebOtpSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'OTPCredential' in window &&
    typeof navigator !== 'undefined' &&
    typeof navigator.credentials !== 'undefined' &&
    typeof navigator.credentials.get === 'function'
  );
}

/**
 * Request an OTP from the WebOTP API (Android Chrome / supported browsers).
 * Resolves when OTP is received or rejects on error/abort.
 * No-ops gracefully when unsupported.
 */
export async function requestWebOtp(options: WebOtpOptions): Promise<void> {
  if (!isWebOtpSupported()) {
    return;
  }

  try {
    const credential = (await navigator.credentials.get({
      otp: { transport: ['sms'] },
      signal: options.signal,
    })) as WebOtpCredential | null;

    if (credential?.code) {
      options.onOtp(credential.code);
    }
  } catch (error) {
    // AbortError and NotAllowedError are expected when user dismisses or denies
    if (error instanceof DOMException && (error.name === 'AbortError' || error.name === 'NotAllowedError')) {
      return;
    }
    // Silently ignore other errors — manual entry still works
  }
}

/**
 * Start listening for WebOTP and return a cleanup function.
 */
export function subscribeWebOtp(
  enabled: boolean,
  onOtp: (code: string) => void,
): () => void {
  if (!enabled || !isWebOtpSupported()) {
    return () => {};
  }

  const controller = new AbortController();

  requestWebOtp({ onOtp, signal: controller.signal });

  return () => {
    controller.abort();
  };
}
