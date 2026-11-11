# Launch delivery area

The launch setting is `SERVICE_STATES`, a comma-separated list. With the setting absent, delivery is limited to Lagos. Names are compared without case differences, extra spaces or a trailing “State”. Adding another state to the setting opens it without a code change. Restart/redeploy the API after changing its environment and refresh the apps to fetch the updated configuration.

The server owns the allowed states and the Lagos area data. Public `/api/v2/watch/config` exposes both; existing watch summaries and studio onboarding summaries also carry the configuration. Both apps use those settings. The Lagos file lists all 20 LGAs with common neighbourhood names for native area search; the chosen neighbourhood is saved in `city`, not just its LGA. Additional states use the existing Nigerian city lookup.

A single supported state is locked in the address forms. Multiple supported states become a picker. The shared buyer address fields cover AddressSheet, signup and the one-step bidding sheet. The existing typed Shipbubble quote remains underneath the one-step form. Changing a saved delivery address updates and activates the existing address instead of adding a duplicate home address; its existing address type is retained.

Watching, chatting, sharing and following have no service-area gate. A saved out-of-area address opens the delivery-area sheet when a buyer chooses Bid or Buy. Notify me records the signed-in buyer’s existing email/phone and requested state. The app makes no account or location requirement just to watch.

The socket bid handler emits `bid_error` with `out_of_area`. Buy Now returns reason `out_of_area`. Real quote/deposit checks run even when Shipbubble pricing is disabled or a delivery already exists for the show. Order services also validate freshly read addresses inside the transaction so a refusal rolls back stock and wallet changes. Auction refusals release the winner’s existing hold. The older REST bid entry is checked too.

Seller Home shows one pickup banner. Go Live is gated before mounting the camera checklist; planning and listing retain their existing behavior. Pickup setup uses the same server-owned state/area options. The start-show endpoint and pickup/address save endpoints reject unsupported states. Existing incomplete profile settings can still be saved; an incomplete pickup cannot go live. Existing orders, delivery payment, booking, cancellation and tracking do not gain new service-area restrictions.

Delivery copy on show cards, under the host and in share text follows the supported states. At launch this reads “Lagos delivery”; it updates when the setting changes.

## Waitlist

- `POST /api/v2/watch/waitlist`: authenticated buyer, `{ state, streamId }`, limited to 10 requests per minute per IP. The contact comes from the authenticated profile, not a client-supplied buyer ID.
- `GET /api/v2/watch/waitlist/counts`: admin only; counts grouped by normalized state, most requested first.
- A unique partial index enforces one record per buyer/state, including concurrent requests. Names are normalized before upsert. The collection is `DeliveryWaitlist` in the application model registry.

## Render environment variable

- `SERVICE_STATES`

No new app environment variables or credentials are needed.

## How to check on staging

1. With the default service area, sign in as a buyer whose delivery address is in Lagos. Open a live show, check the Shipbubble price, place a bid and confirm the normal wallet hold. Check Buy Now too.
2. Use a buyer with an existing Abuja address. Confirm the show still plays and chat/follow/share work. Tap Bid or Buy: “Delivery is Lagos-only for now” should open. Choose Notify me, then confirm one waitlist row and the admin state count. Repeating Notify me must not create a second row. Choose Use a Lagos address, save a neighbourhood/street/phone, and confirm the price refreshes and bidding works without asking for the address again.
3. Use a seller with a non-Lagos pickup address. Home should show the pickup banner; Go Live and a direct start-show request should refuse with the same plain message. Listing and planning should still work. Update pickup to a Lagos neighbourhood and confirm Go Live becomes available.
4. Set the service area to Lagos and Ogun on staging. Restart the API and refresh both apps. Confirm both states appear, Ogun addresses can be saved, a Lagos/Ogun buyer/seller pairing can obtain a quote and bid/buy, and share/delivery text reflects both states. Restore the Lagos-only setting afterwards.
5. Confirm an order paid before the setting changed can still pay delivery, book pickup and track normally.

No staging accounts were created and no credentials were requested. Automated checks use invented contacts and mocked courier responses. Paul runs the staging checks after merge.

## Screenshots and checks

See [phone gallery](screenshots/lagos-launch/index.html) for the buyer address, delivery price, outside-area sheet, waitlist success, two-state picker, seller pickup, Home banner and blocked Go Live states.

Validation completed locally:

- Full server run: 253 suites / 3,781 tests passed. The additional existing-paid-delivery case and final money/quote route changes were checked in targeted suites afterwards.
- Buyer and studio unit suites passed (7 and 21 tests); both production builds passed.
- Eleven phone states captured, with no horizontal overflow. The seller pickup action was moved below the banner text after inspecting the phone capture.
- Buyer Watch regressions passed at 320, 375, 390 and 1280px. Seller media checks confirmed camera/microphone release on show end and failed microphone setup.
- The top-up browser suite passed for saved card, bank transfer and popup payments, including a bid plus quoted delivery deposit and saving an address only once.

The browser checks also confirm that an out-of-area seller can reach listing and planning before completing pickup setup, and that correcting a buyer address preserves its type and activates it without adding a second address.
