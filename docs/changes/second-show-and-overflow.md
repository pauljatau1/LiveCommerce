# Second-show refusal and phone overflow

Branch `fix/second-show-and-overflow`, based on main `8b0e9cde` (#64). Paul opens the PR and merges.

## What changed

1. **Stop second-show attempts at the Go live check.** The check reads a seller-scoped live-conflict endpoint on opening and again before starting. It opens the existing Sheet with “You're already live”, the live show's title and the requested actions. Starting and host-session acquisition finish before navigation. A raced `409 already_live` uses the same sheet; a late initial lookup cannot erase that refusal. “Go to my live show” uses the existing T8 host gate. A legacy/direct Live route that gets refused returns to the check with the sheet open. Connecting and error states render without live controls; terminal missing/unauthorised shows have no ineffective retry/check action. Camera playback attaches when the successful live view mounts. Redirects preserve the studio back-navigation convention.

   Files: `seller-web/src/studio/{GoLive.jsx,goLiveStart.js,Live.jsx,api.js}`, `server/src/routes/studioRoutes.js`, `server/src/services/hostSessions.js`, `server/src/controllers/streamController.js`.

   New endpoint: `GET /api/v2/studio/shows/:id/live-conflict`. It checks ownership, excludes the current show, and returns only the other live show's ID and title. Start refusals include that same object. Show B stays scheduled; no order, payment or show creation path was added. Existing atomic settlement/start guards remain in place.

2. **Contain long user and AI text.** Pills/chips/tags receive bounded widths and clipping; text pills can actually render an ellipsis. Product detail's Shows rows also shrink/truncate their title without squeezing the date. Long unbroken text can wrap within both apps. No viewport/zoom restriction or page-level horizontal-overflow hiding was introduced.

   Files: `seller-web/src/studio/{studio.css,ProductDetail.jsx}`, `buyer-web/src/styles.css`.

3. **Generate titles on word boundaries.** Short pairs keep the existing “Live auction/drop: A & B” format. When that will not fit 80 characters, the title uses a complete-word prefix of the first product and the correct `+ N more` suffix. An overlong single word uses “Selected items” instead of cutting that word.

   Files: `seller-web/src/studio/{Planner.jsx,showTitle.js}`.

Old navigate-first, live-error-overlay and title-generation behaviour remains available behind `VITE_LEGACY_NAVIGATE_FIRST`, `VITE_LEGACY_LIVE_ERROR_OVERLAY`, and `VITE_LEGACY_SHOW_TITLES`, respectively. All default off; no new Render settings are required.

## Tests and results

- **Server:** 271 suites, **3,966 tests passed**. The new route test checks seller ownership, exclusion of the current show, and unchanged planned status. The host-session refusal test now checks the structured live-show response and unchanged show count.
- **Studio:** **72 tests passed**. `goLiveStart.test.js` covers preflight refusal without starting/claiming, raced 409 conversion, and start-before-navigation ordering. `showTitle.test.js` covers long names, whole-word shortening, suffix counts, short titles and an overlong single word.
- **Shop:** **40 tests passed**.
- **Both production builds passed.** Seller build used `NODE_OPTIONS=--max-old-space-size=6144`; both SPA fallback files were copied.
- **New browser checks passed:** `tests/visual/second-show-overflow.browser.mjs`. At both **360px and 390px**, studio product detail, products, planner (pick/order/setup), orders and recap, plus shop live/orders/profile, have document and body scroll widths equal to the phone width. Data includes very long names and long unbroken strings. Both viewport tags retain zoom support. [Measurements and flows](../screenshots/second-show-and-overflow/checks.json).
- The same browser script verifies the preflight sheet, raced 409, delayed stale lookup, Not now, T8 handoff, successful start exactly once, legacy/direct refusal without ever mounting controls, plain pickup errors and non-retryable missing shows.
- Existing live-control browser checks passed (updated to expect the new refusal sheet). Existing host-resume checks passed at 375×667 and 390×844; buyer Watch checks passed at 320×568, 375×600, 390×700 and desktop.
- Existing build/test warnings remain: stale Browserslist data, large bundle chunks, a duplicate AddressSheet `landmark` key, duplicate Mongoose indexes, AWS SDK v2 deprecation and Jest's forced-exit/open-handle notice.

## 390px screenshots

- [You're already live sheet](../screenshots/second-show-and-overflow/already-live-390.png)
- [Product detail with a long show title](../screenshots/second-show-and-overflow/long-show-product-390.png)

Browser checks use real app components with mocked API/socket/Agora responses; server tests use MongoDB in memory. No real staging accounts, broadcasts or payments were created. Actual iPhone hardware/Agora verification was not run because no staging sign-in is configured.

## Staging checks after merge

1. Keep A live. On another device/tab, open B's Go live check and tap Go live. Confirm the sheet stays on the check, Not now closes it, and B stays planned.
2. Use Go to my live show. Confirm A opens through T8 and requires an explicit move on a foreign device.
3. Open B's check before A starts, then start A elsewhere. B must handle its raced refusal with the same sheet. An old/direct B live URL must return to the check without showing controls behind the error.
4. End A, then start B from the check. Confirm it starts once and its preview becomes the live camera normally.
5. Open the audited pages with long show/product names at 360px and 390px. Confirm ellipses/wrapping, no sideways panning, and normal pinch zoom.
6. Plan a show using long sneaker/product names. Confirm its generated title ends on a word boundary, retains the correct `+ N more`, and stays within 80 characters.

_Generated by [Codex](https://openai.com/codex/)_
