# Simplify colours and staging fixes

Branch: `fix/simplify-colours`, based on `main` at `5cc34ab8`. Paul opens and merges the PR.

## Changes and files

1. **Plain products by default.** Server `COLOURS` and shop/studio `VITE_COLOURS` default off; only `true` enables the retained feature. Colours remain part of the seller's title. The forms and AI use one total stock number, the planner uses one row per product, and Buy now skips the colour sheet. New orders retain the exact catalogue title. Existing colour metadata remains stored; total stock is authoritative while off. Existing lot IDs remain stable for holds, timers and order references. No migration or production data changes.
   - Flags: `server/src/config/colours.js`, `buyer-web/src/features.js`, `seller-web/src/studio/features.js`; server/shop `.env.example`.
   - Server: `controllers/productController.js`, `controllers/adminController.js`, `modules/productv2/services/createProduct.service.js`, `controllers/streamController.js`, `routes/studioRoutes.js`, `routes/watchRoutes.js`, `services/{productColours,colourLots,plainProducts,buyNowOrderService,auctionOrderService,auctionRuns}.js`, `services/ai/listingDraftService.js`, `socket/socketManager.js` (under `server/src/`).
   - Studio: `ProductEditor.jsx`, `productEditor.js`, `ProductDetail.jsx`, `ListingAgent.jsx`, `listingApi.js`, `Planner.jsx`, `Live.jsx`, `RunSheet.jsx` (under `seller-web/src/studio/`).
   - Shop: `buyer-web/src/pages/Watch.jsx`, `buyer-web/src/walletIntents.js`.
2. **Delivery `/me` recovery.** Without `productId`, the old path passed a generic “Item” with value zero to the courier quote. Raw rate-provider exceptions then bypassed the route's `DeliveryError` catch. The service now refuses a missing or unresolvable item in plain words and wraps unexpected quote errors. `/me` responds with HTTP 200, `depositDue: null` and `deliveryProblem` for quote failures. Service-area details are retained. The shop waits for the scene and sends the current product ID, including top-up recovery.
   - `server/src/services/deliveryService.js`, `server/src/routes/watchRoutes.js`, `buyer-web/src/pages/Watch.jsx`.
3. **Planner notes persist with the show.** Previously the planner created the show and saved notes in a second request; it caught a failed notes save but still navigated away. Creation was also allowed while drafting was in progress. Both auction/drop creation now validate and persist notes in the initial show write. Creation waits for drafting. Saved-default notes remain a separate best-effort preference; a failure cannot unpin this show's notes. The previous separate planner request stays behind `LEGACY_SEPARATE_PLANNER_NOTES`.
   - `seller-web/src/studio/Planner.jsx`, `server/src/controllers/streamController.js`, `server/src/services/showNotes.js`.
4. **Profile phone fallback.** An empty profile phone prefills from the default delivery address and saves through the existing profile phone endpoint. A nonempty profile phone is preserved.
   - `buyer-web/src/pages/Me.jsx`.
5. **Wrong password.** The existing plain message now sits under Password and above Forgot password. The login service returns `UnauthorizedException`; the shared HTTP error handler now recognises that exception's status field, so wrong passwords and unknown emails both return 401 with the same existing API message.
   - `buyer-web/src/pages/Auth.jsx`, `server/src/modules/buyer/services/login.service.js`, `server/src/app.js`.

## Regression coverage

