import { useRef, useState } from 'react';
import { OtpInput } from 'otp-pro-input';
import type { OtpInputHandle } from 'otp-pro-input';
import '../src/styles.css';

type Tab = 'default' | 'custom' | 'headless';

export function App() {
  const [tab, setTab] = useState<Tab>('default');
  const [length, setLength] = useState(6);
  const [mask, setMask] = useState(false);
  const [error, setError] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState('');
  const [status, setStatus] = useState('Enter a verification code');
  const ref = useRef<OtpInputHandle>(null);

  const handleComplete = (value: string) => {
    setStatus(`Complete: ${value}`);
    setLoading(true);
    window.setTimeout(() => {
      setLoading(false);
      setError(value !== '123456');
      if (value !== '123456') {
        setStatus('Invalid code — try 123456');
      } else {
        setStatus('Verified successfully!');
      }
    }, 800);
  };

  return (
    <div className="playground">
      <header className="playground__header">
        <h1>otp-pro-input</h1>
        <p>Live playground — edits in <code>src/</code> hot-reload here</p>
      </header>

      <nav className="playground__tabs">
        {(['default', 'custom', 'headless'] as const).map((t) => (
          <button
            key={t}
            type="button"
            className={tab === t ? 'active' : ''}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </nav>

      <section className="playground__controls">
        <label>
          Length
          <input
            type="number"
            min={4}
            max={8}
            value={length}
            onChange={(e) => setLength(Number(e.target.value))}
          />
        </label>
        <label>
          <input type="checkbox" checked={mask} onChange={(e) => setMask(e.target.checked)} />
          Mask
        </label>
        <label>
          <input type="checkbox" checked={error} onChange={(e) => setError(e.target.checked)} />
          Error
        </label>
        <label>
          <input
            type="checkbox"
            checked={disabled}
            onChange={(e) => setDisabled(e.target.checked)}
          />
          Disabled
        </label>
        <label>
          <input type="checkbox" checked={loading} onChange={(e) => setLoading(e.target.checked)} />
          Loading
        </label>
        <button type="button" onClick={() => ref.current?.clear()}>
          Clear
        </button>
        <button type="button" onClick={() => ref.current?.setValue('123456'.slice(0, length))}>
          Fill demo
        </button>
      </section>

      <section className="playground__preview">
        {tab === 'default' && (
          <OtpInput
            ref={ref}
            length={length}
            groups={length === 6 ? [3, 3] : undefined}
            renderSeparator={() => '–'}
            mask={mask}
            error={error}
            disabled={disabled}
            loading={loading}
            value={code}
            onChange={setCode}
            onComplete={handleComplete}
            announceComplete
          />
        )}

        {tab === 'custom' && (
          <OtpInput
            length={length}
            useDefaultStyles={false}
            mask={mask}
            error={error}
            disabled={disabled}
            groups={length === 6 ? [3, 3] : undefined}
            renderSeparator={() => <span className="playground__sep">•</span>}
            renderInput={(props) => {
              const { inputRef, displayValue, index, ...inputProps } = props;
              return (
                <input
                  {...inputProps}
                  ref={inputRef}
                  value={displayValue}
                  className={`playground__custom-slot${props['aria-invalid'] ? ' playground__custom-slot--error' : ''}`}
                  data-index={index}
                />
              );
            }}
            onComplete={handleComplete}
          />
        )}

        {tab === 'headless' && (
          <div className="playground__headless">
            <p className="playground__hint">
              Styled via playground CSS only — component uses <code>useDefaultStyles={'{false}'}</code>
            </p>
            <OtpInput
              length={4}
              useDefaultStyles={false}
              mask={mask}
              renderInput={(props) => {
                const { inputRef, displayValue, ...inputProps } = props;
                return (
                  <input
                    {...inputProps}
                    ref={inputRef}
                    value={displayValue}
                    className="playground__headless-slot"
                  />
                );
              }}
              onComplete={handleComplete}
            />
          </div>
        )}
      </section>

      <footer className="playground__status">
        <p>{status}</p>
        <p>
          Value: <code>{code || '(empty)'}</code>
        </p>
        <p className="playground__hint">Demo code: <strong>123456</strong> (truncated to length)</p>
      </footer>
    </div>
  );
}
