# Stay on stream wallet top-ups

Buyers can fund their wallet over the live show with a personal bank account number or a reusable saved card. The existing Paystack popup remains available. Both new methods default off.

A verified payment commits the unique reference ledger and wallet increment in one MongoDB transaction. The webhook and browser confirmation share that path. Card charges have a durable, buyer-scoped idempotency key; uncertain responses keep polling the same reference rather than initiating another charge. Card authorizations are encrypted with AES-GCM using a domain-separated key derived from the existing session/signing secret, and are excluded from API responses. Rotating that existing secret requires buyers to save their cards again.

After funding, Watch reloads the show, balance and delivery deposit. It resumes only the original purchase at the original price, on the original run and for the same buyer. A higher next bid, changed price, changed run or changed item requires confirmation. Closed shows never resume a purchase. The final bid write also checks the expected run, deadline and next-bid step; the Buy Now transaction checks the expected price, run and visibility. MongoDB must support transactions (replica set/Atlas); the new unique indexes must be built before accepting payments.

## Screenshots

All images show the real React screens with mocked API/SDK responses, using invented account/card details. No payment was made.

| State | Screenshot |
| --- | --- |
| Before: flags off, original popup | [Before](screenshots/stay-on-stream-topups/01-before-popup-only.png) |
| Saved card, bank transfer and popup options | [Methods](screenshots/stay-on-stream-topups/02-methods.png) |
| Bank consent | [Consent](screenshots/stay-on-stream-topups/03-bank-consent.png) |
| Account assignment pending | [Pending](screenshots/stay-on-stream-topups/04-bank-pending.png) |
| Account ready and waiting | [Account](screenshots/stay-on-stream-topups/05-bank-account.png) |
| Sheet closed, waiting pill on show | [Waiting pill](screenshots/stay-on-stream-topups/06-waiting-on-show.png) |
| Price moved, explicit bid confirmation | [Confirm bid](screenshots/stay-on-stream-topups/07-money-in-confirm-new-bid.png) |
| Transfer received | [Received](screenshots/stay-on-stream-topups/08-transfer-received.png) |
| Saved card charging | [Charging](screenshots/stay-on-stream-topups/09-card-charging.png) |
| Bank requires a check | [Bank check](screenshots/stay-on-stream-topups/10-card-bank-check.png) |
| Declined card, 320px phone | [Declined](screenshots/stay-on-stream-topups/11-card-declined-small-phone.png) |
| Saved card credited | [Added](screenshots/stay-on-stream-topups/12-card-added.png) |
| Wallet saved cards and Remove | [Saved cards](screenshots/stay-on-stream-topups/13-wallet-saved-cards.png) |
| Charge awaiting verification | [Confirming](screenshots/stay-on-stream-topups/14-card-confirming.png) |
| Bank account unavailable | [Unavailable](screenshots/stay-on-stream-topups/15-bank-unavailable.png) |

[Interactive before/after gallery](screenshots/stay-on-stream-topups/index.html)

## Automated checks

Verified on this branch: **250 Jest suites / 3,754 tests passed**, buyer unit tests passed, buyer production build passed, and both browser suites passed (the existing Watch suite at 320, 375, 390 and 1280px widths).

From `server/`: `npm run test:ci -- --runInBand` runs the full Jest suite. When using the environment’s preinstalled MongoDB binary, prefix the command with `MONGOMS_VERSION=7.0.3 MONGOMS_SYSTEM_BINARY=/workspace/.local/bin/mongod` so fixtures select the supported storage engine. The payment integration tests use a MongoDB replica set and mocked Paystack requests, exercising duplicate signed webhooks, transaction rollback, assignment events and polling, consent, verification failures, encrypted card saving, card removal, expiry/email changes, success/paused/declined charges, ownership and concurrent idempotency-key reuse. The Jest pending-intent tests run the browser's actual pure decision function.

From `buyer-web/`: `npm test` and `npm run build`. With the normal Vite dev server using a local API base and a dummy test public key, run `node tests/topups.browser.mjs`. Set `PLAYWRIGHT_MODULE` for the existing Watch browser suite when Playwright is supplied by the environment. The new browser suite accepts that variable too. API and Paystack calls are mocked; it captures every sheet state and asserts original-bid auto-placement, explicit higher-bid confirmation, duplicate receipt handling, account polling/requery, popup reuse and card removal. Run `node tests/watch.browser.mjs` for the existing Watch regressions.

## How to check on staging

Paul runs these checks after merging and configuring the flags, using the existing test account. No new accounts, dashboard changes or keys are needed from this branch.

1. On the staging shop, open a live show with a wallet short of the next bid. With both new methods disabled, confirm the original popup flow remains.
2. Enable the new methods in staging. With first name, last name and a Nigerian phone in the profile, choose Bank transfer. Confirm the consent text, masked phone and disabled button until checked. Submit once; repeat/reopen without generating another account. Confirm the DVA assignment uses the `test-bank` provider. Missing profile details should point to the profile; a BVN-required failure should offer a card instead.
3. Use Paystack's demo bank app to send to the assigned account. Close the sheet and keep watching. Confirm the waiting pill reopens the same account, and the wallet receives the transfer once. Try “Sent it but nothing yet?” twice; the second call should ask you to wait. Temporarily disconnect the buyer socket and confirm polling still finds the payment.
4. Repeat with the original item/run still open and the original bid valid: it should place exactly that bid once, including delivery coverage. Repeat after another bidder raises the price, the host starts another run/item, or the show ends: require confirmation for the new amount, or place nothing. Repeat for Buy Now, including a price or stock change. A sign-out/account change must never resume the earlier buyer's purchase.
5. Choose Pay with card with Save this card checked. Use Paystack's documented reusable test card. After verification, confirm only bank/brand/last four/expiry appear in Saved cards. Repeat the card payment without consent and with a non-reusable authorization: no card should be stored. Remove a card and confirm duplicate payment notifications cannot restore it.
6. With a usable saved card, confirm it appears first and the one-tap amount rounds the shortfall up to the next ₦5,000. Double-tap while charging: one provider charge and one wallet credit. Confirm an unchanged pending bid resumes at its original amount.
7. Exercise a test bank-check response. Confirm the bank explanation appears and Paystack resumes over the show without navigating away. Close the popup; verification/webhook settlement must still credit once. Try a documented declined test card: show the plain decline message and leave the wallet unchanged. Change the profile email or test with an expired card: mark it unusable. Use another card must open the existing popup immediately.
8. Check the sheet and waiting pill on a small iPhone viewport. Confirm the live show stays mounted behind each state and returns to the latest scene after backgrounding.

Real Paystack staging transactions were not run in this environment; no staging sign-in or Paystack credentials are configured.

## Render environment variable names

- `PAYSTACK_DVA_ENABLED`
- `PAYSTACK_SAVED_CARDS_ENABLED`
- `PAYSTACK_DVA_BANK`
