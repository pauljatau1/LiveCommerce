# Environments and releases

## Staging (now)

Everything currently on Render is **staging**: test keys and test data only.

| Part | Render service | URL |
|---|---|---|
| API | livecommerce-api-staging | https://livecommerce-api-4s2b.onrender.com |
| Seller studio | livecommerce-studio-staging | https://livecommerce-studio.onrender.com |
| Buyer shop | livecommerce-shop-staging | https://livecommerce-shop.onrender.com |
| Database | Atlas project LiveCommerce, Cluster0, db `livecommerce` | |

Staging settings:
- API: `APP_ENV=staging`; Paystack **test** keys; Shipbubble **sandbox** key (`sb_sandbox_…`), test webhook URL `…/api/webhooks/shipbubble`.
- Studio and shop: `VITE_APP_ENV=staging` (red "STAGING · test money" badge).
- Shipbubble sandbox only: Studio → Deliveries shows "Test courier" buttons for booked packages.

Merging a PR into `main` deploys staging automatically.

## Production (when we launch)

A separate copy that never shares data or keys with staging:
- New Render services (API on the $7/month plan so it doesn't sleep; studio and shop can stay free), deploying from the **`production`** branch, not `main`.
- New Atlas project + free cluster, database user, and network access limited to the production API's outbound IPs.
- New R2 bucket.
- Live keys only: Paystack live, Shipbubble `sb_prod_…` with the live webhook URL, Agora, Gemini.
- `APP_ENV=production` on the API; `VITE_APP_ENV` left unset (or `production`) on the sites.

## Releasing

1. Merge PRs into `main` → staging deploys.
2. Test on staging (checklist below).
3. Promote: open a PR from `main` into `production` and merge it. Only then does production change.
4. If something breaks in production, revert that merge on `production`.

## Staging checklist before promoting

- Sign up as a buyer; top up the wallet with a Paystack test card.
- Host a show from the studio; video and sound reach a phone.
- Auction: bid, outbid alert, win; wallet hold and charge are right.
- Buy Now: stock counter drops, deposit held on first buy only.
- End the show: Studio opens Deliveries; each buyer's package is priced and paid.
- Book pickup; tap Picked up → On the way → Delivered; the buyer's Orders page follows.
