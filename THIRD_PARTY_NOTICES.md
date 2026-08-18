# Third-party notices

This file documents third-party software used in the **development** of
`otp-pro-input`. None of these packages are bundled into the published npm
package.

## Published npm package (`otp-pro-input`)

The package published to npm contains **only** the contents of the `dist/`
folder plus `package.json`, `README.md`, and `LICENSE`.

| Item | Notes |
|------|--------|
| Runtime dependencies | **None** |
| Peer dependencies | `react`, `react-dom` (provided by the consumer's app) |
| Bundled third-party code | **None** — React is marked external and not included in `dist/` |
| License of published code | **MIT** — see [LICENSE](./LICENSE) |

Consumers install React separately in their own applications. React is licensed
under the [MIT License](https://github.com/facebook/react/blob/main/LICENSE).

## Development dependencies (not shipped)

The following tools are used only during development, testing, and building.
They are **not** included in the npm download:

- TypeScript, tsup, Vite, ESLint, Vitest
- React Testing Library, jsdom, vitest-axe
- Type definitions (`@types/*`)

Dev dependencies may have their own licenses (MIT, Apache-2.0, ISC, BSD, etc.).
These apply to development tooling only and do not affect end users of the
library.

## Web platform APIs

This library optionally uses standard browser APIs documented by the W3C/WHATWG
and browser vendors:

- **WebOTP API** — SMS one-time code autofill ([MDN documentation](https://developer.mozilla.org/en-US/docs/Web/API/WebOTP_API))
- **`autocomplete="one-time-code"`** — HTML standard for OTP fields

No proprietary SDKs or licensed third-party runtime code is required.

## Fonts and assets

The default CSS (`styles.css`) uses **system font stacks** only (e.g.
`ui-monospace`, `system-ui`). No web fonts or external assets are loaded.

## Original work

All source code in `src/` was written for this project. It does not incorporate
code copied from other OTP libraries or commercial products.

If you redistribute or modify this software, retain the MIT copyright notice in
[LICENSE](./LICENSE).
