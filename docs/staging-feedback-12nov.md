# Staging feedback: 12 November

Branch starts at main `364c741d` (#50). Earlier unmerged address-picker/Maps work is separate. Paul merges this change.

## Behaviour

Studio Back uses router history (`navigate(-1)`), with a safe studio fallback replaced for direct entry or a classic-route redirect. Bank confirmation and planner/onboarding wizard steps keep their local Back steps. Pickup opened with `?step=pickup` returns to its caller after saving instead of continuing into the bank wizard. Money → Bank → Back → Back no longer revisits Bank.

Non-live forms use `useFormKeyboard` over `useKeyboardInset`. Inline editing hides unrelated sticky actions, navigation and the listing composer. Focused fields scroll above the visible viewport; the listing composer remains available above the keyboard when its own input is focused, with Publish hidden. Blur restores actions. Sheets resize only for a real visual-viewport inset, so blurring a field cannot move Pay out from under a tap. Live video and run controls retain their existing viewport logic.

Share destinations use five grid columns, wrapping remaining destinations to another row. Brand SVG silhouettes are unmodified Simple Icons v15 paths (CC0), displayed in recognisable brand colours without letter substitutes. Sources: `https://cdn.jsdelivr.net/npm/simple-icons@v15/icons/{whatsapp,instagram,tiktok,x,facebook,telegram}.svg`. Referenced brand guidelines: [WhatsApp](https://about.meta.com/brand/resources/whatsapp/whatsapp-brand/), [Instagram](https://about.meta.com/brand/resources/instagram/instagram-brand/), [TikTok](https://www.tiktok.com/about/brand-assets), [X](https://about.x.com/en/who-we-are/brand-toolkit), [Facebook](https://about.meta.com/brand/resources/facebook/logo/), [Telegram](https://telegram.org/press). Legacy letter marks remain behind `LEGACY_SHARE_MARKS`; legacy row styles remain above the active grid override.

Guests blur chat on Send, then see Join the chat. Cancel keeps their message. Completing signup/signin waits for their authenticated socket and emits the queued comment once. A failed socket connection leaves the text available to retry. Buyer auth and the one-step account sheet use accessible independent password eyes. Login failures show “Wrong email or password. Try again or reset it.”

Wallet saved-card top-up has two lines, with amount first and bank/last4/one tap second. A saved card comes first, with other methods in a closed disclosure. Without a saved card, bank transfer precedes card entry. Amount chips adapt to enlarged text, and pending payments disable competing methods. Prior expanded rendering remains behind `LEGACY_TOPUP_LAYOUT`.

## Audit

| Screen | Back / keyboard check |
| --- | --- |
| Studio Money | History-aware Back; withdrawal sheet follows visible viewport. |
| Bank account / bank picker | Return to caller, direct-entry fallback Me; search/number fields stay above keyboard. Confirmation Back remains local. |
| Store profile | Back and Save return to caller; sticky Save hides during editing. |
| Pickup / Getting started | Explicit pickup edit returns to caller. Normal wizard keeps its steps; fields scroll above keyboard. |
| Help | History-aware Back; no sticky bottom form controls. |
| Listing helper | Safe Close; Publish/composer hide for inline answers and return on blur. Composer input stays above keyboard. |
| Product editor | History-aware Close/Back; sticky Save hides during field editing. |
| Product detail | History-aware Back; normal inline fields, no sticky bottom action. |
| Planner | Local step Back preserved; exiting returns through history; selected-items bar hides while typing. |
| Go live checklist | History-aware Back; preflight bottom action hides while a form field is active. |
| Shows / Recap / Notifications / order detail | History-aware TopBar; no sticky form composer. |
| Studio shell: Home / Products / Orders / Me | Tab bar and add-product floating action hide during text editing. Me and Money sheets use the shared viewport handling. |
| Studio sign-in / signup / forgot password | Reading and input forms have no sticky bottom action; normal page scrolling retained. |
| Shop Home / Sign in / Signup | Header-scoped form handling; no sticky bottom composer. Eyes checked on signup and signin. |
| Shop Address / One step / wallet top-up sheets | Shared sheet follows the visual viewport; action taps remain stable after blur. |
| Shop Wallet / Orders | No page-level sticky form composer; nested sheets use the shared handling. |
| Buyer Watch | Only the requested guest-comment handoff changed. Existing video/reconnect/chat keyboard behaviour regression checked. |

Every studio TopBar with a navigation Back uses the shared history policy. Internal bank confirmation, modal dismissal, and wizard steps remain local actions. Listing helper's custom Close uses the same history policy.

## Validation

- Server: all 259 suites / 3,860 tests passed.
- Buyer: 7 tests passed. Studio: 30 tests passed, including history/fallback/redirect policy tests.
- Both production builds passed; seller built with `NODE_OPTIONS=--max-old-space-size=6144`.
- Browser before/after checks cover bank history, profile/help/pickup/editor return paths and direct bank entry; listing inline focus/blur and composer focus; product/address keyboard visibility; grid icons; auth eyes/error copy; wallet at 360px and enlarged text, including expanded alternatives.
- Guest browser checks cover cancel, signup, signin, input blur and exactly one queued comment.
- Existing top-up browser suite checks saved-card, transfer and popup payments, quoted delivery and single address save. Existing Watch checks pass at 320×568, 375×600, 390×700 and 1280×800.

Screenshots are real components with invented API/SDK data. Keyboard areas use a simulated visual viewport in Chromium; enlarged text is a 150% body-text simulation, rather than physical-device OS settings. No real payment or account was created. No horizontal clipping was found after the changes. Enlarged text intentionally wraps balance information and uses fewer amount-chip columns.

To reproduce: run buyer at 5185 with a local API URL and mock Paystack public key; seller at 5174. Run `tests/visual/staging-feedback.browser.mjs` and `tests/visual/guest-comments.browser.mjs` with the installed Playwright module. For before captures, serve the unchanged main worktree at buyer 5188 / seller 5189, each with its own Vite cache, and use `MODE=before`.

## Staging steps

1. On iPhone/Android Chrome, repeat Money → Bank → Back → Back. Open bank, profile, pickup, help and edit-product from different studio pages; check Back and a fresh direct link.
2. Focus quantity/title/price in the listing helper: sticky controls disappear, field sits above keyboard, controls return after blur. Focus Ask for a change and check Send stays visible. Repeat editor, planner, bank and address fields.
3. Open Share: every app is visible in five columns, without horizontal scrolling, and launches/copies the same destination as before.
4. As a guest, type and Send, cancel and confirm text remains. Repeat, signup/signin, and confirm the message appears once.
5. Check password eyes on shop signup/signin and Join the chat. Wrong credentials show the new plain message.
6. At 360px and large phone text, check saved-card amount/bank lines, collapsed alternatives, transfer and card entry, and no clipping. Repeat without a saved card and confirm bank transfer is first.
