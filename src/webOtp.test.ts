import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { isWebOtpSupported, requestWebOtp } from './webOtp';

describe('webOtp', () => {
  const originalCredentials = globalThis.navigator?.credentials;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    if (originalCredentials) {
      Object.defineProperty(navigator, 'credentials', {
        value: originalCredentials,
        configurable: true,
      });
    }
  });

  describe('isWebOtpSupported', () => {
    it('returns false when OTPCredential is unavailable', () => {
      expect(isWebOtpSupported()).toBe(false);
    });

    it('returns true when OTPCredential and credentials.get exist', () => {
      (globalThis as typeof globalThis & { OTPCredential: unknown }).OTPCredential = class {};
      Object.defineProperty(navigator, 'credentials', {
        value: { get: vi.fn() },
        configurable: true,
      });
      expect(isWebOtpSupported()).toBe(true);
      delete (globalThis as typeof globalThis & { OTPCredential?: unknown }).OTPCredential;
    });
  });

  describe('requestWebOtp', () => {
    it('calls onOtp with received code', async () => {
      (globalThis as typeof globalThis & { OTPCredential: unknown }).OTPCredential = class {};
      const onOtp = vi.fn();
      Object.defineProperty(navigator, 'credentials', {
        value: {
          get: vi.fn().mockResolvedValue({ code: '654321' }),
        },
        configurable: true,
      });

      await requestWebOtp({ onOtp });

      expect(onOtp).toHaveBeenCalledWith('654321');
      delete (globalThis as typeof globalThis & { OTPCredential?: unknown }).OTPCredential;
    });

    it('no-ops gracefully when unsupported', async () => {
      const onOtp = vi.fn();
      await requestWebOtp({ onOtp });
      expect(onOtp).not.toHaveBeenCalled();
    });

    it('silently handles AbortError', async () => {
      (globalThis as typeof globalThis & { OTPCredential: unknown }).OTPCredential = class {};
      const onOtp = vi.fn();
      Object.defineProperty(navigator, 'credentials', {
        value: {
          get: vi.fn().mockRejectedValue(new DOMException('Aborted', 'AbortError')),
        },
        configurable: true,
      });

      await expect(requestWebOtp({ onOtp })).resolves.toBeUndefined();
      expect(onOtp).not.toHaveBeenCalled();
      delete (globalThis as typeof globalThis & { OTPCredential?: unknown }).OTPCredential;
    });
  });
});