- Server: `tests/ai/listingCorrections.test.js` exercises real v1/v2 create and edit requests with colour input ignored, stored legacy metadata retained, actual login requests returning 401 for wrong/unknown credentials, and the normal phone-save endpoint persisting the address fallback. `tests/ai/listingDraft.test.js` checks the prompt, Gemini schema and parsed response with colours off. Existing colour-specific tests explicitly enable the retained feature.
- Atomic sales: `tests/services/{buyNowOrderService,auctionOrderService,colourLots}.test.js` cover total stock, concurrent drop buyers, plain order titles, sold counts, unchanged legacy colour allocations, and legacy lot identities.
- Delivery: `tests/services/deliveryService.test.js` combines the real quote service and `/me` route with a mocked Shipbubble provider. It checks failed provider requests and missing item IDs (even on a populated show) returning 200 with a plain problem.
- Notes: `tests/routes/studioRoutes.test.js` creates both show types with generated notes, changes the show to live, and verifies the studio detail and buyer notes endpoints. `tests/services/showNotes.test.js` checks creation validation.
- Shop/studio: `buyer-web/tests/simplifyColours.test.js` and `seller-web/src/studio/simplifyColours.test.js` cover default flags, AI/saved product editor payloads, total stock, pending-buy recovery and singular/plural recap labels. Existing editor and wallet policy tests retain explicit legacy coverage: `seller-web/src/studio/{resetColours,noOldDesign,productEditor,e2e12nov}.test.js`, `buyer-web/tests/colourIntents.test.js`, and `server/tests/wallet/pendingIntent.test.js`.
- Browser: `tests/visual/simplify-colours.browser.mjs` uses actual components with invented API fixtures, at 360px/390px for sign-in and profile. It verifies phone prefill/save, error position, the normal stock stepper, one planner row per product, draft-in-progress blocking, notes in the creation request, and recap singular/plural rendering. No horizontal overflow or browser runtime errors.

## Screenshots

All use synthetic data; no accounts or payments were created.

| Screen | Before | After |
| --- | --- | --- |
| Product stock | [Colour stock](../screenshots/colour-lots/T4-colour-stock.png) | [Plain stock](../screenshots/simplify-colours/product-plain-stock.png) |
| Planner | [Colour lots](../screenshots/colour-lots/T5-running-colour-lots.png) | [One row per product](../screenshots/simplify-colours/planner-plain-products.png) |
| Generated notes | | [Notes before creating](../screenshots/simplify-colours/planner-pinned-notes.png) |
| Sign-in error | [Previous placement](../screenshots/shop-missing-screens/S1-wrong-password.png) | [360px](../screenshots/simplify-colours/sign-in-error-360.png), [390px](../screenshots/simplify-colours/sign-in-error-390.png) |
| Profile phone | | [360px](../screenshots/simplify-colours/profile-phone-360.png), [390px](../screenshots/simplify-colours/profile-phone-390.png) |
| Recap | | [1 item](../screenshots/simplify-colours/recap-1-sold.png), [2 items](../screenshots/simplify-colours/recap-2-sold.png) |

Before images are the committed main-branch fixtures. No layout redesign; existing components/tokens are unchanged.

## Verification

- Full server Jest: **268 suites / 3,947 tests passed** (`MONGOMS_VERSION=7.0.3 MONGOMS_SYSTEM_BINARY=/workspace/.local/bin/mongod npm test -- --maxWorkers=2`).
- Final focused server checks: **18 create/edit/login/profile tests passed**, including the two v2-create/profile-save cases added after the full run started; **33 delivery tests passed** after the final missing-ID handling change. These overlap the full suite and are not added to its count.
- Shop `npm test`: **32 passed**.
- Studio `npm test`: **56 passed**.
- Shop production build: **passed** (`npm run build`).
- Studio production build: **passed** (`NODE_OPTIONS=--max-old-space-size=6144 ./node_modules/.bin/vite build`, then copy `dist/index.html` to `dist/404.html`; the packaged script overrides the heap to 4096).
- Browser: **9 checks passed**; [recorded requests/checks](../screenshots/simplify-colours/checks.json). No new cramped layout was found.
- Existing warnings remain: AddressSheet's duplicate landmark key, old Browserslist data, large bundles, AWS SDK v2, duplicate Mongoose indexes and Jest's force-exit/open-handle notice.

Live staging was not tested: no staging sign-in is configured, and Paul requested that no accounts or credentials be created. The delivery failure was traced in code and reproduced with a mocked provider, rather than inferred from an authenticated staging trace.

_Generated by [Codex](https://openai.com/codex/)_
