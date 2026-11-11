Dashboard links now enter the studio by default. Product editing, bank verification, store profile and Help have studio screens; pickup uses the existing setup flow. Login, signup, password reset, loading and route errors use the same studio style. The classic implementation remains behind an explicit flag.

Based on main after #45. Paul merges.

- Product editing uses the existing API and retains all classic editor fields, nested variants, photos, shipping settings and Listing Agent hand-off state.
- Bank checking/saving uses the existing payout APIs, invalidates stale name checks and keeps the Money flow on screen.
- Buyer/seller email links use app URL helpers. Signup/resend/password recovery and seller welcome share a brand-configurable template; old HTML stays behind an off-by-default rollback flag.
- Intercom and the cookie banner are hidden on studio/auth pages. Consent is not granted automatically. Studio notifications use studio toasts.

| Old route (all nested paths included) | Lands on |
| --- | --- |
| `/dashboard/products/*` | `/studio/products` |
| `/dashboard/orders/*` | `/studio/orders` |
| `/dashboard/earnings-payouts` | `/studio/money` |
| `/dashboard/settings` | `/studio/me` |
| `/dashboard/live-streams/*` | `/studio/shows` |
| Any other `/dashboard/*` | `/studio` |

The browser check exercises these redirects and signed-out return to the intended studio page. It also covers signup validation, code/token reset, AI hand-off, product and profile saves, verified bank saving/invalidation, and pickup-required messaging.

Render variable names:

- Seller: `VITE_CLASSIC_DASHBOARD`, `VITE_APP_NAME`, `VITE_SUPPORT_EMAIL`, `VITE_SUPPORT_WHATSAPP`.
- API: `APP_NAME`, `BUYER_APP_URL`, `SELLER_APP_URL`, `CLASSIC_EMAIL_TEMPLATES`.
- Existing `VITE_API_BASE_URL` and `VITE_GOOGLE_CLIENT_ID` are unchanged.

Both classic flags default off. WhatsApp is shown only when a support number is configured. No number was invented. The sender mailbox is retained; Termii sender identity remains in its existing provider configuration.

Validation: both production builds; seller rollback bundle and classic-row browser check; 251 server suites / 3,767 tests; 21 studio unit tests and 7 buyer unit tests; real-router form/redirect checks; studio live regression at 320, 375, 390 and 1280px. Screens below use invented data and mocked APIs at 390px; no staging accounts or credentials.

[Implementation and checks](https://github.com/pauljatau1/LiveCommerce/blob/feat/no-old-design/docs/no-old-design.md) · [Retained email inventory and reasons](https://github.com/pauljatau1/LiveCommerce/blob/feat/no-old-design/docs/no-old-design-email-audit.md)

Existing buyer routes for store, invite, unsubscribe and legal pages currently fall through to Home. Their links now use the buyer origin; those missing features are documented rather than represented as functional. Internal admin links and backend webhook/API endpoints retain their own destinations. Other transactional email layouts remain unchanged except the audited app links/text logo replacements; see the inventory.

No horizontal overflow observed. Edit product remains a scrolling form with optional sections collapsed. Small-phone keyboards require scrolling the bank sheet; no cramped screen was silently redesigned.

390px screenshots (tap to open full size):

| Screen | Before | After |
| --- | --- | --- |
| Sign in | ![Sign in before](https://github.com/pauljatau1/LiveCommerce/blob/feat/no-old-design/docs/screenshots/no-old-design/before/login.png?raw=true) | ![Sign in after](https://github.com/pauljatau1/LiveCommerce/blob/feat/no-old-design/docs/screenshots/no-old-design/after/login.png?raw=true) |
| Signup | ![Signup before](https://github.com/pauljatau1/LiveCommerce/blob/feat/no-old-design/docs/screenshots/no-old-design/before/signup.png?raw=true) | ![Signup after](https://github.com/pauljatau1/LiveCommerce/blob/feat/no-old-design/docs/screenshots/no-old-design/after/signup.png?raw=true) |
| Forgot password | ![Forgot password before](https://github.com/pauljatau1/LiveCommerce/blob/feat/no-old-design/docs/screenshots/no-old-design/before/forgot-password.png?raw=true) | ![Forgot password after](https://github.com/pauljatau1/LiveCommerce/blob/feat/no-old-design/docs/screenshots/no-old-design/after/forgot-password.png?raw=true) |

| Studio screen | Screenshot |
| --- | --- |
| Edit product | ![Edit product](https://github.com/pauljatau1/LiveCommerce/blob/feat/no-old-design/docs/screenshots/no-old-design/after/edit-product.png?raw=true) |
| Store profile | ![Store profile](https://github.com/pauljatau1/LiveCommerce/blob/feat/no-old-design/docs/screenshots/no-old-design/after/store-profile.png?raw=true) |
| Pickup address | ![Pickup address](https://github.com/pauljatau1/LiveCommerce/blob/feat/no-old-design/docs/screenshots/no-old-design/after/pickup-address.png?raw=true) |
| Bank account | ![Bank account](https://github.com/pauljatau1/LiveCommerce/blob/feat/no-old-design/docs/screenshots/no-old-design/after/bank-account.png?raw=true) |
| Verified bank | ![Verified bank](https://github.com/pauljatau1/LiveCommerce/blob/feat/no-old-design/docs/screenshots/no-old-design/after/bank-verified.png?raw=true) |
| Help | ![Help](https://github.com/pauljatau1/LiveCommerce/blob/feat/no-old-design/docs/screenshots/no-old-design/after/help.png?raw=true) |
| Me | ![Me](https://github.com/pauljatau1/LiveCommerce/blob/feat/no-old-design/docs/screenshots/no-old-design/after/me.png?raw=true) |
| Email reset code | ![Email reset code](https://github.com/pauljatau1/LiveCommerce/blob/feat/no-old-design/docs/screenshots/no-old-design/after/reset-code.png?raw=true) |
| Reset success | ![Reset success](https://github.com/pauljatau1/LiveCommerce/blob/feat/no-old-design/docs/screenshots/no-old-design/after/reset-success.png?raw=true) |
| Pickup required toast | ![Pickup required toast](https://github.com/pauljatau1/LiveCommerce/blob/feat/no-old-design/docs/screenshots/no-old-design/after/pickup-required-toast.png?raw=true) |
| Loader | ![Loader](https://github.com/pauljatau1/LiveCommerce/blob/feat/no-old-design/docs/screenshots/no-old-design/after/loader.png?raw=true) |
| Not found | ![Not found](https://github.com/pauljatau1/LiveCommerce/blob/feat/no-old-design/docs/screenshots/no-old-design/after/not-found.png?raw=true) |
| Route error | ![Route error](https://github.com/pauljatau1/LiveCommerce/blob/feat/no-old-design/docs/screenshots/no-old-design/after/error.png?raw=true) |

_Generated by [Codex](https://openai.com/codex/)_
