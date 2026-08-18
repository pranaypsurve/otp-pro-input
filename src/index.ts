// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Pranay Surve

export { OtpInput } from './OtpInput';
export type { OtpInputProps, OtpInputHandle, OtpSlotProps, AllowedChars } from './OtpInput';

export { useOtpInput, useOtpInputHandle } from './useOtpInput';
export type { UseOtpInputOptions, UseOtpInputReturn } from './useOtpInput';

export { isWebOtpSupported, requestWebOtp, subscribeWebOtp } from './webOtp';
export type { WebOtpOptions } from './webOtp';

export {
  sanitizeValue,
  valueToSlots,
  slotsToValue,
  isComplete,
  resolveCharPattern,
  defaultSlotLabel,
  getInputAttributes,
  clampOtpLength,
  OTP_MIN_LENGTH,
  OTP_MAX_LENGTH,
} from './utils';
export type { AllowedCharsPreset } from './utils';
