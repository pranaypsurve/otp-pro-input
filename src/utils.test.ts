import { describe, expect, it } from 'vitest';
import {
  clampOtpLength,
  defaultSlotLabel,
  getInputAttributes,
  isComplete,
  OTP_MAX_LENGTH,
  OTP_MIN_LENGTH,
  sanitizeValue,
  slotsToValue,
  valueToSlots,
} from './utils';

describe('utils', () => {
  describe('clampOtpLength', () => {
    it('clamps to supported bounds', () => {
      expect(OTP_MIN_LENGTH).toBe(3);
      expect(OTP_MAX_LENGTH).toBe(8);
      expect(clampOtpLength(1)).toBe(3);
      expect(clampOtpLength(8)).toBe(8);
      expect(clampOtpLength(12)).toBe(8);
      expect(clampOtpLength(4.9)).toBe(4);
    });
  });

  describe('sanitizeValue', () => {
    it('keeps only digits in numeric mode', () => {
      expect(sanitizeValue('12-34 56', /[0-9]/)).toBe('123456');
    });

    it('keeps alphanumeric characters', () => {
      expect(sanitizeValue('a1-B2!', /[a-zA-Z0-9]/)).toBe('a1B2');
    });
  });

  describe('valueToSlots / slotsToValue', () => {
    it('splits and joins correctly', () => {
      const slots = valueToSlots('123', 6);
      expect(slots).toEqual(['1', '2', '3', '', '', '']);
      expect(slotsToValue(slots)).toBe('123');
    });
  });

  describe('isComplete', () => {
    it('returns true when all slots filled', () => {
      expect(isComplete(['1', '2', '3'])).toBe(true);
    });

    it('returns false when any slot empty', () => {
      expect(isComplete(['1', '', '3'])).toBe(false);
    });
  });

  describe('defaultSlotLabel', () => {
    it('generates accessible label', () => {
      expect(defaultSlotLabel(0, 6)).toBe('Digit 1 of 6');
    });
  });

  describe('getInputAttributes', () => {
    it('returns numeric inputMode for numeric preset', () => {
      expect(getInputAttributes('numeric')).toEqual({
        inputMode: 'numeric',
        pattern: '[0-9]*',
      });
    });
  });
});
