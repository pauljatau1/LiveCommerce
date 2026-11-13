Fixes the blockers from the 12 Nov staging run: the courier now receives a full name, buyers can reset their password in the shop or over the live show, colour stock edits keep the total in sync, and withdrawal requests can be reviewed and paid by an admin.

- Courier forms ask for first and last name when missing, save them to the buyer profile, and include the name in the delivery quote. The server prefers a full address name, then a full account name; it removes digits/symbols and refuses a username or one-word fallback. Name, phone, address and service failures have separate messages. Name changes invalidate courier-address caches and unblock paused delivery checks.
- `/signin` defaults to sign-in. “Forgot password?” opens email → six code boxes → new password, using the existing hardened buyer endpoints. Pasting a code and email-link resets work. The join/one-step reset stays over the show and returns to sign-in.
- New colour rows start at one. Empty/zero editor colour stocks produce “Add stock for each colour”; old technical required-fields errors map to messages beside their fields. On the product page, +/− open the colour breakdown. Saving updates the colour quantities, variant counts and total together; the API refuses a separate total that disagrees.
- Live delivery wording is “Delivery from ₦… · one parcel per show, priced when the show ends.” The win sheet identifies the estimate while the show is live. An already-open win sheet follows the show to the end summary and refreshes the final parcel price there. Orders explains any additional wallet debit or release from the first-item hold. Delivery holds are listed separately from bid holds.
- Withdrawals remain pending until admin approval. Seller copy says “We'll send it within 1 working day.” Each new request triggers an alert to `ADMIN_ALERT_EMAIL`; a failed alert does not discard the request. The bank destination is the saved request snapshot. Concurrent requests cannot exceed the seller's available balance; competing approvals send only one Paystack transfer. Approval checks also protect the available balance when older pending requests overlap.
- Recap uses BUYER/BUYERS correctly. Sold/ended auctions clear their stale “Bidding is open” notices, including after recovery.

### Withdrawal review API

All routes require the existing admin authentication. No payout or email was sent to a real provider during this work.

| Method | Route | Result |
| --- | --- | --- |
| GET | `/api/v2/admin/withdrawals?status=pending` | Newest first, up to 100 records; accepts the existing withdrawal statuses. |
| POST | `/api/v2/admin/withdrawals/:id/approve` | Claims an unsent pending request and initiates Paystack Transfers with a stable reference. Request body cannot replace the amount or bank. |
| POST | `/api/v2/admin/withdrawals/:id/reject` | Rejects an unsent pending request; optional `{ "reason": "…" }`. No transfer or wallet debit. |
| POST | `/api/v2/admin/withdrawals/:id/verify` | Reconciles a reviewed transfer with Paystack if confirmation was delayed. |

An existing pending request with no transfer reference can be approved/rejected through these routes without a migration. Already-processing legacy transfers retain their webhook handling. Legacy manual completion/transfer/status mutations are switched off by default; their code remains behind `LEGACY_WITHDRAWAL_REQUESTS`. Leave that setting unset. Automatic payouts are not enabled.

A timeout after submitting a transfer leaves it processing and reserved. Verify that reference instead of sending again. Signed `transfer.success`, `transfer.failed` and `transfer.reversed` events settle the reviewed record; wallet debit/refund and status changes are transactional and idempotent. Duplicate or late events do not debit/refund twice.

Render setting to add: `ADMIN_ALERT_EMAIL`. Existing Paystack and mailer settings continue to apply.

### Validation

- Server: 267 suites / 3,926 tests passed. Shop: 28 tests passed. Studio: 50 tests passed. Both production builds passed.
- Unit/integration coverage: address/account name fallbacks; provider name/phone/address failures; higher/lower final delivery fees; separate delivery/bid holds; colour defaults, field messages and total-stock enforcement; recap/ended-auction copy; admin authorization, existing pending requests, concurrent withdrawals/approvals, notification failure, provider timeout, reconciliation, duplicate webhooks and reversal.
- Mocked phone-browser checks at 390px and a 360px join sheet: sign-in default, six-digit code pasting, password reset without leaving the show, full name sent with the quote and saved to profile, and stock-by-colour editing.
- Existing mocked payment-browser checks: saved card, bank transfer and popup top-ups still cover bid + quoted delivery; quote is awaited and the address is saved once.
- No staging accounts created, real payments made, or live withdrawal approvals performed.

### Phone previews (mocked data)

[Shop sign-in](screenshots/e2e-12nov/shop-sign-in.png) · [shop reset code](screenshots/e2e-12nov/shop-six-digit-reset.png) · [join-sheet reset at 360px](screenshots/e2e-12nov/join-six-digit-reset.png) · [courier name](screenshots/e2e-12nov/courier-name-and-estimate.png) · [first-item estimate](screenshots/e2e-12nov/first-item-delivery-estimate.png) · [stock by colour](screenshots/e2e-12nov/stock-by-colour.png) · [final price in the win sheet](screenshots/e2e-12nov/win-final-delivery.png)

### Staging after merge (Claude)

1. Use a buyer with no full name. Enter a Lagos delivery address, add first/last name, and confirm the quote request includes it and the profile retains it. Try bad name/phone/address data separately and check the message identifies the right problem.
2. Open `/signin`, reset using the emailed six-digit code, and sign in with the new password. Repeat from the join/one-step sheet; the show and typed chat message should remain. The existing five-wrong-attempt/expiry rules still apply.
3. Add a product colour: its stock starts at one. Clear it/set zero and confirm the adjacent message. Save valid colours; open +/− on the product page, edit the breakdown, and confirm total and colour counts agree after reload.
4. Win/buy a first item and check the estimate wording. After the show ends, check Orders for the final parcel fee and the wallet difference. Test a final fee above and below the first-item hold; any shortfall can be funded before delivery payment.
5. Request a withdrawal and confirm it is pending, appears in the admin list and sends an alert to Paul's configured inbox. On staging/test money only, approve it, verify the Paystack reference/webhook, and confirm the seller balance is debited once. Reject a different pending request and confirm no money moves. Do not retry an uncertain transfer as a new payment.
6. Confirm a one-buyer recap reads “1 BUYER” and a sold auction no longer shows “Bidding is open”.

Paul merges.

_Generated by [Codex](https://openai.com/codex/)_
