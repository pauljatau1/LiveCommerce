Launch delivery is limited to Lagos by default. Anyone can still watch, chat, follow and share from anywhere. Buyers need a supported delivery address to bid or buy; sellers need a supported pickup address to go live. Adding a state later changes the server setting rather than app code.

The server supplies state choices and searchable Lagos neighbourhoods to both apps. A single state is locked; multiple supported states become a picker. The chosen neighbourhood is saved as the address city for Shipbubble. The real delivery price stays beneath the one-step form.

Out-of-area buyers get “Delivery is Lagos-only for now”, with Use a Lagos address and Notify me. Waitlist requests are rate limited, use the signed-in buyer’s contact, and deduplicate by buyer/state, including concurrent requests. Counts by state are available through the admin-only waitlist endpoint.

Seller Home shows one pickup banner, and Go Live directs the seller to fix the address before opening the camera checklist. Planning and listing remain available even before pickup setup. The server enforces the same policy on bids, Buy Now, auction orders, quotes, address saves and show starting, including when courier pricing is disabled or a show already has a delivery deposit. Existing paid orders and in-progress deliveries retain their fulfillment flow. Old location lookups and show picker code remain; settings control the supported area.

Render variable name:

- `SERVICE_STATES`

No new buyer/studio environment variables or credentials are required. After changing the API environment, restart it and refresh the apps.

Validation:

- Full server suite: 253 suites / 3,781 tests passed; final targeted money/quote/waitlist checks and an additional existing-paid-delivery case passed.
- Buyer/studio unit suites and production builds passed.
- Phone component flows, Watch regressions at four screen sizes, seller camera cleanup, and all three top-up methods with quoted deposits passed.
- Phone layouts have no horizontal overflow. The pickup banner action sits below its text to fit small screens.

How to check on staging:

1. A Lagos buyer should bid and buy normally, with a Shipbubble delivery price.
2. A buyer with an existing Abuja address should watch, chat and follow normally. Bid or Buy opens the Lagos-only sheet. Notify me adds one waitlist row; repeated requests keep one row. An admin can read state counts. Use a Lagos address should save the correction and refresh the delivery price without asking for the address again.
3. A seller with a non-Lagos pickup should see the Home banner and be unable to go live through the app or a direct start request. Listing and planning should still work. Fix pickup and retry.
4. Temporarily enable Lagos and Ogun in the setting on staging. Restart the API and refresh the apps. Confirm Ogun addresses, state pickers, quotes and buying/bidding work, then restore Lagos-only delivery.
5. Confirm an already-paid delivery can still be paid/booked/tracked after the setting changes.

Paul runs these staging checks after merge. Automated tests used invented data and mocked courier/payment responses; no accounts or live charges were created.

[Implementation and testing notes](https://github.com/pauljatau1/LiveCommerce/blob/feat/lagos-launch/docs/lagos-launch.md) · [Phone screenshot gallery](https://github.com/pauljatau1/LiveCommerce/blob/feat/lagos-launch/docs/screenshots/lagos-launch/index.html)

| New phone state | Screenshot |
| --- | --- |
| Buyer Delivery Price | ![buyer-delivery-price](https://github.com/pauljatau1/LiveCommerce/blob/feat/lagos-launch/docs/screenshots/lagos-launch/buyer-delivery-price.png?raw=true) |
| Buyer Lagos Address | ![buyer-lagos-address](https://github.com/pauljatau1/LiveCommerce/blob/feat/lagos-launch/docs/screenshots/lagos-launch/buyer-lagos-address.png?raw=true) |
| Buyer Live Delivery Label | ![buyer-live-delivery-label](https://github.com/pauljatau1/LiveCommerce/blob/feat/lagos-launch/docs/screenshots/lagos-launch/buyer-live-delivery-label.png?raw=true) |
| Buyer Outside Lagos | ![buyer-outside-lagos](https://github.com/pauljatau1/LiveCommerce/blob/feat/lagos-launch/docs/screenshots/lagos-launch/buyer-outside-lagos.png?raw=true) |
| Buyer Two States | ![buyer-two-states](https://github.com/pauljatau1/LiveCommerce/blob/feat/lagos-launch/docs/screenshots/lagos-launch/buyer-two-states.png?raw=true) |
| Buyer Updated Address | ![buyer-updated-address](https://github.com/pauljatau1/LiveCommerce/blob/feat/lagos-launch/docs/screenshots/lagos-launch/buyer-updated-address.png?raw=true) |
| Buyer Waitlist Saved | ![buyer-waitlist-saved](https://github.com/pauljatau1/LiveCommerce/blob/feat/lagos-launch/docs/screenshots/lagos-launch/buyer-waitlist-saved.png?raw=true) |
| Seller Go Live Blocked | ![seller-go-live-blocked](https://github.com/pauljatau1/LiveCommerce/blob/feat/lagos-launch/docs/screenshots/lagos-launch/seller-go-live-blocked.png?raw=true) |
| Seller Home Banner | ![seller-home-banner](https://github.com/pauljatau1/LiveCommerce/blob/feat/lagos-launch/docs/screenshots/lagos-launch/seller-home-banner.png?raw=true) |
| Seller Lagos Pickup | ![seller-lagos-pickup](https://github.com/pauljatau1/LiveCommerce/blob/feat/lagos-launch/docs/screenshots/lagos-launch/seller-lagos-pickup.png?raw=true) |
| Seller Two States | ![seller-two-states](https://github.com/pauljatau1/LiveCommerce/blob/feat/lagos-launch/docs/screenshots/lagos-launch/seller-two-states.png?raw=true) |

_Generated by [Codex](https://openai.com/codex/)_
