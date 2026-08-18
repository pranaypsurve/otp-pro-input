import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type FocusEvent,
  type KeyboardEvent,
  type Ref,
} from 'react';
import {
  clampOtpLength,
  defaultSlotLabel,
  getInputAttributes,
  isComplete,
  resolveCharPattern,
  sanitizeValue,
  slotsToValue,
  valueToSlots,
  type AllowedChars,
} from './utils';

export { OTP_MIN_LENGTH, OTP_MAX_LENGTH, clampOtpLength } from './utils';

export interface OtpSlotProps {
  /** Current character in this slot (empty string if unfilled). */
  value: string;
  /** Ref callback for the underlying input element. */
  inputRef: (el: HTMLInputElement | null) => void;
  /** Index of this slot (0-based). */
  index: number;
  /** Change handler — accepts single character or autofill multi-char. */
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onPaste: (event: ClipboardEvent<HTMLInputElement>) => void;
  onFocus: (event: FocusEvent<HTMLInputElement>) => void;
  /** Mobile keyboard hint. */
  inputMode: 'none' | 'text' | 'tel' | 'url' | 'email' | 'numeric' | 'decimal' | 'search';
  /** Validation pattern for mobile numeric keyboard. */
  pattern?: string;
  /** Accessible label for this slot. */
  'aria-label': string;
  /** Whether this slot has a validation error. */
  'aria-invalid'?: boolean | 'grammar' | 'spelling';
  /** Disabled state. */
  disabled?: boolean;
  /** Read-only state. */
  readOnly?: boolean;
  /** Autocomplete hint — first slot uses one-time-code for iOS SMS autofill. */
  autoComplete?: string;
  /** Max length for the input (allows autofill overflow on first slot). */
  maxLength?: number;
  /** Data attribute for styling error state. */
  'data-error'?: boolean;
  /** Data attribute indicating slot index. */
  'data-index': number;
  /** Type of input — text for compatibility with OTP autofill. */
  type: 'text';
  /** Input name for form integration. */
  name?: string;
}

export interface UseOtpInputOptions {
  /** Number of OTP slots (3–8). Values outside this range are clamped. */
  length: number;
  /** Controlled value — full OTP string. */
  value?: string;
  /** Uncontrolled initial value. */
  defaultValue?: string;
  /** Fired on every value change with the full OTP string. */
  onChange?: (value: string) => void;
  /** Fired once when all slots are filled. */
  onComplete?: (value: string) => void;
  /** Allowed characters per slot. Default: digits 0-9. */
  allowedChars?: AllowedChars;
  /** Focus the first empty slot on mount. */
  autoFocus?: boolean;
  /** Disable all slots. */
  disabled?: boolean;
  /** Make all slots read-only. */
  readOnly?: boolean;
  /** Custom aria-label generator per slot. */
  getSlotLabel?: (index: number, length: number) => string;
  /** Whether slots have a validation error (sets aria-invalid). */
  error?: boolean | string;
  /** Input name prefix for form fields (each slot gets `${name}-${index}`). */
  name?: string;
  /** Enable autocomplete="one-time-code" on first slot for iOS SMS autofill. Default: true. */
  enableAutofill?: boolean;
}

export interface UseOtpInputReturn {
  /** Props to spread onto each slot's `<input>`. */
  slots: OtpSlotProps[];
  /** Imperatively set the full OTP value. */
  setValue: (value: string) => void;
  /** Clear all slots. */
  clear: () => void;
  /** Focus a specific slot by index. */
  focus: (index: number) => void;
  /** Get the current full OTP value. */
  getValue: () => string;
  /** Index of the currently focused slot, or -1. */
  focusedIndex: number;
  /** Handle autofill / paste of a full code from external sources. */
  fillFromString: (raw: string, startIndex?: number) => void;
}

function clampIndex(index: number, length: number): number {
  return Math.max(0, Math.min(index, length - 1));
}

/**
 * Headless hook that manages all OTP input logic: keyboard navigation, paste,
 * validation, focus management, and accessibility props.
 *
 * @example
 * ```tsx
 * const { slots, clear, focus } = useOtpInput({
 *   length: 6,
 *   onComplete: (code) => verify(code),
 * });
 *
 * return (
 *   <div role="group" aria-label="Verification code">
 *     {slots.map((props) => (
 *       <input key={props.index} {...props} />
 *     ))}
 *   </div>
 * );
 * ```
 */
