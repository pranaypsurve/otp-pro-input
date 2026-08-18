import {
  forwardRef,
  Fragment,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from 'react';
import {
  useOtpInput,
  useOtpInputHandle,
  type OtpInputHandle,
  type OtpSlotProps,
  type UseOtpInputOptions,
} from './useOtpInput';
import { subscribeWebOtp } from './webOtp';
import type { AllowedChars } from './utils';

export interface OtpInputProps extends Omit<UseOtpInputOptions, 'length'> {
  /** Number of OTP slots. */
  length: number;
  /** Custom render function for each slot input. */
  renderInput?: (props: OtpSlotProps & { displayValue: string }) => ReactElement;
  /** Render separator between slot groups. */
  renderSeparator?: (index: number) => ReactNode;
  /** Visual grouping of slots, e.g. [3, 3] for a 6-digit code split 3-3. */
  groups?: number[];
  /** Mask displayed characters (PIN privacy). */
  mask?: boolean | string;
  /** Accessible name for the OTP group. */
  groupLabel?: string;
  /** Custom aria-label per slot. */
  getSlotLabel?: (index: number, length: number) => string;
  /** Text direction. */
  dir?: 'ltr' | 'rtl';
  /** Additional class name for the root container. */
  className?: string;
  /** Inline styles for the root container. */
  style?: CSSProperties;
  /** Use default styled theme (adds BEM-like class names). Default: true when renderInput is not provided. */
  useDefaultStyles?: boolean;
  /** Enable WebOTP API for Android SMS autofill. */
  enableWebOtp?: boolean;
  /** Loading / verifying state — disables input. */
  loading?: boolean;
  /** Custom loading indicator render prop. */
  renderLoading?: () => ReactNode;
  /** Announce completion via aria-live region. */
  announceComplete?: boolean | string;
  /** Accessible completion announcement text. */
  completeAnnouncement?: string;
  /** ID for the group element. */
  id?: string;
}

function computeGroups(length: number, groups?: number[]): number[] {
  if (!groups || groups.length === 0) {
    return [length];
  }
  const total = groups.reduce((sum, g) => sum + g, 0);
  if (total !== length) {
    return [length];
  }
  return groups;
}

function maskValue(value: string, mask: boolean | string | undefined): string {
  if (!mask || !value) return value;
  const char = typeof mask === 'string' ? mask : '•';
  return char;
}

const DefaultInput = function DefaultInput(
  props: OtpSlotProps & { displayValue: string; className?: string },
) {
  const { displayValue, inputRef, index, ...rest } = props;

  return (
    <input
      {...rest}
      ref={inputRef}
      className={props.className ?? 'otp-input__slot'}
      value={displayValue}
      data-filled={displayValue ? 'true' : 'false'}
      data-index={index}
    />
  );
};

/**
 * Pre-built OTP input component — thin wrapper around {@link useOtpInput}.
 * Works out of the box with default styling, or fully customizable via `renderInput`.
 *
 * @example
 * ```tsx
 * // Zero config
 * <OtpInput length={6} onComplete={(code) => verify(code)} />
 *
 * // Fully custom
 * <OtpInput
 *   length={6}
 *   renderInput={(props) => <input {...props} className="my-slot" />}
 * />
 * ```
 */
export const OtpInput = forwardRef<OtpInputHandle, OtpInputProps>(function OtpInput(
  props,
  ref,
) {
  const {
    length,
    renderInput,
    renderSeparator,
    groups,
    mask,
    groupLabel = 'One-time passcode',
    dir = 'ltr',
    className,
    style,
    useDefaultStyles,
    enableWebOtp = false,
    loading = false,
    renderLoading,
    announceComplete = false,
    completeAnnouncement = 'Verification code complete',
    id: idProp,
    disabled: disabledProp,
    error,
    allowedChars,
    ...hookOptions
  } = props;

  const generatedId = useId();
  const rootId = idProp ?? generatedId;
  const liveRegionId = `${rootId}-live`;

  const disabled = disabledProp || loading;
  const shouldUseDefaultStyles = useDefaultStyles ?? !renderInput;

  const hookReturn = useOtpInput({
    ...hookOptions,
    length,
    disabled,
    error,
    allowedChars,
  });

  useOtpInputHandle(ref, hookReturn, length);

  const { fillFromString, getValue, slots } = hookReturn;

  const hiddenAutofillRef = useRef<HTMLInputElement>(null);
  const [announcement, setAnnouncement] = useState('');

  const groupSizes = useMemo(() => computeGroups(length, groups), [groups, length]);

  // WebOTP listener
  useEffect(() => {
    if (!enableWebOtp || disabled) return;
    return subscribeWebOtp(true, (code) => {
      fillFromString(code, 0);
    });
  }, [enableWebOtp, disabled, fillFromString]);

  // Completion announcement
  useEffect(() => {
    if (!announceComplete) return;
    const value = getValue();
    if (value.length === length && value.split('').every(Boolean)) {
      const text =
        typeof announceComplete === 'string' ? announceComplete : completeAnnouncement;
      setAnnouncement(text);
    } else {
      setAnnouncement('');
    }
  }, [announceComplete, completeAnnouncement, getValue, length, slots]);

  // Hidden autofill input for iOS (captures full SMS code)
  const handleHiddenAutofill = (value: string) => {
    fillFromString(value, 0);
    hiddenAutofillRef.current?.blur();
  };

  const renderSlot = (slotProps: OtpSlotProps) => {
    const displayValue = maskValue(slotProps.value, mask);

    if (renderInput) {
      return (
        <Fragment key={slotProps.index}>
          {renderInput({ ...slotProps, displayValue })}
        </Fragment>
      );
    }

    return (
      <DefaultInput
        key={slotProps.index}
        {...slotProps}
        displayValue={displayValue}
        className={shouldUseDefaultStyles ? 'otp-input__slot' : undefined}
      />
    );
  };

  let slotIndex = 0;
  const groupElements: ReactNode[] = [];

  groupSizes.forEach((groupSize, groupIndex) => {
    const groupSlots: ReactNode[] = [];

    for (let i = 0; i < groupSize; i++) {
      const props = slots[slotIndex];
      if (props) {
        groupSlots.push(renderSlot(props));
      }
      slotIndex += 1;
    }

    groupElements.push(
      <div
        key={`group-${groupIndex}`}
        className={shouldUseDefaultStyles ? 'otp-input__group' : undefined}
        role="presentation"
      >
        {groupSlots}
      </div>,
    );

    if (renderSeparator && groupIndex < groupSizes.length - 1) {
      groupElements.push(
        <span key={`sep-${groupIndex}`} className="otp-input__separator" aria-hidden="true">
          {renderSeparator(groupIndex)}
        </span>,
      );
    }
  });

  const rootClassName = [
    shouldUseDefaultStyles ? 'otp-input' : undefined,
    className,
    disabled ? 'otp-input--disabled' : undefined,
    error ? 'otp-input--error' : undefined,
    loading ? 'otp-input--loading' : undefined,
  ]
    .filter(Boolean)
    .join(' ');

  const groupAriaLabel = `${groupLabel}, ${length} ${allowedChars === 'alphanumeric' ? 'characters' : 'digits'}`;

  return (
    <div className={rootClassName} style={style} dir={dir}>
      {/* Visually hidden input for iOS SMS autofill */}
      <input
        ref={hiddenAutofillRef}
        type="text"
        inputMode={allowedChars === 'alphanumeric' ? 'text' : 'numeric'}
        autoComplete="one-time-code"
        aria-hidden="true"
        tabIndex={-1}
        className="otp-input__autofill-capture"
        onChange={(e) => handleHiddenAutofill(e.target.value)}
        disabled={disabled}
      />

      <div
        id={rootId}
        role="group"
        aria-label={groupAriaLabel}
        aria-invalid={error ? true : undefined}
        aria-busy={loading || undefined}
        className={shouldUseDefaultStyles ? 'otp-input__fields' : undefined}
        data-error={error ? true : undefined}
      >
        {groupElements}
      </div>

      {loading && renderLoading?.()}

      {announceComplete && (
        <div
          id={liveRegionId}
          aria-live="polite"
          aria-atomic="true"
          className="otp-input__live-region"
        >
          {announcement}
        </div>
      )}
    </div>
  );
});

export type { OtpInputHandle, OtpSlotProps, AllowedChars };
