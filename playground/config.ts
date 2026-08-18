import { clampOtpLength, OTP_MAX_LENGTH, OTP_MIN_LENGTH, type AllowedChars } from '../src/utils';

export type AllowedCharsMode = 'numeric' | 'alphanumeric' | 'custom';
export type GroupsPreset = 'none' | '3-3' | '2-2-2' | '3-4' | '4-4' | 'custom';
export type PreviewMode = 'default' | 'custom' | 'headless';
export type ControlMode = 'controlled' | 'uncontrolled';

export interface ThemeVars {
  gap: string;
  groupGap: string;
  slotSize: string;
  fontSize: string;
  borderRadius: string;
  borderColor: string;
  borderColorFocus: string;
  background: string;
  textColor: string;
  errorColor: string;
}

export interface PlaygroundConfig {
  // Core
  length: number;
  previewMode: PreviewMode;
  controlMode: ControlMode;

  // Behavior
  allowedCharsMode: AllowedCharsMode;
  customPattern: string;
  autoFocus: boolean;
  enableAutofill: boolean;
  enableWebOtp: boolean;

  // State
  disabled: boolean;
  readOnly: boolean;
  loading: boolean;
  errorEnabled: boolean;
  errorMessage: string;
  maskEnabled: boolean;
  maskChar: string;

  // Layout
  groupsPreset: GroupsPreset;
  customGroups: string;
  separatorEnabled: boolean;
  separatorChar: string;
  dir: 'ltr' | 'rtl';

  // Accessibility
  groupLabel: string;
  customSlotLabels: boolean;
  announceComplete: boolean;
  completeAnnouncement: string;

  // Advanced
  useDefaultStyles: boolean;
  inputName: string;
  simulateVerify: boolean;
  demoCode: string;

  // Theme
  theme: ThemeVars;
  themePreset: string;
}

export const DEFAULT_THEME: ThemeVars = {
  gap: '0.5rem',
  groupGap: '0.75rem',
  slotSize: '2.75rem',
  fontSize: '1.25rem',
  borderRadius: '0.5rem',
  borderColor: '#cbd5e1',
  borderColorFocus: '#6366f1',
  background: '#ffffff',
  textColor: '#0f172a',
  errorColor: '#ef4444',
};

export const THEME_PRESETS: Record<string, ThemeVars> = {
  Default: DEFAULT_THEME,
  Indigo: {
    ...DEFAULT_THEME,
    borderColor: '#c7d2fe',
    borderColorFocus: '#4f46e5',
    background: '#f5f3ff',
    textColor: '#312e81',
  },
  Dark: {
    ...DEFAULT_THEME,
    borderColor: '#374151',
    borderColorFocus: '#60a5fa',
    background: '#1f2937',
    textColor: '#f9fafb',
  },
  Minimal: {
    ...DEFAULT_THEME,
    borderRadius: '0.25rem',
    borderColor: '#e2e8f0',
    borderColorFocus: '#0f172a',
    slotSize: '2.5rem',
    fontSize: '1.125rem',
  },
  Rounded: {
    ...DEFAULT_THEME,
    borderRadius: '1rem',
    borderColor: '#fda4af',
    borderColorFocus: '#e11d48',
    background: '#fff1f2',
    textColor: '#881337',
  },
};

export const DEFAULT_CONFIG: PlaygroundConfig = {
  length: clampOtpLength(6),
  previewMode: 'default',
  controlMode: 'controlled',
  allowedCharsMode: 'numeric',
  customPattern: '[0-9]',
  autoFocus: false,
  enableAutofill: true,
  enableWebOtp: false,
  disabled: false,
  readOnly: false,
  loading: false,
  errorEnabled: false,
  errorMessage: 'Invalid verification code',
  maskEnabled: false,
  maskChar: '•',
  groupsPreset: 'none',
  customGroups: '3,3',
  separatorEnabled: true,
  separatorChar: '–',
  dir: 'ltr',
  groupLabel: 'One-time passcode',
  customSlotLabels: false,
  announceComplete: false,
  completeAnnouncement: 'Verification code complete',
  useDefaultStyles: true,
  inputName: 'otp',
  simulateVerify: true,
  demoCode: '123456',
  theme: DEFAULT_THEME,
  themePreset: 'Default',
};

export function resolveGroups(
  length: number,
  preset: GroupsPreset,
  custom: string,
): number[] | undefined {
  switch (preset) {
    case 'none':
      return undefined;
    case '3-3':
      return length === 6 ? [3, 3] : undefined;
    case '2-2-2':
      return length === 6 ? [2, 2, 2] : undefined;
    case '3-4':
      return length === 7 ? [3, 4] : undefined;
    case '4-4':
      return length === 8 ? [4, 4] : undefined;
    case 'custom': {
      const parts = custom
        .split(',')
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !Number.isNaN(n) && n > 0);
      if (parts.reduce((a, b) => a + b, 0) === length) return parts;
      return undefined;
    }
    default:
      return undefined;
  }
}

export function resolveAllowedChars(
  mode: AllowedCharsMode,
  customPattern: string,
): AllowedChars {
  if (mode === 'alphanumeric') return 'alphanumeric';
  if (mode === 'custom') {
    try {
      return new RegExp(customPattern);
    } catch {
      return 'numeric';
    }
  }
  return 'numeric';
}

export function themeToCssVars(theme: ThemeVars): Record<string, string> {
  return {
    '--otp-gap': theme.gap,
    '--otp-group-gap': theme.groupGap,
    '--otp-slot-size': theme.slotSize,
    '--otp-font-size': theme.fontSize,
    '--otp-border-radius': theme.borderRadius,
    '--otp-border-color': theme.borderColor,
    '--otp-border-color-focus': theme.borderColorFocus,
    '--otp-background': theme.background,
    '--otp-text-color': theme.textColor,
    '--otp-error-color': theme.errorColor,
  };
}
