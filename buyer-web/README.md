# buyer-web

The fan-facing web app: open a show link, watch, chat, bid, Buy Now, top up the wallet, see orders.

- `npm install`, then `npm run dev` (http://localhost:5175)
- Settings (Render static site → Environment):
  - `VITE_API_BASE_URL`: the API server
  - `VITE_PAYSTACK_PUBLIC_KEY`: Paystack **public** key (`pk_test_…` / `pk_live_…`)
- The API must list this site's address in `ALLOWED_ORIGINS`.

Styles come from the Claude Design canvas tokens (`src/styles.css`, same as the seller studio).
