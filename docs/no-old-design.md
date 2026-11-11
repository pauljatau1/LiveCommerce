# Studio entry and settings

`feat/no-old-design` starts from main after #45 (type scale). Paul merges.

The default seller app uses the studio for every dashboard entry. Existing classic code remains behind `VITE_CLASSIC_DASHBOARD`; only an explicit `true` or `1` enables it. The classic row is absent by default. Reload/rebuild the app after changing this Vite flag.

| Old path, including nested paths | Destination |
| --- | --- |
| `/dashboard/products/*` | `/studio/products` |
| `/dashboard/orders/*` | `/studio/orders` |
| `/dashboard/earnings-payouts` | `/studio/money` |
| `/dashboard/settings` | `/studio/me` |
| `/dashboard/live-streams/*` | `/studio/shows` |
| Any other `/dashboard/*` | `/studio` |

Unauthenticated visitors reach studio sign-in and return to their studio destination after login. Returns are restricted to local `/studio` paths. Google sign-in uses the existing Google provider and auth endpoint when its existing client ID is configured.

Product editing uses the existing `/api/products` create/update endpoints, preserving the Listing Agent hand-off, proof, colour counts, photos, three levels of variants, identifiers and shipping settings. A rich text editor retains existing description formatting. Other product fields not edited by this screen remain on the saved product. Changing total stock invalidates per-colour counts, matching the classic editor.

Bank checking and saving use the existing `/api/v2/sellers/banks`, `/banks/verify` and `/profile/bank-details` APIs. Save remains disabled until the current bank and account number have a verified name. Changing either invalidates the verification. Money opens the sheet in place; Me opens the same sheet at `/studio/bank`.

Store profile uses the existing store-profile and avatar APIs. Pickup reuses `/studio/start?step=pickup`. Help has email support, FAQs and an optional WhatsApp button when its support number is configured. No phone number was invented. The support email keeps the existing verified support address as fallback.

Intercom's launcher and the cookie banner are **hidden on studio pages**, including the new auth screens. With classic enabled, the banner and launcher retain their old behavior outside studio. Consent handling remains in place: hiding the banner does not grant analytics consent. Studio NotificationContext and Sonner messages use the studio toast style. The loader and route errors use plain studio screens; the old versions remain behind the flag.

The title and text wordmark follow `APP_NAME` in the frontend constants. The HTML transform removes the classic favicon and unused font imports only while classic is off. Existing classic font imports remain available for rollback.

## Email changes

`BUYER_APP_URL` and `SELLER_APP_URL` build buyer/seller links. Seller links point to studio routes; the seller origin can include a trailing `/studio` without doubling the path. Signup verification, resend verification, seller welcome and buyer/seller password recovery use `utils/authEmail.js`, with the brand from `APP_NAME`. Templates escape dynamic names, brand, codes and links. Legacy auth HTML remains behind `CLASSIC_EMAIL_TEMPLATES`, off by default. Existing mail providers and verified sender email addresses are retained. The SendGrid sender display name follows the brand; the Termii sender identity remains managed by its existing provider configuration.

The older seller token-reset endpoint now links to the new password screen, which supports both token links and the regular code flow. Existing code expiration and reset APIs remain unchanged.

See [email audit](no-old-design-email-audit.md) for retained mail types. Order, return, wallet, campaign, notification, onboarding and referral links were updated independently of their template styling. The older buyer app has no dedicated store, terms/privacy, invite or unsubscribe screens; those existing paths now use the configured buyer origin and currently fall through to its Home route. This PR does not add those features or claim they work. Internal admin links and API/webhook URLs retain their own existing destinations.

## Render variable names

Seller web:

- `VITE_CLASSIC_DASHBOARD`
- `VITE_APP_NAME`
- `VITE_SUPPORT_EMAIL`
- `VITE_SUPPORT_WHATSAPP`

Server:

- `APP_NAME`
- `BUYER_APP_URL`
- `SELLER_APP_URL`
- `CLASSIC_EMAIL_TEMPLATES`

Existing auth/API variables, including `VITE_API_BASE_URL` and `VITE_GOOGLE_CLIENT_ID`, are unchanged. Both classic flags default off. WhatsApp is optional and appears only when configured. Set the frontend/server name variables consistently.

## Validation and screenshots

- Both production apps build; seller classic rollback build also checked.
- Server: 251 suites / 3,767 tests passed; studio: 21 unit tests passed; buyer: 7 unit tests passed. Targeted email suites: 55 tests passed after the sender-display update.
- Classic-row browser check passed in the rollback bundle. Studio live regression passed at 320, 375, 390 and 1280px, covering Run again, resume, reconnect and ended shows.
- `tests/visual/no-old-design.browser.mjs` runs the real React router at 390px with invented API data. It covers all redirect mappings, signed-out entry, sign-in return, signup validation/normalization, password code/token reset, product edit and AI hand-off, verified bank save and invalidation, profile save and pickup-required toast.
- [Screen gallery](screenshots/no-old-design/index.html): before/after auth, new product editor, store profile, pickup, bank sheet before/after name check, Help, Me, loading, not-found and router error. Captures use mocked data, not staging accounts.
- No horizontal overflow observed. Edit product is intentionally a scrolling form; optional fields are collapsed. Bank settings fit the phone sheet; smaller keyboards require scrolling the existing sheet. No cramped screen was silently redesigned.

Run the browser check with a running seller Vite server, `PLAYWRIGHT_MODULE` pointing to Playwright if it is not installed locally, and optional `BASELINE_SELLER_URL` pointing to a built baseline seller app. Server tests in this environment use MongoDB 7.0.3 with its configured local binary.
