# Live-show reliability and listing fixes

Branch: `fix/live-and-listing`. Base: `43fa664c`, the merge of #61. Paul opens the PR and merges it. No deployment, staging accounts or live payments were created.

## 1. Live studio recovery and the host-away grace period

The mic now uses `setMuted`, so it stays publishable when muted. The publishing helper excludes ended/disabled tracks. Foreground recovery keeps the client and healthy tracks, replaces only OS-ended tracks, and rejoins only a disconnected client. Temporary camera failures retry automatically. Device ownership also covers cancellation during an awaited rejoin, so ending the show cannot reacquire capture later. SDK messages are replaced with plain errors.

Hiding the page mutes video and marks the host away through the existing authenticated socket and a studio endpoint. Buyers see “Host will be right back” in the existing video overlay, with the last decoded frame when available. The show stays live; bidding, chat and auction deadlines continue.

The server persists a two-minute deadline and schedules an Agenda `host-away-grace` job. Resume cancels the job and invalidates its version. An expiry and a returning seller compete through conditional database updates; a stale job cannot end a resumed show. Expiry uses the normal end-show controller and its normal auction order path. An in-flight settlement is allowed to finish before holds are released; the job retries if necessary. The seller waits for settlement before opening the recap. Buyers receive the normal ended notification.

Only sockets registered as live hosts trigger disconnect grace. Closing another studio tab, or disconnecting an old socket while a current host socket is present, does not pause the show.

Files:

- `seller-web/src/studio/Live.jsx`, `hostMedia.js`, `api.js`.
- `server/src/services/hostPresence.js`, `server/src/models/Stream.js`, `server/src/routes/studioRoutes.js`, `server/src/socket/socketManager.js`, `server/src/config/agenda.js`, `server/src/controllers/streamController.js`.
- `server/.env.example`: optional `LEGACY_HOST_DISCONNECT` rollback setting. It defaults off; no new required Render setting. The original two-hour timeout code remains behind it. Client legacy mic/session/camera/quality code remains behind named constants in `hostMedia.js` and `Live.jsx`.

Tests:

- `server/tests/services/hostPresence.test.js`: schedule/cancel, stale jobs, owner checks, expiry with a real paid auction order and recap, in-flight settlement without releasing its hold, unrelated-tab/old-socket disconnects, and the legacy setting.
- `seller-web/src/studio/hostMedia.test.js`: muted publishing; dead/disabled filtering; replacing only the dead track; disconnected-only rejoin; capability clamping; plain errors; retaining poor-connection quality; cancellation during rejoin.
- `seller-web/tests/host-resume.browser.mjs`: actual Live component, Run again, muted resume, one client, only dead-track replacement, transient camera failure/retry, device switching, quality adaptation, countdown recovery, pending settlement and ended recap. SDK/API doubles; 375×667 and 390×844.
- Existing doubles updated in `seller-web/tests/live-media.browser.mjs` and `studio-recovery.browser.mjs` for the supported SDK methods.

## 2. Quality and device choice

The normal profile is 1280×720, up to 30 fps, with a 1500 kbps maximum. Width, height and frame rate are clamped to camera capabilities using the classic studio's approach. A poor uplink steps down to 640×480, up to 24 fps and 650 kbps. The intermediate quality level retains the current profile to avoid oscillation. Repaired or switched cameras keep the lower profile while the connection remains poor.

The existing control rail now opens a camera/microphone sheet. Choices use `getCameras`/`getMicrophones` and `setDevice`, without restarting the client. Local device preferences carry into the next Go live checklist. Switching microphones preserves the mute preference; Flip camera updates the live device and preview mirror.

Files: `seller-web/src/studio/Live.jsx`, `hostMedia.js`, `GoLive.jsx`. Tests are listed above.

## 3. Planner scrolling

Step 2 has a bounded, native vertical scroll container with bottom clearance for the fixed Next bar. Rows allow touch scrolling; only the ⠿ handle starts drag. Keyboard reordering remains available.

Files: `seller-web/src/studio/Planner.jsx`, `studio.css`.

`tests/visual/live-and-listing.browser.mjs` selects eight products, performs an actual emulated touch gesture, verifies scroll movement, and checks that the last row clears the fixed Next bar at 375×667 and 390×844. It also records baseline screenshots from the unmodified #61 merge.

## 4. Transfer waiting state

The wallet-credit transaction, its socket emission and the DVA ledger query were already present. The failure was in UI reconciliation: a late account poll could restore the waiting state after a credit cleared it; the duplicate reference was then ignored. Some reopened waits also lacked a polling timestamp.

