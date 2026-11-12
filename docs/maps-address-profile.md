# Maps addresses and buyer profile

Built on `fix/area-picker`, by request. Keep this branch's PR unopened until that branch is merged into `main`.

Both apps lazily load Maps JavaScript API only while an address form is mounted. Places (New) predictions are restricted to Nigeria and biased using bounds supplied by `/api/v2/watch/config`. Each autocomplete session has a token; a selected prediction fetches only `formattedAddress`, `addressComponents`, and `location`. Current location uses browser permission and the Maps JS Geocoder. No separate server Maps key is needed.

Selected addresses retain street, area, LGA, state, latitude, longitude, source and formatted address. The server still checks service states. A mapped neighbourhood can be used even if Google uses a more specific name than the fallback directory; it must have valid numeric coordinates and a street. Manual addresses still require a listed area. Existing addresses remain readable and usable without map metadata.

Shipbubble gets the address string and coordinates. Address-code cache keys include coordinates when present, so changing a pin cannot reuse the old code. Manual edits clear old coordinates. Orders also retain coordinates where available.

The picker remains available when the key is absent, script/library loading fails, or the seller/buyer chooses “Choose area manually”. Google-selected out-of-area addresses cannot be saved; Notify me works for buyers, sellers and guests who supply an email. Guest notifications and seller notifications are deduplicated separately from the existing buyer/state entries and share the existing IP rate limit.

Seller pickup editing uses `/studio/pickup` and returns to Me, Store profile or the studio page that opened the pickup banner. The getting-started flow keeps its own steps and reuses the same form. Legacy pickup markup remains behind its inactive flag.

Buyer `/me` uses existing profile and address APIs. The new buyer-only phone action applies the Nigerian mobile check and normalization used by bank setup. The password action verifies the current password, limits guesses, invalidates old session tokens, returns a fresh current-session token and sends the existing password-changed email. Phone is entered and saved inline before DVA creation when missing; the live screen stays mounted.

## Configuration

Set `VITE_GOOGLE_MAPS_KEY` on the shop and studio static sites, then rebuild. Enable Maps JavaScript API, Places API (New), and Geocoding API for that key, with billing enabled. Restrict its browser referrers to the shop/studio domains. A missing key deliberately keeps the picker active.

## Validation results

261 server suites / 3,874 tests passed. Buyer: 18 tests passed. Studio: 38 tests passed. Both app builds passed. The new Maps/profile browser checks and the existing stay-on-stream top-up browser suite passed, including saved card, transfer and popup paths with a real quoted-deposit fixture.

## Local checks

- `npm --prefix buyer-web test`
- `npm --prefix seller-web test`
- `MONGOMS_VERSION=7.0.3 MONGOMS_SYSTEM_BINARY=/workspace/.local/bin/mongod npm --prefix server test -- --maxWorkers=2`
- `npm --prefix buyer-web run build`
- In seller-web: `NODE_OPTIONS=--max-old-space-size=6144 ./node_modules/.bin/vite build` and copy `dist/index.html` to `dist/404.html`.
- `PLAYWRIGHT_MODULE=<installed Playwright module> node tests/visual/maps-address-profile.browser.mjs` with buyer/studio dev servers on 5175/5174.
- Existing `buyer-web/tests/topups.browser.mjs` with a local API URL and mock Paystack public key in the test dev server.

Screenshots and browser API records in `docs/screenshots/maps-address-profile` use invented contacts and a mocked Maps SDK. They verify prediction selection, minimal fields, Nigeria restriction, configured bounds, token rotation, current location and denial, outside-state notifications (including guests), fallback on missing key or failed load, coordinate saves, quote refresh, pickup save/return, buyer address addition and phone-before-DVA ordering. They make no paid Maps or Paystack requests.

## Staging checks

1. Open an address form in shop sign-up during a bid, the one-step sheet, the address sheet and studio pickup. Search for a building or street in Lekki, Yaba and Surulere; check street, area, LGA and phone before saving.
2. Confirm selecting another address or current location refreshes the live Shipbubble price before Pay is enabled. Deny location permission and check the plain message.
3. Pick Abuja. Confirm the Lagos-only notice, Notify me and a deduplicated waitlist entry. No purchase should proceed.
4. Remove the Maps key or block its script. Confirm the area picker still works and quotes refresh after an area change.
5. Edit pickup from Me and Store profile; save and confirm return to the originating page without bank/store questions.
6. Visit buyer My profile from Home and Wallet. Edit details/phone; add, edit, default and remove an address. Change password; confirm an old session is refused and the current page stays signed in. Sign out.
7. On a show with a buyer whose profile has no phone, choose Bank transfer. Enter the phone inside consent and continue without leaving the show.
