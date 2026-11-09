# LiveCommerce MVP brief

Worked out from the repo (`pauljatau1/LiveCommerce`, PRs #1–#22, 3–8 Nov 2026), updated 9 Nov 2026 with the build update. Paste this into a new chat to pick up where the work stopped.

## The MVP in one line
A live auction and drop show for **selling clothes** in Nigeria (working name **gbam**). A seller goes live from a web studio, buyers open a share link and watch without an account, bid or Buy Now from a prepaid wallet, and each buyer's items ship as one package after the show.

## Build update (9 Nov 2026): what changed
The design is final and the next build is set out in **`docs/build-update.md`**. That file is the source of truth for Claude Code: 11 items, one PR each, starting with a gap report. In short:
- **Launch category is now clothing** (Women, Men, Thrift, Shoes, Bags, Accessories). The anime and gaming categories from the seed are replaced. Condition: New with tags / Thrift / Fairly used, plus "Original or replica". **No size fields anywhere.** Size lives in the seller's own title or description.
- **Brand:** "gbam" is the working name, kept in one config value.
- **Minimal live style:** space, not boxes; green only for actions, red only for LIVE. Two new tokens: primary-on-dark #A9E5C6 and warning-on-dark #FFC46B.
- **Buyer:** a Whatnot-style full-screen Watch; "Bid more" step chips replace custom bids; watching needs no account, and the first bid opens one sheet for account, address and top-up; a live delivery estimate is shown during the show.
- **Server:** late bids add 5s, the bid timer survives a restart, and the seller's chosen auction time (30s / 60s / 2 min) is honoured.
- **New features:** chat safety (hides phone numbers, account numbers and links), seller show notes drafted by the AI, Follow and ratings, weekly slots with calendar invites, and studio onboarding (Getting started) plus a notifications screen.
- **Still out of scope:** clips, giveaways, auto-bid, reactions, push notifications, and the other items listed in the build update.

## The core loop (everything in the MVP serves this)
1. **List:** the seller snaps 1–5 photos. Gemini drafts the title, category, condition, price estimate and weight. The seller confirms quantity, original or replica, and price, then publishes. No size fields.
2. **Plan:** the seller picks items, chooses auction or drop (Buy Now) for each, sets the running order, starting bids and time, then shares the link (WhatsApp, X, Instagram, etc.).
3. **Go live:** the studio runs a camera/mic check, then Agora host video. The seller sees an item card with a timer and top bid (or a stock bar), plus an up-next queue and chat.
4. **Buy:** a buyer opens the link and watches without an account. At the first bid, one sheet handles sign-up, delivery address and wallet top-up (Paystack). Buyers bid (late bids add 5s) or tap Buy Now. Bids place atomic wallet holds. The first item takes a ₦3,000 delivery deposit, and outbid buyers are told and see the hold released.
5. **End and deliver:** each buyer gets one Shipbubble quote for everything they won in the show, charged from the wallet (short wallets get "Pay delivery"). The seller books the pickup, and the status moves through Picked up → On the way → Delivered.
6. **Get paid:** the seller is credited one day after delivery and withdraws from the Money tab.

## In scope

| Part | Role in the MVP |
|---|---|
| `server/` | Core API. Auth, products, live streams, bidding, Buy Now, wallet, Paystack, Shipbubble, Gemini, `/api/v2/studio` |
| `seller-web/` `/studio` | **The** seller app (Home, Products, Listing Agent, Planner, Go Live, Live, Recap, Orders/Deliveries, Money, Me) |
| `buyer-web/` | **The** buyer app (Watch, Auth, Wallet, Orders) |
| `admin/` | Minimal: seeded first admin, login only |

## Kept but switched off (code stays, nothing deleted)
- **Server routes not mounted** unless listed in `EXTRA_FEATURES`: blips (short video), posts, messaging, coupons, flash sales, email campaigns, referrals, returns, user listings.
- **Optional services, off unless keys are set:** Agora cloud recording/auto-clips, Termii SMS, Google/Apple sign-in, Firebase.
- **`mobile/` (Expo app):** not used. `buyer-web` replaced it for the MVP.
- **Classic seller dashboard:** still reachable, but `/studio` is the default.
- **Old feature branches:** kept under `archive/<project>/...`.

## Status (8 Nov 2026)
- Staging runs on Render (API, Studio, Shop) with Paystack test keys and the Shipbubble sandbox. Merging into `main` deploys it.
- Production is not built yet. The plan is in `RELEASING.md`: a `production` branch, a new Atlas project, a new R2 bucket and live keys.

## What's left before launch
0. Build the 11 items in `docs/build-update.md`, one PR each.
1. Run the full staging checklist in `RELEASING.md` end to end with two phones.
2. Confirm viewers hear sound on Android and iOS Chrome (the tap-to-unmute fix has shipped; `?debug=1` helps check).
3. Rotate every old Auqli credential.
4. Set up production per `RELEASING.md`, then promote `main` → `production`.
5. Housekeeping: add `buyer-web` to the root README, and add the studio and shop to `render.yaml`.

## Rules the build has followed
- Never delete old code. Switch features off (`EXTRA_FEATURES`, missing env keys).
- Money paths are atomic and verified server-side. Paystack amounts come from verification, never from the request.
- Use plain-language errors for sellers and keep a staging-only test path for every external service.
- One PR per feature: merge to `main`, test on staging, then promote.
