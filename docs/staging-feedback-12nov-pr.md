# Fix staging navigation, keyboard, chat and wallet feedback

Money → Bank → Back now returns through history instead of adding another Money entry. Studio sub-screens use a safe direct-entry/redirect fallback, and pickup editing returns to its caller. Non-live forms hide unrelated sticky actions during editing and keep the active field above the keyboard.

Share is a five-column grid with SVG brand icons. Guest Send closes the keyboard, preserves cancelled text and posts once after signup/signin. Buyer passwords have eyes and a plain wrong-credentials message. Wallet shows a two-line saved-card action first, collapsed alternatives, and bank transfer before card when no saved card exists. The prior wallet layout and share letters/styles remain available in inactive code paths.

## Validation and audit

Both builds pass. Server: 259 suites / 3,860 tests; buyer: 7 tests; studio: 30 tests. New browser checks cover navigation, keyboard overlap, eyes/copy, share layout, guest comment handoff and wallet at 360px/enlarged text. Existing payment and Watch regression browser suites pass.

[Full audit, icon sources, reproducible checks and staging steps](https://github.com/pauljatau1/LiveCommerce/blob/fix/staging-feedback-12nov/docs/staging-feedback-12nov.md). The audit lists every checked studio/shop screen and distinguishes local wizard Back from page navigation. Keyboard and large-text captures are Chromium simulations with mocked APIs; physical iPhone/Android staging steps remain for Paul. No credentials or payments were used.

## Phone before / after

### Back / bank account

| Before | After |
| --- | --- |
| ![Before](https://github.com/pauljatau1/LiveCommerce/blob/fix/staging-feedback-12nov/docs/screenshots/staging-feedback-12nov/before/bank-back.png?raw=true) | ![After](https://github.com/pauljatau1/LiveCommerce/blob/fix/staging-feedback-12nov/docs/screenshots/staging-feedback-12nov/after/bank-back.png?raw=true) |

### Listing helper keyboard

| Before | After |
| --- | --- |
| ![Before](https://github.com/pauljatau1/LiveCommerce/blob/fix/staging-feedback-12nov/docs/screenshots/staging-feedback-12nov/before/listing-keyboard.png?raw=true) | ![After](https://github.com/pauljatau1/LiveCommerce/blob/fix/staging-feedback-12nov/docs/screenshots/staging-feedback-12nov/after/listing-keyboard.png?raw=true) |

### Product editor keyboard

| Before | After |
| --- | --- |
| ![Before](https://github.com/pauljatau1/LiveCommerce/blob/fix/staging-feedback-12nov/docs/screenshots/staging-feedback-12nov/before/product-keyboard.png?raw=true) | ![After](https://github.com/pauljatau1/LiveCommerce/blob/fix/staging-feedback-12nov/docs/screenshots/staging-feedback-12nov/after/product-keyboard.png?raw=true) |

### Shop address keyboard

| Before | After |
| --- | --- |
| ![Before](https://github.com/pauljatau1/LiveCommerce/blob/fix/staging-feedback-12nov/docs/screenshots/staging-feedback-12nov/before/address-keyboard.png?raw=true) | ![After](https://github.com/pauljatau1/LiveCommerce/blob/fix/staging-feedback-12nov/docs/screenshots/staging-feedback-12nov/after/address-keyboard.png?raw=true) |

### Share grid

| Before | After |
| --- | --- |
| ![Before](https://github.com/pauljatau1/LiveCommerce/blob/fix/staging-feedback-12nov/docs/screenshots/staging-feedback-12nov/before/share-grid.png?raw=true) | ![After](https://github.com/pauljatau1/LiveCommerce/blob/fix/staging-feedback-12nov/docs/screenshots/staging-feedback-12nov/after/share-grid.png?raw=true) |

### Guest Join the chat

| Before | After |
| --- | --- |
| ![Before](https://github.com/pauljatau1/LiveCommerce/blob/fix/staging-feedback-12nov/docs/screenshots/staging-feedback-12nov/before/guest-join.png?raw=true) | ![After](https://github.com/pauljatau1/LiveCommerce/blob/fix/staging-feedback-12nov/docs/screenshots/staging-feedback-12nov/after/guest-join.png?raw=true) |

### Buyer sign-in

| Before | After |
| --- | --- |
| ![Before](https://github.com/pauljatau1/LiveCommerce/blob/fix/staging-feedback-12nov/docs/screenshots/staging-feedback-12nov/before/buyer-signin.png?raw=true) | ![After](https://github.com/pauljatau1/LiveCommerce/blob/fix/staging-feedback-12nov/docs/screenshots/staging-feedback-12nov/after/buyer-signin.png?raw=true) |

### Buyer signup

| Before | After |
| --- | --- |
| ![Before](https://github.com/pauljatau1/LiveCommerce/blob/fix/staging-feedback-12nov/docs/screenshots/staging-feedback-12nov/before/buyer-signup.png?raw=true) | ![After](https://github.com/pauljatau1/LiveCommerce/blob/fix/staging-feedback-12nov/docs/screenshots/staging-feedback-12nov/after/buyer-signup.png?raw=true) |

### Wallet at 360px

| Before | After |
| --- | --- |
| ![Before](https://github.com/pauljatau1/LiveCommerce/blob/fix/staging-feedback-12nov/docs/screenshots/staging-feedback-12nov/before/wallet-360.png?raw=true) | ![After](https://github.com/pauljatau1/LiveCommerce/blob/fix/staging-feedback-12nov/docs/screenshots/staging-feedback-12nov/after/wallet-360.png?raw=true) |

### Wallet enlarged text

| Before | After |
| --- | --- |
| ![Before](https://github.com/pauljatau1/LiveCommerce/blob/fix/staging-feedback-12nov/docs/screenshots/staging-feedback-12nov/before/wallet-large-text.png?raw=true) | ![After](https://github.com/pauljatau1/LiveCommerce/blob/fix/staging-feedback-12nov/docs/screenshots/staging-feedback-12nov/after/wallet-large-text.png?raw=true) |

### Wallet enlarged alternatives

| Before | After |
| --- | --- |
| ![Before](https://github.com/pauljatau1/LiveCommerce/blob/fix/staging-feedback-12nov/docs/screenshots/staging-feedback-12nov/before/wallet-alternatives-large.png?raw=true) | ![After](https://github.com/pauljatau1/LiveCommerce/blob/fix/staging-feedback-12nov/docs/screenshots/staging-feedback-12nov/after/wallet-alternatives-large.png?raw=true) |

### Wallet without a saved card

| Before | After |
| --- | --- |
| ![Before](https://github.com/pauljatau1/LiveCommerce/blob/fix/staging-feedback-12nov/docs/screenshots/staging-feedback-12nov/before/wallet-no-saved-card.png?raw=true) | ![After](https://github.com/pauljatau1/LiveCommerce/blob/fix/staging-feedback-12nov/docs/screenshots/staging-feedback-12nov/after/wallet-no-saved-card.png?raw=true) |

Paul merges. No new environment variables.

_Generated by [Codex](https://openai.com/codex/)_
