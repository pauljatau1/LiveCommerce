# LiveCommerce build update (9 Nov 2026)

The build brief for the final design, written to paste into Claude Code. It replaces the earlier "what's next" list in `docs/mvp-brief.md` and is the source of truth for the build. The design canvas for humans is https://claude.ai/artifact/36U4kh9KJVCDFg7277cFrV.

---

You are working on LiveCommerce (repo: pauljatau1/LiveCommerce), a live auction and drop app for selling clothes in Nigeria. The MVP has a seller studio (seller-web /studio), a buyer web app (buyer-web) and an API (server). A new design is final. Your job: review what already exists, then update it to match the design. Much of this is already built — do not rebuild what works.

## READ FIRST
- README.md, RELEASING.md, render.yaml
- seller-web/src/studio/ (and studio.css), buyer-web/src/ (pages/Watch.jsx, Home.jsx, Wallet.jsx, Orders.jsx, Auth.jsx, components/*, styles.css)
- server/src (bidding, buy now, wallet holds, Paystack, Shipbubble, Gemini, sockets, config/agenda.js bid timer, buyer follow + reviewSeller services)
- Design canvas for humans: https://claude.ai/artifact/36U4kh9KJVCDFg7277cFrV (if you can't open it, the spec below is enough)

## WORKING RULES
- Step 0 is a review. Before writing code, post a gap report: for each item below, say "already done", "partly done" (what's missing) or "not started", with file paths. Then work through the items in order.
- One PR per item below. Merge to main → test on staging (Render, Paystack test keys, Shipbubble sandbox) → next.
- Never delete old code. Switch features off (EXTRA_FEATURES, missing env keys) instead.
- Money paths stay atomic and verified on the server. Paystack amounts come from verification, never from the request.
- Plain-language errors. A staging-only test path for every external service.
- Mobile first at 390px wide, then desktop. Tap targets of at least 44px. Body text 16px on phones, nothing below 12px.

## DESIGN RULES (apply everywhere)
- Keep the existing tokens and fonts (Fredoka for prices, timers and big headings; Nunito for everything else). Add two tokens: primary-on-dark #A9E5C6 (bids on video) and warning-on-dark #FFC46B (timer on video).
- One screen, one job, one primary button. Green only for actions. Red only for LIVE and Go Live. Everything else neutral.
- Space, not boxes: remove most card borders, shadows and tinted backgrounds. At most 3 text sizes per screen. Badges only when state changes (You lead, Outbid, Sold).
- Movement only on state changes (new bid, timer under 10s, win). No confetti, streaks, points, giveaways or "watch to earn". No fake urgency: stock and timers are always real.
- Assistant voice: short and warm, offers ("Want me to…?") and never pushes. Every AI price says "estimate".
- Launch category is clothing. Categories: Women, Men, Thrift, Shoes, Bags, Accessories. Condition: New with tags / Thrift / Fairly used. "Original or replica".
- NO size fields, size pickers or size prompts anywhere. Size info lives only in the title or description, in the seller's words. No measurements on live screens. A drop is one item with a stock count.
- The wordmark "gbam" is a working name. Keep the brand name in one config value.

## ITEMS (in this order)

### 1. Shared styles and components
Apply the design rules to studio.css and buyer-web styles.css. Seller bottom bar: Home, Products, raised red round Go Live in the centre, Orders, Me. Desktop: a slim top bar with the same items and a red Go Live pill.

### 2. Buyer Watch, clean live style (Whatnot-like, minimal)
- Full-screen video with a dark fade at the top and bottom only.
- Top: host avatar, name, "★ 4.8 · ships in 1–2 days", green Follow, "LIVE 214".
- Text sits on the video with no bubbles or boxes. Chat line = small avatar, name in dimmed white, message in white; bids in primary-on-dark.
- Right side rail: More (audio only, pause video, report), Share (the phone's own share menu), Wallet (sheet rolls up from the bottom; the show keeps playing), Items (current item photo + count).
- Bottom: a "Say something…" outline field, then a state line ("You're winning" / "Chidi outbid you. Your ₦9,000 is back in your wallet." / "Sold · Chidi won"), then item photo, title, "9 bids · late bids add 5s", price (Fredoka 32), timer with "+5s" in warning-on-dark.
- Then a delivery estimate line ("Delivery to Lekki about ₦2,500 · one fee this show"), then "Bid more" (outline) next to a green "Bid ₦X / Held from your wallet".
- Every sheet over the video (Wallet, Items, Bid more, Show notes) starts with a mini bid bar: price, state, timer, Bid.
- States to cover: you lead, outbid, Buy Now drop ("Buy now · ₦18,000 / Paid from your wallet", "3 of 5 left · 2 sold"), sold, waiting for next item, reconnecting ("Your bid of ₦9,000 is safe"), paused / audio only. Plus desktop: video in the middle, items on the left, chat on the right.
- After losing an auction: "Not this one. Up next in a moment:" with the next item. Never a dead end.

### 3. "Custom" becomes "Bid more"
The existing custom bid sheet becomes +step chips (+₦500, +₦1,000, +₦2,000, +₦5,000), each showing the resulting amount. "We hold ₦X from your wallet. It comes back if someone outbids you." Confirm large jumps. Keep the existing step rules (₦500 under ₦10k, ₦1,000 under ₦50k, ₦2,500 above). No auto-bidding.

### 4. Watch without an account
The show link opens and plays without sign-up; chat works without an account (decide guest chat vs. read-only and say which). At the first bid, one sheet titled "One step, then your bid" collects:
- account (Google if keys are set, otherwise phone or email)
- delivery area and street, showing the estimate
- wallet top-up

One button: "Pay ₦10,000 and bid ₦9,000". The show keeps playing. The existing address sheet stays for changing the address later. Show link buttons: "Watch now" when live, "Add every Saturday to calendar" when upcoming.

### 5. Late-bid extension (server)
Any bid in the last 5 seconds resets the timer to 5 seconds. Emit it on the existing bid_timer_update socket. The timer must survive a server restart: the current in-process setTimeout in config/agenda.js does not, so move the state somewhere persistent. Also honour the seller's chosen auction time (30s / 60s / 2 min); today the server ignores it and the studio's +30s.

### 6. Live delivery estimate
Before and during a show, show the buyer a Shipbubble quote from the seller's pickup area to the buyer's area. Cache it per seller-area to buyer-area pair. The final quote still comes after the show; one fee per seller per show (keep the existing ₦3,000 first-item deposit logic unless the gap report shows a better fit, and explain).

### 7. Chat safety
Hide messages containing phone numbers or bank account numbers (and links). Show buyers a muted italic "1 message with a phone number was hidden". Show the seller "Hid 1 message with a phone number · Undo".

### 8. Show notes, a pinned announcement owned by the seller
- One note per show. It stays until the seller edits or removes it. 600 characters max. No links, phone or account numbers.
- Fixed sections, in this order: How to buy, Delivery, Payment and safety ("Never pay outside the app" is always included), Sizes and returns, From the seller.
- The assistant (Gemini) drafts it from the show plan and delivery settings in a planner step ("Pin these notes"), with "Use these notes for my next shows".
- During the show the seller edits it from Live studio ("Show notes pinned · Edit"). The assistant suggests additions when chat repeats a question ("4 people asked about delivery to Port Harcourt. Add it?").
- Buyer: one line under the host (pin icon + "Show notes · first line" + "More") that opens a sheet. On update: an "Updated" label, one soft pulse, and a chat line "Tolu updated the show notes".

### 9. Follow and ratings
- Wire the existing POST /follow/:sellerId to Follow on Watch, "You won" and "It's yours" (with "Live every Saturday at 7pm").
- Show the seller rating on Watch once a host has 5 or more ratings; before that show "New host".
- After delivery, the buyer rates with stars and chips (As shown live, Good quality, Well packed, Fast delivery), using the existing reviewSeller.

### 10. Weekly slots and calendar
- A seller can set a recurring slot.
- Buyers get a repeating calendar event: an .ics file plus a Google Calendar link.
- The seller recap ends with "Same time next week?" and one tap books the next slot; the assistant drafts the plan from unsold and new items.
- The recap also shows money on the way: "each order pays out 1 day after delivery", linking to Money.

### 11. Seller studio screens, applying the design rules to what exists
- **A · Getting started** (new studio onboarding replacing the old dashboard sign-up): Welcome, Your store, Pickup address, Get paid (Paystack account-name check), Finished, plus their loading, error and offline states.
- **Home** for a first-time seller, matching the current build's content and order: "Plan your next show", the assistant prompt, "List an item · Drop photos. I'll write it". Also a show-scheduled state and a focal card that changes with the seller's state.
- **Listing helper:** photos first, the draft as tappable rows, two AI questions (how many, original or replica), price with "(estimate)", "Also take bids", no size fields.
- **Show planner:** pick items, auction or drop, running order, auction time, show notes, promote.
- **Live studio**, same clean style as Watch: assistant prompts as plain text lines, plain chat, Up next, +30s, "End now · sell".
- **Also:** recap, orders and order detail, money and withdraw, Me, and a notifications screen (toasts + inbox).

## NOT IN SCOPE (leave switched off)
Clips/cloud recording, giveaways, card breaks, auto-bid, reactions, a full "All items" shop, push notifications, "Want this" alerts, a closet of past wins, "live now" WhatsApp messages, a sellers' regulars list, a private test show.

## DEFINITION OF DONE (each PR)
- Matches the spec above at 390px and on desktop, with every state (loading, empty, error, offline) handled in plain language.
- Server money and bid logic covered by tests, including late-bid extension, holds coming back on outbid, and restart recovery of the timer.
- Works on staging with two phones (one seller, one buyer) on Android Chrome and iOS Safari, including sound after the tap-to-unmute.
- The PR description lists what was already there, what changed, and any decision you made that I should confirm.
