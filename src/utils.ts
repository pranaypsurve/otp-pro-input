/** Preset character sets for OTP input validation. */
export type AllowedCharsPreset = 'numeric' | 'alphanumeric';

export type AllowedChars = AllowedCharsPreset | RegExp;

const PRESET_PATTERNS: Record<AllowedCharsPreset, RegExp> = {
  numeric: /[0-9]/,
  alphanumeric: /[a-zA-Z0-9]/,
};

/**
 * Resolve allowed character configuration to a single-character test regex.
 */
export function resolveCharPattern(allowedChars: AllowedChars = 'numeric'): RegExp {
  if (allowedChars instanceof RegExp) {
    return allowedChars;
  }
  return PRESET_PATTERNS[allowedChars];
}

/**
 * Sanitize a string to only include characters matching the allowed pattern.
 */
export function sanitizeValue(value: string, pattern: RegExp): string {
  return [...value].filter((char) => pattern.test(char)).join('');
}

/**
 * Split a value into fixed-length slots, padding with empty strings.
 */
export function valueToSlots(value: string, length: number): string[] {
  const chars = [...value].slice(0, length);
  return Array.from({ length }, (_, i) => chars[i] ?? '');
}

/**
 * Join slot values into a single string.
 */
export function slotsToValue(slots: string[]): string {
  return slots.join('');
}

/**
 * Check whether all slots are filled.
 */
export function isComplete(slots: string[]): boolean {
  return slots.length > 0 && slots.every((slot) => slot.length > 0);
}

/**
 * Default aria-label for a slot.
 */
export function defaultSlotLabel(index: number, length: number): string {
  return `Digit ${index + 1} of ${length}`;
}

/**
 * Input mode and pattern attributes for mobile keyboards.
 */
export function getInputAttributes(
  allowedChars: AllowedChars = 'numeric',
): { inputMode: React.HTMLAttributes<HTMLInputElement>['inputMode']; pattern?: string } {
  if (allowedChars === 'numeric') {
    return { inputMode: 'numeric', pattern: '[0-9]*' };
  }
  if (allowedChars === 'alphanumeric') {
    return { inputMode: 'text', pattern: '[a-zA-Z0-9]*' };
  }
  return { inputMode: 'text' };
}

// Minimal React type reference for inputMode without importing React in utils
declare namespace React {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface HTMLAttributes<T> {
    inputMode?: 'none' | 'text' | 'tel' | 'url' | 'email' | 'numeric' | 'decimal' | 'search';
  }
}
