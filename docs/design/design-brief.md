# LiveCommerce design brief

Source: Claude Design canvas "[brand] Live Shopping — 3 Directions" (https://claude.ai/artifact/3X9Mrspfc9BfEoih35kabY), read 9 Nov 2026. Companion to `livecommerce-mvp-brief.md`.

> **Superseded in part (9 Nov 2026):** the final design is the canvas at https://claude.ai/artifact/36U4kh9KJVCDFg7277cFrV, and its build rules are in `livecommerce-build-update.md`. Where the two disagree, the build update wins. The main differences are a minimal live style (space, not boxes; no tinted cards), clothing instead of collectibles, no size fields, the working name "gbam", and two new tokens (primary-on-dark #A9E5C6, warning-on-dark #FFC46B). Tokens, fonts and voice below still apply.

## Where the design lives
- **Full canvas exports (HTML, open in a browser):** on Paul's Mac in `Downloads/Livecommerce Build/Livecommerce design`. "Seller Live Shopping — 3 Directions (2).html" has the seller studio (46 frames); "[brand] Live Shopping — 3 Directions.html" has the buyer app (13 frames). They are too large for this project.
- **Screen text, frame by frame (in this project):** `design/livecommerce-screens-seller.md` and `design/livecommerce-screens-buyer.md`.
- **Not exported yet:** the "3 directions" page. Its notes are summarised below.

## Directions explored
- **A: Sticker Bomb.** Bold and playful.
- **B: Night Lobby.** A sleek, dark creator tool.
- **C: Group Chat.** Clean and warm. **This is the chosen direction, and both apps are built on it.**

## Direction C principles
- **Idea:** selling feels like texting a friend who knows the market. The AI agent is the conversation, and everything else stays calm.
- **Type:** Fredoka for headings, numbers and prices people read at a glance; Nunito for everything else. Nothing goes below 12px, and body text never goes below 16px on phones.
- **Scale:** display 32, h1 24, h2 19 (Fredoka); body 16, small 14, caption 12/800 (Nunito).
- **Colour:** white and warm off-white, with soft mint, lilac and peach tints. Deep green is used for every primary action.
- **Brand name style:** friendly Naija slang in lowercase (e.g. "paddy"). The logo is a rounded wordmark with a speech-bubble dot. The brand is still `[brand]` and no name has been picked.
- **Shape:** cards 24 radius, inputs 16, pills with 44px minimum height.
- **Assistant voice:** short and warm, one idea per message. It offers and never pushes ("Want me to…?"). It drafts, then the seller confirms, and every suggestion has Edit or Undo. Any AI price says "estimate". No hype words and no exclamation spam.

## Colour tokens (all in `studio.css`; every text pairing passes 4.5:1)

| Token | Value | Soft tint |
|---|---|---|
| primary (actions) | #10734F | #E3F4EA |
| accent (tags, shows) | #5A45C2 | #EFEAFE |
| warm (shows, schedules) | #7A3A0E | #FFF0E3 |
| live (LIVE badge, Go Live) | #D6304A | |
| surface / surface-page | #FFFFFF / #FBF8F4 | |
| surface-sunken (inputs) | #F4EFE8 | |
| border | #EEE7DE | |
| text / text-muted | #1D2A24 / #5B6660 | |
| success | #1D7A3E | #E2F3E8 |
| warning | #8A5200 | #FFF1D6 |
| danger | #C42B43 | #FCE8EB |

## Canvas pages and screens

**Seller studio**
- **Foundations:** tokens and shared components
- **A, Getting started:** Welcome, Your store, Pickup address, Get paid, Finish, plus loading, error and offline states
- **B, Home:** focal card that changes with seller state; empty, loading and offline states; desktop version
- **C, Listing Agent:** Start, Thinking, Draft, Publish, Edit all, AI unavailable; desktop version
- **D, Products:** list, detail, empty, loading and offline states
- **E, Show Planner:** pick items, AI running order, preview, schedule, empty, loading and error states; desktop version
- **F–G, Go live and Live Studio:** pre-show check, camera blocked, live, item card (ready, sold, no bids), reconnecting, viewer list; desktop version
- **H–K:** show recap, Orders (list, detail, empty, desktop), Money (withdraw, empty), Me, notifications and toasts

**Buyer app**
- **Join, home, wallet, orders:** show preview, quick sign-up, Home, Wallet, Orders, order detail
- **Watch:** watch, Outbid / Buy Now, waiting and reconnecting, desktop watch
- **Sheets and confirmations:** custom bid, delivery address, "You won"

## Match against the code (9 Nov)
- Tokens, fonts and Direction C are implemented in `seller-web/src/studio/studio.css` and `buyer-web/src/styles.css`.
- Studio sections B–K and the buyer screens are built (PRs #8, #12, #16, #21, #22).
- **Not yet in the new studio:**
  - **A, Getting started:** sign-up still uses the old dashboard pages.
  - **Notifications screen:** live-show toasts exist, but there is no notifications screen.
- **Brand:** "gbam" is the working name (kept in one config value).
