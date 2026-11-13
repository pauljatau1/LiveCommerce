# Studio, delivery repair and admin missing screens

Branch: `feat/studio-admin-missing-screens`, stacked on `feat/colour-lots-ui` (`a6ff89ff`). Merge shop, then colour lots, then this branch. Paul opens and merges the PRs.

| Design | Files changed |
| --- | --- |
| T1 | seller-web/src/studio/PickupAddress.jsx, PickupAddressForm.jsx, ServiceArea.jsx, AreaPicker.jsx, AreaPicker.css, studio.css; shared buyer AreaPicker.jsx |
| T2 | seller-web/src/studio/Home.jsx, ServiceArea.jsx, studio.css |
| T3 | seller-web/src/studio/GoLive.jsx, ServiceArea.jsx, studio.css |
| T7 seller | seller-web/src/studio/Orders.jsx, studio.css; server/src/routes/deliveryRoutes.js |
| T7 buyer | buyer-web/src/pages/Orders.jsx, components/CourierRepairSheet.jsx, api.js, styles.css; server/src/routes/deliveryRoutes.js, services/deliveryService.js |
| A1 | admin/src/pages/WithdrawalReview.tsx, WithdrawalReview.css, withdrawals.tsx, config/withdrawals.ts, components/layouts/MainLayout.tsx, public/fonts; server/src/routes/reviewedWithdrawalAliases.js, adminRoutes.js, services/reviewedWithdrawals.js, models/Withdrawal.js, routes/studioRoutes.js |
| Shared design follow-ups | buyer CourierNameFields.jsx / OneStepSheet.jsx hide the repeated name legend in S7; Watch.jsx confirms W6 only for the acknowledged amount; styles.css allows W1 to stay on one line when it fits and wrap on narrow/large-text phones; studio Planner.jsx supplies a drag payload for browsers that require one. |

## Behaviour

- Pickup uses the existing standalone screen, saves through onboarding and refreshes seller data. Browser checks save back to Me, Store profile, Home and the pre-show check. Getting started retains its separate pickup → bank flow.
- The studio picker shares the shop's chips/search/group layout. Its portal receives studio tokens, and the closed studio field also shows the LGA. Existing Maps and manual fallback settings remain.
- Home banners appear below the greeting and above the next-show card, only for their corresponding conditions. The out-of-area check keeps its camera preview and replaces Go live with the repair action. Its copy uses the seller's actual state and the configured allowed states.
- Buyer Orders opens the name/phone repair over the page. Saving refreshes the buyer and calls the new buyer-owned `/api/v2/deliveries/:id/retry`. This delegates to the existing settlement and booking services. Unchanged details stay paused; other buyers' deliveries and seller-owned repairs cannot be retried through it. Insufficient funds still use the existing delivery-payment flow.
- Seller Orders displays Waiting for buyer and a disabled Book pickup button while a buyer repair is needed. Polling only reloads delivery state; it does not repeatedly call Shipbubble.
- A buyer retry racing the seller's Book pickup click can claim only one booking. The in-flight response is plain language. Delivery item snapshots retain the colour-bearing order name.
- Admin GET `/api/admin/withdrawals` retains its existing list contract. The new page filters pending unsent requests and sorts oldest first. POST approve/reject delegates to the exact #57 reviewed router/service; no new transfer or refund path. Rejecting a pending reservation releases its available balance as before. The reason is stored separately and shown in the seller's Money activity.
- The classic admin component remains behind `VITE_CLASSIC_WITHDRAWALS=true`. Default is the reviewed screen; other admin pages retain their layout. `VITE_APP_NAME` optionally changes the wordmark. No new required Render setting.

## Design notes and limits

- All colours, type sizes and weights reuse the shop/studio values. Admin's scoped token block mirrors the existing shop block. Its Nunito/Fredoka assets are copies of the fonts already in this repository. Inputs retain the existing 16px iPhone-safe size.
- Screenshots use invented API records, fake camera media and placeholder product photos. Names, states, counts, dates and prices are dynamic, rather than hard-coded from the artwork.
- T7's repair action says Save name/phone and retry delivery in Orders; there is no bid on that page. The live S7 sheet keeps Save name/phone and bid. Courier copy avoids assuming a buyer's gender, and order subtitles distinguish auctions from drop purchases.
- The W7 provider limitation documented in the shop report remains: paused saved-card verification uses Paystack's secure resume popup, not an app-owned OTP/resend form.