Every wait now has a timestamp. Completed wait sessions cannot be restored by a late callback. The polling path refreshes the wallet as well as checking `latestCredit`. A total-wallet increase covering the requested amount also completes the wait. Total balance is used when available, so releasing a bid hold alone does not look like a top-up. The existing intent policy still checks the current product/run, quote and funds before acting; money crediting and spending remain on the existing atomic server paths.

Files:

- `buyer-web/src/pages/Watch.jsx`, `buyer-web/src/components/StayOnStreamTopUps.jsx`, `buyer-web/src/transferRecovery.js`.
- `buyer-web/tests/transferRecovery.test.js`: timestamps, stable baseline, amount threshold and hold-release exclusion.
- `buyer-web/tests/live-and-listing.browser.mjs`: socket-only, poll-only and balance-only completion; waiting state stays cleared after another poll; exactly one pending bid is emitted.
- `server/tests/webhooks/stayOnStreamTopUps.test.js`: verifies the committed bank-transfer credit emits once and remains discoverable through the DVA poll.

## 5. Product photos

The gallery supports horizontal swipes, full-screen opening, full-screen swipes/counter, ✕/Escape, swipe-down close and keyboard controls. Background content is inert while the full-screen viewer is open. Existing studio photo height, buyer thumbnail dimensions and controls are retained. The old static-photo markup remains behind `LEGACY_STATIC_PHOTOS`.

The listing helper now allows removing photos throughout the editable draft, not just the initial upload. The editor retains its existing add/reorder support. Removal asks “Remove this photo?” and the last photo cannot be removed. The server also rejects removal of the final saved photo. Removed storage files are deleted only after the product save succeeds.

The shop has no standalone product-page route in this repository. Its gallery is available from the current product surfaces: the live item and Items sheet thumbnails. No extra product route or layout was introduced. Existing products are edited through Edit all on product detail.

Files:

- `seller-web/src/studio/ImageGallery.jsx`, `ProductDetail.jsx`, `ProductEditor.jsx`, `ListingAgent.jsx`, `studio.css`.
- `buyer-web/src/components/ImageGallery.jsx`, `watch.jsx`, `buyer-web/src/styles.css`.
- `server/src/controllers/productController.js`.
- `server/tests/services/productPhotos.test.js`: delete only after successful save, preserve files on failed save, keep one photo.
- Gallery/editor/helper browser checks in `tests/visual/live-and-listing.browser.mjs`; buyer full-screen swiping and swipe-down close in `buyer-web/tests/live-and-listing.browser.mjs`.

## 6. Listing weight

The helper exposes an editable Weight row using its existing Field component. The model prompt includes dress/sneaker examples; a dress/gown with no model weight falls back to 0.5 kg. The seller can change the estimate. Publishing uses the existing `weight` and `shippingInfo.weight.value` fields in kilograms. Product detail and Edit all retain their existing weight display/editor.

Files: `seller-web/src/studio/ListingAgent.jsx`, `server/src/services/ai/listingDraftService.js`. The existing `listingApi.js` already writes both shipping weight fields and needed no change.

Tests: the helper browser check edits weight to 0.7 kg and inspects the publish request. `server/tests/services/deliveryService.test.js` saves that shape through the real product-creation controller and verifies `unit_weight: "0.7"` in the Shipbubble quote request.

## 7. Buyer live tidy-up

Positions are unchanged. The extra bottom transfer hint remains switched off behind `LEGACY_TRANSFER_HINT`; the top pill carries that state. Delivery is a single truncated line. Price/timer, title/meta and transfer pill use the existing type tokens. Quick-bid pills use the standard 38px shape and existing 44px tap-area rule, with the amount first, a secondary increment, and the existing selected brand fill.

Files: `buyer-web/src/pages/Watch.jsx`, `styles.css`, `components/BidMoreSheet.jsx`.

Browser checks cover 360px and 390px: item live, bid sheet, waiting transfer and winning. They also verify the host-away overlay does not stop the timer or a valid bid. No new font sizes, weights or colour values were added to the UI rules; the old rules remain underneath the scoped overrides.

## Screenshots

All images use synthetic fixtures. Before images come from an isolated checkout at `43fa664c`.

