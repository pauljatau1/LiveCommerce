# Shared type scale

The shop and non-live seller studio now use the same type/weight tokens and component sizes. Reading text is 400; names, labels, amounts and buttons are 600; Fredoka headings are 500. Wallet/Money balances keep the 32px hero size, recap earnings keep display size, and Go live/Publish retain the 17px main-action exception.

The requested tokens are identical in both CSS files. New scoped rules override the existing definitions on non-live pages and editable buyer sheets. The original definitions remain available for the protected live controls and run sheet, including their original token values. Existing heavy weights in those fallback/live definitions are deliberately retained; the new non-live rules use the requested weights. Form inputs stay 16px to prevent iPhone focus zoom; Studio money inputs use 17px.

No edits were made to Watch.jsx, watch.jsx, Live.jsx, LiveChat.jsx, RunSheet.jsx, the dedicated live/video-overlay CSS rules, or old-dashboard source files.

## Before and after at 390px

[Interactive side-by-side gallery](screenshots/type-scale/index.html). All captures use the real React components, fixed invented API data and the same Nunito/Fredoka font files. The Go live camera is a test stream. No accounts, listings, shows or payments were created.

| Screen | Before | After |
| --- | --- | --- |
| Shop · Home | [Before](screenshots/type-scale/before/shop-home.png) | [After](screenshots/type-scale/after/shop-home.png) |
| Shop · Orders | [Before](screenshots/type-scale/before/shop-orders.png) | [After](screenshots/type-scale/after/shop-orders.png) |
| Shop · Sign In | [Before](screenshots/type-scale/before/shop-sign-in.png) | [After](screenshots/type-scale/after/shop-sign-in.png) |
| Shop · Top Up | [Before](screenshots/type-scale/before/shop-top-up.png) | [After](screenshots/type-scale/after/shop-top-up.png) |
| Shop · Wallet | [Before](screenshots/type-scale/before/shop-wallet.png) | [After](screenshots/type-scale/after/shop-wallet.png) |
| Studio · Go Live | [Before](screenshots/type-scale/before/studio-go-live.png) | [After](screenshots/type-scale/after/studio-go-live.png) |
| Studio · Home | [Before](screenshots/type-scale/before/studio-home.png) | [After](screenshots/type-scale/after/studio-home.png) |
| Studio · Listing Agent | [Before](screenshots/type-scale/before/studio-listing-agent.png) | [After](screenshots/type-scale/after/studio-listing-agent.png) |
| Studio · Listing Draft | [Before](screenshots/type-scale/before/studio-listing-draft.png) | [After](screenshots/type-scale/after/studio-listing-draft.png) |
| Studio · Me | [Before](screenshots/type-scale/before/studio-me.png) | [After](screenshots/type-scale/after/studio-me.png) |
| Studio · Money | [Before](screenshots/type-scale/before/studio-money.png) | [After](screenshots/type-scale/after/studio-money.png) |
| Studio · Orders | [Before](screenshots/type-scale/before/studio-orders.png) | [After](screenshots/type-scale/after/studio-orders.png) |
| Studio · Planner | [Before](screenshots/type-scale/before/studio-planner.png) | [After](screenshots/type-scale/after/studio-planner.png) |
| Studio · Product | [Before](screenshots/type-scale/before/studio-product.png) | [After](screenshots/type-scale/after/studio-product.png) |
| Studio · Products | [Before](screenshots/type-scale/before/studio-products.png) | [After](screenshots/type-scale/after/studio-products.png) |
| Studio · Recap | [Before](screenshots/type-scale/before/studio-recap.png) | [After](screenshots/type-scale/after/studio-recap.png) |
| Studio · Shows | [Before](screenshots/type-scale/before/studio-shows.png) | [After](screenshots/type-scale/after/studio-shows.png) |

## Tight areas left unchanged

- Planner: the existing three-column selection cards still wrap long item names into two or three lines at 390px.
- Listing agent draft: the long preview/chat flow is dense around the sticky header and composer; these cover portions of the scroll area in both captures. This is a layout issue outside the type-scale change.
- Products: the existing filter strip still scrolls horizontally. The page itself has no horizontal overflow.
- Top-up sheet: it remains scrollable on shorter phones. Its input stays 16px and the payment buttons retain their primary hierarchy.

No new page-level horizontal overflow was found at 390px. No layout corrections were silently included.

## Validation

- Both production builds pass; 7 buyer and 16 studio unit tests pass.
- Full server suite: 250 suites, 3,762 tests pass.
- Existing buyer Watch and seller live-recovery browser tests pass at 320, 375, 390 and 1280px widths. The existing top-up browser suite passes all three methods with a quoted deposit, and the native-media suite confirms every camera/microphone track is released on exit and failure.
- Shared-style browser check confirms the requested sizes/weights/heights, 16px form inputs, 44px chip tap areas, parity between both apps, and unchanged protected live styles.

Reproduce the visual captures with both Vite servers running against a local API base. The script mocks every API response and isolates the real Studio routes from authentication. Set `PLAYWRIGHT_MODULE` when using the environment's supplied Playwright; then run:

```sh
CAPTURE_PHASE=after node tests/visual/type-scale.browser.mjs
node tests/visual/type-scale-check.mjs
```

For before captures, serve a clean archive of main at separate ports and set `BUYER_TEST_URL`, `SELLER_TEST_URL` and `CAPTURE_PHASE=before`. The checked-in Fontsource fixtures include their OFL licenses and are used only by the screenshot script.