export function useOtpInput(options: UseOtpInputOptions): UseOtpInputReturn {
  const resolvedLength = clampOtpLength(options.length);

  const {
    length: _length,
    value: controlledValue,
    defaultValue = '',
    onChange,
    onComplete,
    allowedChars = 'numeric',
    autoFocus = false,
    disabled = false,
    readOnly = false,
    getSlotLabel = defaultSlotLabel,
    error = false,
    name,
    enableAutofill = true,
  } = options;

  const length = resolvedLength;

  const charPattern = useMemo(() => resolveCharPattern(allowedChars), [allowedChars]);
  const inputAttrs = useMemo(() => getInputAttributes(allowedChars), [allowedChars]);
  const isControlled = controlledValue !== undefined;

  const [internalValue, setInternalValue] = useState(() =>
    sanitizeValue(defaultValue, charPattern).slice(0, length),
  );
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const onCompleteRef = useRef(onComplete);
  const onChangeRef = useRef(onChange);
  const lastCompletedValue = useRef<string | null>(null);

  onCompleteRef.current = onComplete;
  onChangeRef.current = onChange;

  const currentValue = isControlled
    ? sanitizeValue(controlledValue, charPattern).slice(0, length)
    : internalValue;

  const slotsArray = useMemo(
    () => valueToSlots(currentValue, length),
    [currentValue, length],
  );

  const updateValue = useCallback(
    (newValue: string) => {
      const sanitized = sanitizeValue(newValue, charPattern).slice(0, length);

      if (!isControlled) {
        setInternalValue(sanitized);
      }

      onChangeRef.current?.(sanitized);

      if (isComplete(valueToSlots(sanitized, length)) && sanitized !== lastCompletedValue.current) {
        lastCompletedValue.current = sanitized;
        onCompleteRef.current?.(sanitized);
      } else if (!isComplete(valueToSlots(sanitized, length))) {
        lastCompletedValue.current = null;
      }

      return sanitized;
    },
    [charPattern, isControlled, length],
  );

  const focusSlot = useCallback(
    (index: number) => {
      const clamped = clampIndex(index, length);
      const el = inputRefs.current[clamped];
      if (el && !disabled && !readOnly) {
        el.focus();
        el.select();
      }
    },
    [disabled, length, readOnly],
  );

  const setValue = useCallback(
    (value: string) => {
      updateValue(value);
    },
    [updateValue],
  );

  const clear = useCallback(() => {
    updateValue('');
    focusSlot(0);
  }, [focusSlot, updateValue]);

  const getValue = useCallback(() => currentValue, [currentValue]);

  const fillFromString = useCallback(
    (raw: string, startIndex = 0) => {
      const sanitized = sanitizeValue(raw, charPattern);
      if (!sanitized) return;

      const newSlots = [...slotsArray];
      let writeIndex = clampIndex(startIndex, length);

      for (const char of sanitized) {
        if (writeIndex >= length) break;
        newSlots[writeIndex] = char;
        writeIndex += 1;
      }

      const newValue = slotsToValue(newSlots);
      updateValue(newValue);

      const lastFilledIndex = newSlots.reduce(
        (last, slot, i) => (slot ? i : last),
        -1,
      );

      if (lastFilledIndex >= 0 && lastFilledIndex < length - 1) {
        focusSlot(lastFilledIndex + 1);
      } else if (lastFilledIndex === length - 1) {
        inputRefs.current[lastFilledIndex]?.blur();
      }
    },
    [charPattern, focusSlot, length, slotsArray, updateValue],
  );

  const handleSlotInput = useCallback(
    (index: number, event: ChangeEvent<HTMLInputElement>) => {
      if (disabled || readOnly) return;

      const inputValue = event.target.value;
      const sanitized = sanitizeValue(inputValue, charPattern);

      if (!sanitized) {
        if (inputValue.length > 0) {
          // Invalid character — ignore silently
          return;
        }
        // User cleared the field
        const newSlots = [...slotsArray];
        newSlots[index] = '';
        updateValue(slotsToValue(newSlots));
        return;
      }

      // Autofill or multi-char paste into single input
      if (sanitized.length > 1) {
        fillFromString(sanitized, index);
        return;
      }

      const char = sanitized[sanitized.length - 1];
      const newSlots = [...slotsArray];
      newSlots[index] = char;
      updateValue(slotsToValue(newSlots));

      if (index < length - 1) {
        focusSlot(index + 1);
      }
    },
    [charPattern, disabled, fillFromString, focusSlot, length, readOnly, slotsArray, updateValue],
  );

  const handleKeyDown = useCallback(
    (index: number, event: KeyboardEvent<HTMLInputElement>) => {
      if (disabled || readOnly) return;

      const { key } = event;

      switch (key) {
        case 'Backspace': {
          event.preventDefault();
          const newSlots = [...slotsArray];

          if (slotsArray[index]) {
            newSlots[index] = '';
            updateValue(slotsToValue(newSlots));
          } else if (index > 0) {
            newSlots[index - 1] = '';
            updateValue(slotsToValue(newSlots));
            focusSlot(index - 1);
          }
          break;
        }
        case 'Delete': {
          event.preventDefault();
          if (slotsArray[index]) {
            const newSlots = [...slotsArray];
            newSlots[index] = '';
            updateValue(slotsToValue(newSlots));
          }
          break;
        }
        case 'ArrowLeft':
          event.preventDefault();
          focusSlot(index - 1);
          break;
        case 'ArrowRight':
          event.preventDefault();
          focusSlot(index + 1);
          break;
        case 'Home':
          event.preventDefault();
          focusSlot(0);
          break;
        case 'End':
          event.preventDefault();
          focusSlot(length - 1);
          break;
        default:
          break;
      }
    },
    [disabled, focusSlot, length, readOnly, slotsArray, updateValue],
  );

  const handlePaste = useCallback(
    (index: number, event: ClipboardEvent<HTMLInputElement>) => {
      if (disabled || readOnly) return;

      event.preventDefault();
      const pasted = event.clipboardData.getData('text/plain');
      fillFromString(pasted, index);
    },
    [disabled, fillFromString, readOnly],
  );

  const handleFocus = useCallback(
    (_index: number, event: FocusEvent<HTMLInputElement>) => {
      setFocusedIndex(_index);
      event.target.select();
    },
    [],
  );

  const setInputRef = useCallback(
    (index: number) => (el: HTMLInputElement | null) => {
      inputRefs.current[index] = el;
    },
    [],
  );

  // Auto-focus first empty slot on mount
  useEffect(() => {
    if (autoFocus && !disabled && !readOnly) {
      const firstEmpty = slotsArray.findIndex((s) => !s);
      focusSlot(firstEmpty === -1 ? 0 : firstEmpty);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync refs array length
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, length);
  }, [length]);

  const hasError = Boolean(error);

  const slots: OtpSlotProps[] = useMemo(
    () =>
      Array.from({ length }, (_, index) => ({
        value: slotsArray[index] ?? '',
        inputRef: setInputRef(index),
        index,
        onChange: (event: ChangeEvent<HTMLInputElement>) => handleSlotInput(index, event),
        onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => handleKeyDown(index, event),
        onPaste: (event: ClipboardEvent<HTMLInputElement>) => handlePaste(index, event),
        onFocus: (event: FocusEvent<HTMLInputElement>) => handleFocus(index, event),
        inputMode: inputAttrs.inputMode ?? 'text',
        pattern: inputAttrs.pattern,
        'aria-label': getSlotLabel(index, length),
        'aria-invalid': hasError || undefined,
        disabled,
        readOnly,
        autoComplete: enableAutofill && index === 0 ? 'one-time-code' : 'off',
        maxLength: index === 0 && enableAutofill ? length : 1,
        'data-error': hasError || undefined,
        'data-index': index,
        type: 'text' as const,
        name: name ? `${name}-${index}` : undefined,
      })),
    [
      disabled,
      enableAutofill,
      getSlotLabel,
      handleFocus,
      handleKeyDown,
      handlePaste,
      handleSlotInput,
      hasError,
      inputAttrs.inputMode,
      inputAttrs.pattern,
      length,
      name,
      readOnly,
      setInputRef,
      slotsArray,
    ],
  );

  return {
    slots,
    setValue,
    clear,
    focus: focusSlot,
    getValue,
    focusedIndex,
    fillFromString,
  };
}

/** Imperative handle exposed via ref on OtpInput. */
export interface OtpInputHandle {
  focus: (index?: number) => void;
  clear: () => void;
  getValue: () => string;
  setValue: (value: string) => void;
}

export function useOtpInputHandle(
  ref: Ref<OtpInputHandle> | undefined,
  hookReturn: UseOtpInputReturn,
  length: number,
): void {
  useImperativeHandle(
    ref,
    () => ({
      focus: (index = 0) => hookReturn.focus(clampIndex(index, length)),
      clear: hookReturn.clear,
      getValue: hookReturn.getValue,
      setValue: hookReturn.setValue,
    }),
    [hookReturn, length],
  );
}
