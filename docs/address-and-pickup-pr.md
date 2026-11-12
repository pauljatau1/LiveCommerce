# Fix address defaults and pickup delivery validation

Address entry now defaults to State, Area, Street, optional Landmark and Phone in both apps. Only the explicit Google search setting enables Places; a configured Maps key alone no longer loads Google or shows location/search controls. The existing picker and Shipbubble address format remain intact.

Delivery uses the warehouse courier contact before the account phone. Pickup saves write the same normalised 11-digit phone to both fields. Studio pickup displays share the server's warehouse → business → seller precedence, and pickup saves reload the full seller from the API.

A saved invalid delivery phone opens “Fix your phone number for the courier” in the live show's one-step sheet. The buyer repairs it inline before a bid or payment can continue. Phone repair is buyer-only, scoped to their address, and works with legacy city labels without asking for the address again.

Fixable courier phone/address failures enter `needs_fix`. They keep the delivery deposit held, create one persisted notification for the responsible buyer/seller, and make no further Shipbubble pricing calls until those details change. The retry job checks paused records against their saved address/phone fingerprint and resumes changed records. Temporary API/KYC/network failures keep the existing timed retry. Seller validation reasons are stored against the pickup fingerprint and shown on Home with a fix button; stale reasons are hidden after a change.

Old Places and local pickup-patching code remain behind inactive settings/flags. Already paid, booked and in-transit deliveries are not moved into the new retry state.

Depends on `fix/seller-profile-wipe` before merge: the existing seller profile GET can wipe a local-format phone/store. The pickup reload introduced here must ship after that blocker is disabled.

## Validation

- Both builds pass. Server: all 261 suites / 3,887 tests pass. Buyer: 21 tests pass. Studio: 42 tests pass. Maps/default-form and payment browser checks pass.
- Integration test: `POST /api/v2/watch/:id/delivery-quote` returns an available Lagos price with `seller.phoneNumber = null` and a valid `warehouseDetails.contactNumber` (mocked Shipbubble, real Express route and database).
- Tests cover default/Google gating, matching pickup precedence, both saved phone fields, invalid-phone repair and ownership, stored Home reasons, one-time fix notifications, no repeat courier calls while unchanged, and resuming after an edit.
- Browser checks cover plain forms with a Maps key present but search off; explicitly enabled Maps; server-profile reload after pickup saves; and a 12-digit saved delivery phone repaired inline before bidding without leaving the show.

## Render variable (shop and studio; leave unset for now)

- `VITE_ADDRESS_SEARCH`

## Review captures

| Buyer default form | Seller default pickup |
| --- | --- |
| ![Buyer form](https://github.com/pauljatau1/LiveCommerce/blob/fix/address-and-pickup/docs/screenshots/address-and-pickup/plain-buyer-address.png?raw=true) | ![Seller pickup](https://github.com/pauljatau1/LiveCommerce/blob/fix/address-and-pickup/docs/screenshots/address-and-pickup/plain-seller-pickup.png?raw=true) |

![Inline saved-phone repair](https://github.com/pauljatau1/LiveCommerce/blob/fix/address-and-pickup/docs/screenshots/address-and-pickup/topups/courier-phone-repair.png?raw=true)

Captures use invented data and mocked APIs/Maps/Paystack. No live staging account or payment was used.

## After-merge staging check for Claude / Paul

1. Leave the address-search variable unset on both static sites and rebuild. With a Maps key still present, confirm State/Area/Street/Landmark/Phone appear and no Google script, current-location button or manual-area link loads.
2. For the test store, save pickup with a valid 11-digit courier phone. Check both `warehouseDetails.contactNumber` and `phoneNumber`, then Me, Store profile and product location should show the warehouse address after server reload.
3. Call `POST /api/v2/watch/:id/delivery-quote` for a live show/product with a listed Lagos area/LGA, street and valid phone. Confirm `available: true` and a positive `amount` once the host's pickup validates. Shipbubble must receive `<street>, <landmark>, <area>, <LGA>, Lagos, Nigeria`.
4. Use a buyer with a saved 12-digit delivery phone. Tap Bid: repair inline, stay on the show, and confirm only one phone update followed by the bid. No money should move before a valid phone and price are confirmed.
5. Cause a fixable pickup/buyer address validation failure on an unpaid delivery. Confirm `needs_fix`, the owner notification, and the seller Home reason. Repeat the retry job without edits: no duplicate notification or courier request. Change the affected details and run the job again; pricing resumes.
6. Confirm a temporary Shipbubble outage remains retryable and existing paid/booked shipments retain their status.

Paul merges. No credentials required in this PR.

_Generated by [Codex](https://openai.com/codex/)_