| State | Before | After |
| --- | --- | --- |
| Planner, top, 375×667 | [Before](../screenshots/live-and-listing/before/planner-top-375.png) | [After](../screenshots/live-and-listing/after/planner-top-375.png) |
| Planner, last item, 375×667 | [Before](../screenshots/live-and-listing/before/planner-last-375.png) | [After](../screenshots/live-and-listing/after/planner-last-375.png) |
| Planner, 390×844 | [Before](../screenshots/live-and-listing/before/planner-top-390.png) | [Last item after](../screenshots/live-and-listing/after/planner-last-390.png) |
| Studio product photos | [Before](../screenshots/live-and-listing/before/studio-product-images.png) | [After](../screenshots/live-and-listing/after/studio-product-images.png), [full screen](../screenshots/live-and-listing/after/studio-photo-full.png) |
| Editor / listing helper | | [Edit photos](../screenshots/live-and-listing/after/editor-photos.png), [helper photos](../screenshots/live-and-listing/after/listing-draft-photos.png), [editable weight](../screenshots/live-and-listing/after/listing-weight-and-photos.png) |
| Buyer photo viewer | | [Full screen](../screenshots/live-and-listing/after/buyer-photos-full.png) |
| Live item, 360px | [Before](../screenshots/live-and-listing/before/live-item-360.png) | [After](../screenshots/live-and-listing/after/live-item-360.png) |
| Bid sheet, 360px | [Before](../screenshots/live-and-listing/before/bid-sheet-360.png) | [After](../screenshots/live-and-listing/after/bid-sheet-360.png) |
| Waiting, 360px | [Before](../screenshots/live-and-listing/before/waiting-transfer-360.png) | [After](../screenshots/live-and-listing/after/waiting-transfer-360.png) |
| Winning, 360px | [Before](../screenshots/live-and-listing/before/winning-360.png) | [After](../screenshots/live-and-listing/after/winning-360.png) |
| Live item, 390px | [Before](../screenshots/live-and-listing/before/live-item-390.png) | [After](../screenshots/live-and-listing/after/live-item-390.png) |
| Bid sheet, 390px | [Before](../screenshots/live-and-listing/before/bid-sheet-390.png) | [After](../screenshots/live-and-listing/after/bid-sheet-390.png) |
| Waiting, 390px | [Before](../screenshots/live-and-listing/before/waiting-transfer-390.png) | [After](../screenshots/live-and-listing/after/waiting-transfer-390.png) |
| Winning, 390px | [Before](../screenshots/live-and-listing/before/winning-390.png) | [After](../screenshots/live-and-listing/after/winning-390.png) |
| Credit recovered / host away | | [W6](../screenshots/live-and-listing/after/transfer-recovered-W6.png), [host away](../screenshots/live-and-listing/after/host-away.png) |

## Verification results

- **Server Jest: 270 suites, 3,958 tests passed**, using `MONGOMS_VERSION=7.0.3 MONGOMS_SYSTEM_BINARY=/workspace/.local/bin/mongod npm test -- --maxWorkers=2`.
- **Studio: 62 tests passed** (`npm test`).
- **Shop: 34 tests passed** (`npm test`).
- **Shop production build passed** (`npm run build`).
- **Studio production build passed** with `NODE_OPTIONS=--max-old-space-size=6144 ./node_modules/.bin/vite build`, followed by the normal index-to-404 copy. The packaged build script overrides the heap to 4096, so Vite was invoked directly with the requested heap.
- **Browser checks passed:** 9 studio/planner/photo/helper captures and assertions; host recovery at 375×667 and 390×844; buyer live/bid/waiting/winning at 360px and 390px; buyer photo swiping/close; host-away bids and server timer updates; socket/poll/balance credit recovery with exactly one bid and no resurrected wait.
- **33 PNG screenshots**: 13 before and 20 after. [Studio request/check log](../screenshots/live-and-listing/after/checks.json).
- JavaScript syntax checks and whitespace checks passed.

Existing warnings include old Browserslist data, large bundles, the existing duplicate AddressSheet landmark key, AWS SDK v2, duplicate Mongoose indexes, and Jest's force-exit/open-handle notice.

## Staging checks for Paul

1. On an iPhone, go live, mute the mic, run another auction, then leave and return within two minutes. Confirm the same show resumes, the mic stays muted, the buyer overlay clears and the countdown catches up. Repeat with the phone locked and after switching apps.
2. Leave for more than two minutes during an auction with a bid. Confirm the buyer sees ended, the winner is charged once, delivery follows the normal end-show flow and the seller opens the final recap.
3. Close Money/Me in another studio tab while the host remains live. Confirm no away overlay or grace expiry is triggered.
4. Switch camera/mic and start another show to check remembered choices on the physical devices. Throttle the uplink and confirm video quality drops and later recovers.
5. In Plan a show, select eight items and reach the last row at 375×667 and 390×844. Check both scrolling and handle-only reordering.
6. Make a staging bank transfer while watching; confirm the waiting pill clears and W6 acts only once. Repeat after temporarily disconnecting the buyer socket.
7. Add/remove/reorder photos, save, swipe the gallery and close it by swipe down. Edit helper weight and check the resulting delivery quote.

Physical iPhone/Safari, real Agora capture and real bank-transfer checks were not possible here: no staging sign-in or live provider test access is configured, and Paul requested no account creation or credential requests. Browser tests use mobile Chromium, SDK/provider doubles and invented data. These checks should be repeated on staging after merge.

_Generated by [Codex](https://openai.com/codex/)_
