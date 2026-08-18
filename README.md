# otp-pro-input

[![npm version](https://img.shields.io/npm/v/otp-pro-input.svg)](https://www.npmjs.com/package/otp-pro-input)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Bundle size](https://img.shields.io/bundlephobia/minzip/otp-pro-input)](https://bundlephobia.com/package/otp-pro-input)

Headless, fully customizable **OTP / segmented code input** for React. Ship your own UI or use the optional default theme — paste, autofill, keyboard nav, and accessibility built in.

**[Live demo →](https://pranaypsurve.github.io/otp-pro-input/)**

---

## Table of contents

- [Features](#features)
- [Install](#install)
- [Quick start](#quick-start)
- [Usage](#usage)
  - [Default component](#default-component)
  - [Headless hook](#headless-hook)
  - [Custom slots (`renderInput`)](#custom-slots-renderinput)
  - [Imperative ref](#imperative-ref)
- [Props](#props)
- [Styling](#styling)
- [Accessibility](#accessibility)
- [Autofill](#autofill)
- [Browser support](#browser-support)
- [Links](#links)
- [Legal](#legal)
- [License](#license)

---

## Features

- **Headless-first** — `useOtpInput` hook with all logic, zero forced styling
- **Pre-built component** — `<OtpInput />` works out of the box with optional CSS
- **Paste handling** — full/partial codes, sanitizes dashes, spaces, invalid chars
- **Keyboard navigation** — arrows, Home/End, Backspace/Delete edge cases
- **iOS SMS autofill** — `autocomplete="one-time-code"`
- **WebOTP API** — Android Chrome SMS autofill (feature-detected)
- **Masked PIN mode**, error/disabled/loading states
- **Accessible** — real `<input>` elements, ARIA labels, axe-clean default
- **React 18 & 19** — StrictMode-safe, concurrent rendering compatible
- **Zero runtime dependencies** — tree-shakeable, ~3 KB gzipped (core)

---

## Install

```bash
npm install otp-pro-input
```

```bash
yarn add otp-pro-input
```

```bash
pnpm add otp-pro-input
```

**Peer dependencies:** `react` and `react-dom` (≥18)

---

## Quick start

```tsx
import { OtpInput } from 'otp-pro-input';
import 'otp-pro-input/styles.css';

export function VerifyPage() {
  return (
    <OtpInput
      length={6}
      onComplete={(code) => console.log('Submitted:', code)}
    />
  );
}
```

---

## Usage

### Default component

```tsx
<OtpInput
  length={6}
  groups={[3, 3]}
  renderSeparator={() => '–'}
  onChange={(code) => console.log(code)}
  onComplete={(code) => verify(code)}
/>
```

### Headless hook

Full control over markup and styling:

```tsx
import { useOtpInput } from 'otp-pro-input';

function MyOtp() {
  const { slots, clear, focus } = useOtpInput({
    length: 6,
    onComplete: (code) => verify(code),
  });

  return (
    <div role="group" aria-label="Verification code, 6 digits">
      {slots.map((slot) => (
        <input
          key={slot.index}
          {...slot}
          ref={slot.inputRef}
          value={slot.value}
          className="my-slot"
        />
      ))}
      <button type="button" onClick={clear}>Clear</button>
    </div>
  );
}
```

### Custom slots (`renderInput`)

```tsx
<OtpInput
  length={6}
  useDefaultStyles={false}
  groups={[3, 3]}
  renderSeparator={() => '–'}
  renderInput={(props) => {
    const { inputRef, displayValue, ...inputProps } = props;
    return (
      <input
        {...inputProps}
        ref={inputRef}
        value={displayValue}
        className={props['aria-invalid'] ? 'slot slot--error' : 'slot'}
      />
    );
  }}
  onComplete={handleVerify}
/>
```

### Imperative ref

```tsx
import { useRef } from 'react';
import { OtpInput, type OtpInputHandle } from 'otp-pro-input';

const ref = useRef<OtpInputHandle>(null);

<OtpInput ref={ref} length={6} />

ref.current?.focus(0);
ref.current?.clear();
ref.current?.getValue();
ref.current?.setValue('123456');
```

---

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `length` | `number` | **required** | Number of OTP slots (typically 4–8) |
| `value` | `string` | — | Controlled value |
| `defaultValue` | `string` | `''` | Uncontrolled initial value |
| `onChange` | `(code: string) => void` | — | Fired on every change |
| `onComplete` | `(code: string) => void` | — | Fired once when all slots are filled |
| `allowedChars` | `'numeric' \| 'alphanumeric' \| RegExp` | `'numeric'` | Valid characters per slot |
| `autoFocus` | `boolean` | `false` | Focus first empty slot on mount |
| `disabled` | `boolean` | `false` | Disable all slots |
| `readOnly` | `boolean` | `false` | Read-only slots |
| `error` | `boolean \| string` | — | Sets `aria-invalid` and `data-error` |
| `mask` | `boolean \| string` | — | Mask display character (default `•`) |
| `loading` | `boolean` | `false` | Disables input while verifying |
| `renderLoading` | `() => ReactNode` | — | Custom loading indicator |
| `renderInput` | `(props) => ReactElement` | — | Custom slot renderer |
| `renderSeparator` | `(index) => ReactNode` | — | Separator between slot groups |
| `groups` | `number[]` | — | Visual grouping, e.g. `[3, 3]` |
| `groupLabel` | `string` | `'One-time passcode'` | Accessible group name |
| `getSlotLabel` | `(index, length) => string` | `'Digit N of M'` | Per-slot `aria-label` |
| `dir` | `'ltr' \| 'rtl'` | `'ltr'` | Text direction |
| `enableWebOtp` | `boolean` | `false` | Enable WebOTP API (Android) |
| `enableAutofill` | `boolean` | `true` | iOS SMS autofill support |
| `announceComplete` | `boolean \| string` | `false` | `aria-live` completion announcement |
| `useDefaultStyles` | `boolean` | `!renderInput` | Apply default BEM class names |
| `className` | `string` | — | Root container class |
| `ref` | `OtpInputHandle` | — | Imperative API |

---

## Styling

Import the optional default stylesheet (never auto-injected):

```tsx
import 'otp-pro-input/styles.css';
```

Override via CSS custom properties:

```css
.my-otp {
  --otp-border-color: #6366f1;
  --otp-border-color-focus: #4f46e5;
  --otp-slot-size: 3rem;
  --otp-border-radius: 0.75rem;
  --otp-focus-ring: 0 0 0 3px rgba(99, 102, 241, 0.25);
}
```

Available variables include `--otp-gap`, `--otp-group-gap`, `--otp-font-size`, `--otp-background`, `--otp-text-color`, `--otp-error-color`, and more.

---

## Accessibility

- Each slot is a native `<input>` (not a styled `<div>`)
- Group uses `role="group"` with a descriptive `aria-label`
- Per-slot labels, e.g. *"Digit 1 of 6"* (customizable)
- `aria-invalid` and `data-error` for error states
- Optional `aria-live="polite"` completion announcement
- Visible focus indicator in the default theme
- 44×44px minimum touch targets in the default theme
- Natural tab order — no focus trap

Tested with **axe** (zero violations on the default component).

---

## Autofill

### iOS Safari

Sets `autocomplete="one-time-code"` and uses a hidden capture input. When iOS suggests a code from Messages, all slots fill and `onComplete` fires.

### Android Chrome (WebOTP)

```tsx
<OtpInput length={6} enableWebOtp onComplete={verify} />
```

Uses the [WebOTP API](https://developer.mozilla.org/en-US/docs/Web/API/WebOTP_API). Feature-detected — no-ops gracefully on unsupported browsers.

---

## Browser support

| Browser | Support |
|---------|---------|
| Chrome (last 2) | ✅ |
| Firefox (last 2) | ✅ |
| Safari (last 2) | ✅ |
| Edge (last 2) | ✅ |
| iOS Safari | ✅ SMS autofill |
| Android Chrome | ✅ WebOTP + paste |

---

## Links

- **Live demo:** [pranaypsurve.github.io/otp-pro-input](https://pranaypsurve.github.io/otp-pro-input/)
- **npm:** [otp-pro-input](https://www.npmjs.com/package/otp-pro-input)
- **Issues & feedback:** [GitHub Issues](https://github.com/pranaypsurve/otp-pro-input/issues)

---

## Legal

### Your rights

`otp-pro-input` is released under the **[MIT License](./LICENSE)**. You may use,
modify, and distribute it freely in personal and commercial projects, provided
you include the copyright notice.

### What npm users receive

The published package contains **no runtime dependencies**. Only `dist/` (your
compiled library + optional CSS) is shipped. React is a **peer dependency** —
consumers bring their own copy.

See [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md) on GitHub for additional notices.

### Original code

All library source is original work for this project. It does not bundle code
from other OTP libraries.

### Trademarks

“React” is a trademark of Meta Platforms, Inc. This project is an independent
open-source library and is not affiliated with or endorsed by Meta.

### Disclaimer

This software is provided **“as is”** without warranty. It is a **client-side UI
component only** — it does not verify, store, or transmit OTP codes to any
server. You are responsible for secure verification on your backend and for
compliance with laws applicable to your app (e.g. privacy, accessibility).

This is not legal advice. For specific compliance questions, consult a qualified
attorney.

---

## License

[MIT](./LICENSE) © 2026 Pranay Surve
