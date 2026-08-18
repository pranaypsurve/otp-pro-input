import { useCallback, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { OtpInput } from 'otp-pro-input';
import type { OtpInputHandle } from 'otp-pro-input';
import '../src/styles.css';
import { CodePreview } from './CodePreview';
import { toHexColor } from './colorUtils';
import {
  DEFAULT_CONFIG,
  resolveAllowedChars,
  resolveGroups,
  THEME_PRESETS,
  themeToCssVars,
  type PlaygroundConfig,
  type PreviewMode,
} from './config';
import { clampOtpLength, OTP_MAX_LENGTH, OTP_MIN_LENGTH } from '../src/utils';

type VerifyState = 'idle' | 'verifying' | 'success' | 'error';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="pg-section">
      <h3 className="pg-section__title">{title}</h3>
      <div className="pg-section__body">{children}</div>
    </section>
  );
}

function Row({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="pg-row">
      <span className="pg-row__label">
        {label}
        {hint && <span className="pg-row__hint">{hint}</span>}
      </span>
      <span className="pg-row__control">{children}</span>
    </label>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`pg-toggle${checked ? ' pg-toggle--on' : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span className="pg-toggle__thumb" />
    </button>
  );
}

export function App() {
  const [config, setConfig] = useState<PlaygroundConfig>(DEFAULT_CONFIG);
  const [code, setCode] = useState('');
  const [verifyState, setVerifyState] = useState<VerifyState>('idle');
  const [eventLog, setEventLog] = useState<string[]>([]);
  const [showCode, setShowCode] = useState(false);
  const ref = useRef<OtpInputHandle>(null);

  const patch = useCallback((partial: Partial<PlaygroundConfig>) => {
    setConfig((c) => ({ ...c, ...partial }));
  }, []);

  const log = useCallback((msg: string) => {
    const time = new Date().toLocaleTimeString();
    setEventLog((prev) => [`[${time}] ${msg}`, ...prev].slice(0, 8));
  }, []);

  const handleChange = useCallback(
    (value: string) => {
      setCode(value);
      log(`onChange → "${value}"`);
      if (verifyState !== 'idle') setVerifyState('idle');
    },
    [log, verifyState],
  );

  const handleComplete = useCallback(
    (value: string) => {
      log(`onComplete → "${value}"`);
      if (!config.simulateVerify) {
        setVerifyState('success');
        return;
      }
      setVerifyState('verifying');
      patch({ loading: true });
      window.setTimeout(() => {
        const ok = value === config.demoCode.slice(0, config.length);
        patch({ loading: false, errorEnabled: !ok });
        setVerifyState(ok ? 'success' : 'error');
        log(ok ? 'Verification passed' : `Verification failed (expected ${config.demoCode})`);
      }, 900);
    },
    [config.demoCode, config.length, config.simulateVerify, log, patch],
  );

  const groups = useMemo(
    () => resolveGroups(config.length, config.groupsPreset, config.customGroups),
    [config.customGroups, config.groupsPreset, config.length],
  );

  const allowedChars = useMemo(
    () => resolveAllowedChars(config.allowedCharsMode, config.customPattern),
    [config.allowedCharsMode, config.customPattern],
  );

  const themeStyle = useMemo(
    () => themeToCssVars(config.theme) as CSSProperties,
    [config.theme],
  );

  const resetAll = () => {
    setConfig(DEFAULT_CONFIG);
    setCode('');
    setVerifyState('idle');
    setEventLog([]);
    ref.current?.clear();
  };

  const otpProps = {
    ref,
    length: config.length,
    allowedChars,
    autoFocus: config.autoFocus,
    disabled: config.disabled,
    readOnly: config.readOnly,
    loading: config.loading,
    error: config.errorEnabled ? config.errorMessage || true : undefined,
    mask: config.maskEnabled ? config.maskChar || true : undefined,
    groups,
    groupLabel: config.groupLabel,
    dir: config.dir,
    enableWebOtp: config.enableWebOtp,
    enableAutofill: config.enableAutofill,
    announceComplete: config.announceComplete || undefined,
    completeAnnouncement: config.completeAnnouncement,
    name: config.inputName || undefined,
    getSlotLabel: config.customSlotLabels
      ? (index: number, len: number) => `Character ${index + 1} of ${len}`
      : undefined,
    onChange: handleChange,
    onComplete: handleComplete,
    ...(config.controlMode === 'controlled' ? { value: code } : {}),
    renderSeparator: config.separatorEnabled
      ? () => config.separatorChar
      : undefined,
    renderLoading: config.loading
      ? () => <span className="pg-verifying">Verifying…</span>
      : undefined,
  };

  const renderOtp = () => {
    if (config.previewMode === 'custom') {
      return (
        <OtpInput
          {...otpProps}
          useDefaultStyles={false}
          className="pg-custom-otp"
          style={themeStyle}
          renderInput={(props) => {
            const { inputRef, displayValue, index, ...inputProps } = props;
            return (
              <input
                {...inputProps}
                ref={inputRef}
                value={displayValue}
                className={`pg-custom-slot${props['aria-invalid'] ? ' pg-custom-slot--error' : ''}${props.disabled ? ' pg-custom-slot--disabled' : ''}`}
                style={{
                  borderRadius: config.theme.borderRadius,
                  fontSize: config.theme.fontSize,
                  color: config.theme.textColor,
                  background: config.theme.background,
                  borderColor: props['aria-invalid']
                    ? config.theme.errorColor
                    : displayValue
                      ? config.theme.borderColorFocus
                      : config.theme.borderColor,
                }}
                data-index={index}
              />
            );
          }}
        />
      );
    }

    if (config.previewMode === 'headless') {
      return (
        <OtpInput
          {...otpProps}
          useDefaultStyles={false}
          renderInput={(props) => {
            const { inputRef, displayValue, ...inputProps } = props;
            return (
              <input
                {...inputProps}
                ref={inputRef}
                value={displayValue}
                className="pg-headless-slot"
                style={{ color: config.theme.textColor }}
              />
            );
          }}
        />
      );
    }

    return (
      <OtpInput
        {...otpProps}
        useDefaultStyles={config.useDefaultStyles}
        className="pg-themed-otp"
        style={themeStyle}
      />
    );
  };

  return (
    <div className="pg-app">
      <aside className="pg-sidebar">
        <header className="pg-sidebar__header">
          <div className="pg-logo">otp-pro-input</div>
          <p className="pg-sidebar__tagline">Interactive playground</p>
        </header>

        <div className="pg-sidebar__scroll">
          <Section title="Preview mode">
            <div className="pg-segment">
              {(['default', 'custom', 'headless'] as PreviewMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  className={config.previewMode === mode ? 'active' : ''}
                  onClick={() => patch({ previewMode: mode })}
                >
                  {mode}
                </button>
              ))}
            </div>
          </Section>

          <Section title="Core">
            <Row label="Length" hint={`${OTP_MIN_LENGTH}–${OTP_MAX_LENGTH}`}>
              <input
                type="range"
                min={OTP_MIN_LENGTH}
                max={OTP_MAX_LENGTH}
                value={config.length}
                onChange={(e) => {
                  const length = clampOtpLength(Number(e.target.value));
                  patch({ length });
                  setCode((c) => c.slice(0, length));
                }}
              />
              <span className="pg-badge">{config.length}</span>
            </Row>
            <Row label="Control mode">
              <select
                value={config.controlMode}
                onChange={(e) => {
                  patch({ controlMode: e.target.value as PlaygroundConfig['controlMode'] });
                  if (e.target.value === 'uncontrolled') setCode('');
                }}
              >
                <option value="controlled">Controlled</option>
                <option value="uncontrolled">Uncontrolled</option>
              </select>
            </Row>
            <Row label="Allowed chars">
              <select
                value={config.allowedCharsMode}
                onChange={(e) =>
                  patch({ allowedCharsMode: e.target.value as PlaygroundConfig['allowedCharsMode'] })
                }
              >
                <option value="numeric">Numeric (0–9)</option>
                <option value="alphanumeric">Alphanumeric</option>
                <option value="custom">Custom regex</option>
              </select>
            </Row>
            {config.allowedCharsMode === 'custom' && (
              <Row label="Pattern">
                <input
                  type="text"
                  value={config.customPattern}
                  placeholder="[0-9]"
                  onChange={(e) => patch({ customPattern: e.target.value })}
                />
              </Row>
            )}
          </Section>

          <Section title="State & validation">
            <div className="pg-toggles">
              <div className="pg-toggle-row">
                <span>disabled</span>
                <Toggle checked={config.disabled} label="disabled" onChange={(v) => patch({ disabled: v })} />
              </div>
              <div className="pg-toggle-row">
                <span>readOnly</span>
                <Toggle checked={config.readOnly} label="readOnly" onChange={(v) => patch({ readOnly: v })} />
              </div>
              <div className="pg-toggle-row">
                <span>loading</span>
                <Toggle checked={config.loading} label="loading" onChange={(v) => patch({ loading: v })} />
              </div>
              <div className="pg-toggle-row">
                <span>error</span>
                <Toggle checked={config.errorEnabled} label="error" onChange={(v) => patch({ errorEnabled: v })} />
              </div>
              <div className="pg-toggle-row">
                <span>mask</span>
                <Toggle checked={config.maskEnabled} label="mask" onChange={(v) => patch({ maskEnabled: v })} />
              </div>
              <div className="pg-toggle-row">
                <span>autoFocus</span>
                <Toggle checked={config.autoFocus} label="autoFocus" onChange={(v) => patch({ autoFocus: v })} />
              </div>
            </div>
            {config.maskEnabled && (
              <Row label="Mask char">
                <input
                  type="text"
                  maxLength={1}
                  value={config.maskChar}
                  onChange={(e) => patch({ maskChar: e.target.value || '•' })}
                />
              </Row>
            )}
            {config.errorEnabled && (
              <Row label="Error message">
                <input
                  type="text"
                  value={config.errorMessage}
                  onChange={(e) => patch({ errorMessage: e.target.value })}
                />
              </Row>
            )}
            <Row label="Simulate verify">
              <Toggle
                checked={config.simulateVerify}
                label="Simulate verify"
                onChange={(v) => patch({ simulateVerify: v })}
              />
            </Row>
            {config.simulateVerify && (
              <Row label="Demo code">
                <input
                  type="text"
                  value={config.demoCode}
                  onChange={(e) => patch({ demoCode: e.target.value })}
                />
              </Row>
            )}
          </Section>

          <Section title="Layout">
            <Row label="Groups">
              <select
                value={config.groupsPreset}
                onChange={(e) =>
                  patch({ groupsPreset: e.target.value as PlaygroundConfig['groupsPreset'] })
                }
              >
                <option value="none">None</option>
                <option value="3-3">3 + 3 (6)</option>
                <option value="2-2-2">2 + 2 + 2 (6)</option>
                <option value="3-4">3 + 4 (7)</option>
                <option value="4-4">4 + 4 (8)</option>
                <option value="custom">Custom</option>
              </select>
            </Row>
            {config.groupsPreset === 'custom' && (
              <Row label="Custom groups" hint="e.g. 3,3">
                <input
                  type="text"
                  value={config.customGroups}
                  onChange={(e) => patch({ customGroups: e.target.value })}
                />
              </Row>
            )}
            <Row label="Separator">
              <Toggle
                checked={config.separatorEnabled}
                label="Separator"
                onChange={(v) => patch({ separatorEnabled: v })}
              />
            </Row>
            {config.separatorEnabled && (
              <Row label="Separator char">
                <input
                  type="text"
                  maxLength={3}
                  value={config.separatorChar}
                  onChange={(e) => patch({ separatorChar: e.target.value || '–' })}
                />
              </Row>
            )}
            <Row label="Direction">
              <select
                value={config.dir}
                onChange={(e) => patch({ dir: e.target.value as 'ltr' | 'rtl' })}
              >
                <option value="ltr">LTR</option>
                <option value="rtl">RTL</option>
              </select>
            </Row>
          </Section>

          <Section title="Accessibility & autofill">
            <Row label="Group label">
              <input
                type="text"
                value={config.groupLabel}
                onChange={(e) => patch({ groupLabel: e.target.value })}
              />
            </Row>
            <div className="pg-toggles">
              <div className="pg-toggle-row">
                <span>Custom slot labels</span>
                <Toggle
                  checked={config.customSlotLabels}
                  label="Custom slot labels"
                  onChange={(v) => patch({ customSlotLabels: v })}
                />
              </div>
              <div className="pg-toggle-row">
                <span>iOS autofill</span>
                <Toggle
                  checked={config.enableAutofill}
                  label="iOS autofill"
                  onChange={(v) => patch({ enableAutofill: v })}
                />
              </div>
              <div className="pg-toggle-row">
                <span>WebOTP (Android)</span>
                <Toggle
                  checked={config.enableWebOtp}
                  label="WebOTP"
                  onChange={(v) => patch({ enableWebOtp: v })}
                />
              </div>
              <div className="pg-toggle-row">
                <span>Announce complete</span>
                <Toggle
                  checked={config.announceComplete}
                  label="Announce complete"
                  onChange={(v) => patch({ announceComplete: v })}
                />
              </div>
            </div>
            {config.announceComplete && (
              <Row label="Announcement">
                <input
                  type="text"
                  value={config.completeAnnouncement}
                  onChange={(e) => patch({ completeAnnouncement: e.target.value })}
                />
              </Row>
            )}
            <Row label="Input name">
              <input
                type="text"
                value={config.inputName}
                onChange={(e) => patch({ inputName: e.target.value })}
              />
            </Row>
          </Section>

          <Section title="Theme">
            <Row label="Preset">
              <select
                value={config.themePreset}
                onChange={(e) => {
                  const preset = e.target.value;
                  patch({
                    themePreset: preset,
                    theme: THEME_PRESETS[preset] ?? config.theme,
                  });
                }}
              >
                {Object.keys(THEME_PRESETS).map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </Row>
            {(
              [
                ['borderColor', 'Border'],
                ['borderColorFocus', 'Focus border'],
                ['background', 'Background'],
                ['textColor', 'Text'],
                ['errorColor', 'Error'],
              ] as const
            ).map(([key, label]) => (
              <Row key={key} label={label}>
                <input
                  type="color"
                  value={toHexColor(config.theme[key], '#6366f1')}
                  onChange={(e) =>
                    patch({
                      themePreset: 'Custom',
                      theme: { ...config.theme, [key]: e.target.value },
                    })
                  }
                />
              </Row>
            ))}
            <Row label="Border radius">
              <input
                type="range"
                min={0}
                max={24}
                value={parseInt(config.theme.borderRadius, 10) * 16 || 8}
                onChange={(e) =>
                  patch({
                    themePreset: 'Custom',
                    theme: { ...config.theme, borderRadius: `${Number(e.target.value) / 16}rem` },
                  })
                }
              />
            </Row>
            <Row label="Slot size">
              <input
                type="range"
                min={32}
                max={56}
                value={parseFloat(config.theme.slotSize) * 16 || 44}
                onChange={(e) =>
                  patch({
                    themePreset: 'Custom',
                    theme: { ...config.theme, slotSize: `${Number(e.target.value) / 16}rem` },
                  })
                }
              />
            </Row>
            <Row label="Font size">
              <input
                type="range"
                min={14}
                max={28}
                value={parseFloat(config.theme.fontSize) * 16 || 20}
                onChange={(e) =>
                  patch({
                    themePreset: 'Custom',
                    theme: { ...config.theme, fontSize: `${Number(e.target.value) / 16}rem` },
                  })
                }
              />
            </Row>
            <Row label="Gap">
              <input
                type="range"
                min={2}
                max={16}
                value={parseFloat(config.theme.gap) * 16 || 8}
                onChange={(e) =>
                  patch({
                    themePreset: 'Custom',
                    theme: { ...config.theme, gap: `${Number(e.target.value) / 16}rem` },
                  })
                }
              />
            </Row>
          </Section>

          <Section title="Actions">
            <div className="pg-actions">
              <button type="button" onClick={() => ref.current?.clear()}>
                Clear
              </button>
              <button
                type="button"
                onClick={() =>
                  ref.current?.setValue(config.demoCode.slice(0, config.length))
                }
              >
                Fill demo
              </button>
              <button type="button" onClick={() => ref.current?.focus(0)}>
                Focus first
              </button>
              <button type="button" className="pg-actions--ghost" onClick={resetAll}>
                Reset all
              </button>
            </div>
          </Section>
        </div>
      </aside>

      <main className="pg-main">
        <div className="pg-preview-wrap">
          <div className={`pg-device${verifyState === 'success' ? ' pg-device--success' : ''}${verifyState === 'error' ? ' pg-device--error' : ''}`}>
            <div className="pg-device__bar">
              <span>9:41</span>
              <span className="pg-device__icons">●●●</span>
            </div>
            <div className="pg-device__body">
              <div className="pg-device__icon">🔐</div>
              <h2 className="pg-device__title">Verify your identity</h2>
              <p className="pg-device__subtitle">
                Enter the {config.length}-digit code sent to your device
              </p>

              <div className="pg-device__otp">{renderOtp()}</div>

              {verifyState === 'success' && (
                <p className="pg-device__feedback pg-device__feedback--success">
                  ✓ Verified successfully
                </p>
              )}
              {verifyState === 'error' && (
                <p className="pg-device__feedback pg-device__feedback--error">
                  Invalid code. Try {config.demoCode.slice(0, config.length)}.
                </p>
              )}
              {verifyState === 'verifying' && (
                <p className="pg-device__feedback">Verifying code…</p>
              )}

              <button type="button" className="pg-device__link" disabled={config.disabled}>
                Resend code
              </button>
            </div>
          </div>
        </div>

        <div className="pg-panel">
          <div className="pg-panel__header">
            <h3>Live output</h3>
            <button
              type="button"
              className="pg-panel__tab"
              onClick={() => setShowCode((s) => !s)}
            >
              {showCode ? 'Events' : 'Code'}
            </button>
          </div>

          {!showCode ? (
            <div className="pg-events">
              <div className="pg-events__row">
                <span className="pg-events__key">value</span>
                <code>{code || '(empty)'}</code>
              </div>
              <div className="pg-events__row">
                <span className="pg-events__key">state</span>
                <code>{verifyState}</code>
              </div>
              <div className="pg-events__row">
                <span className="pg-events__key">groups</span>
                <code>{groups ? `[${groups.join(', ')}]` : 'none'}</code>
              </div>
              <ul className="pg-events__log">
                {eventLog.length === 0 && (
                  <li className="pg-events__empty">Interact with the OTP input…</li>
                )}
                {eventLog.map((entry) => (
                  <li key={entry}>{entry}</li>
                ))}
              </ul>
            </div>
          ) : (
            <CodePreview config={config} />
          )}
        </div>
      </main>
    </div>
  );
}