## Validation

- Full server suite: final verified rerun **268 suites / 3,934 tests passed** (all final server changes and the colour-bearing delivery snapshot assertion). An earlier full run also passed the same counts. An intermediate run exposed an unscoped fixture assertion that read an older show’s delivery; scoping it to the current show resolved that test failure.
- Focused server reruns: **3 suites / 46 tests passed**, followed by **5 suites / 69 tests passed** after adding the delivery snapshot assertion. Added tests cover the v1 admin aliases and seller-visible rejection reason, buyer-owned retry, and a buyer/seller booking race. The existing colour race test now also checks the delivery's colour-bearing name.
- Shop: **31 tests passed**. Studio: **52 tests passed**.
- Shop and studio production builds: **passed**. Studio uses `NODE_OPTIONS=--max-old-space-size=6144`. Existing bundle-size/Browserslist/Jest open-handle warnings remain.
- Admin Vite production bundle: **passed**. Focused strict TypeScript check of the new review page/config: **passed**.
- Full `npm --prefix admin run build`: **blocked by 120 pre-existing TypeScript errors**, reproduced on the unchanged base and identical after ignoring shifted line numbers. No new errors were introduced. Examples are old unused imports, Navbar's incomplete User type, ReturnRequests typing, and Vite's allowedHosts type. Evidence: [admin-typecheck-baseline.txt](admin-typecheck-baseline.txt). These unrelated screens were not edited to bypass their errors.
- `tests/visual/studio-admin-missing-screens.browser.mjs`: **passed**. Covers pickup and picker, all four return origins, both Home banners and their absence, blocked pre-show check, seller/buyer name/phone states, save → retry, admin queue ordering, approve/reject, rejection dialog and empty state at phone/desktop widths.
- `tests/visual/colour-lots.browser.mjs`: **passed**, including drag reorder and restoration after supplying the drag payload.
- `tests/visual/shop-missing-screens.browser.mjs`: **passed** against this branch, retaking the shop screens and 360/390px wallets after the compact name-form refinement.
- `buyer-web/tests/topups.browser.mjs`: **passed** against this branch. Includes all funding methods plus quoted delivery, duplicate receipts, price movement, and refusing to label a different bid amount as the funded bid.
- All browser/API/payment checks use test doubles. No account, real charge, transfer or shipment was created.

## Screenshots

| Design | Preview |
| --- | --- |
| T1 | [Pickup](screenshots/studio-admin-missing-screens/T1-pickup.png), [picker](screenshots/studio-admin-missing-screens/T1-area-picker.png), [chosen area](screenshots/studio-admin-missing-screens/T1-area-selected.png) |
| T2 | [Lagos-only](screenshots/studio-admin-missing-screens/T2-lagos-banner.png), [phone](screenshots/studio-admin-missing-screens/T2-phone-banner.png) |
| T3 | [Pre-show blocked](screenshots/studio-admin-missing-screens/T3-pre-show-block.png) |
| T7 | [Seller](screenshots/studio-admin-missing-screens/T7-seller-order.png), [buyer name](screenshots/studio-admin-missing-screens/T7-buyer-orders-name.png), [buyer phone](screenshots/studio-admin-missing-screens/T7-buyer-orders-phone.png), [name fix](screenshots/studio-admin-missing-screens/T7-fix-name.png), [phone fix](screenshots/studio-admin-missing-screens/T7-fix-phone.png) |
| A1 | [Phone](screenshots/studio-admin-missing-screens/A1-withdrawals-390.png), [desktop](screenshots/studio-admin-missing-screens/A1-withdrawals-1280.png), [reject phone](screenshots/studio-admin-missing-screens/A1-reject-390.png), [reject desktop](screenshots/studio-admin-missing-screens/A1-reject-1280.png), [empty](screenshots/studio-admin-missing-screens/A1-empty.png) |

_Generated by [Codex](https://openai.com/codex/)_
