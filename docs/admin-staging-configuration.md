# Admin staging configuration

Set `ADMIN_EMAILS` on the API server to a comma-separated list of authorized admin addresses. Empty or absent means no admin may sign in or register. Access is checked on every admin request; removing an address locks it out immediately.

Set `ALLOWED_ORIGINS` on the API to include the **exact staging admin origin** (scheme plus hostname and port if applicable), for example `https://admin-staging.example.com`. Keep any existing storefront and seller origins in the comma-separated value. The example hostname is illustrative, not a configured deployment.

Build the admin with `VITE_API_BASE_URL` set to the API root origin, and `VITE_APP_NAME=gbam`. Keep `APP_ENV=staging` on the staging API; **do not set `APP_ENV=production` in staging**, because staging-specific behavior such as `EMAIL_REDIRECT_TO` must remain enabled. Webhook simulation is enabled by default only when `APP_ENV=staging`; use `ENABLE_WEBHOOK_SIMULATION=false` to disable it there. `ENABLE_WEBHOOK_SIMULATION=true` enables it in a non-production local environment, but never overrides `APP_ENV=production`. The admin build should use `VITE_APP_ENV=staging` on staging and `VITE_APP_ENV=production` only for production UI builds. These Vite values do not change the API runtime environment. Set `VITE_CLASSIC_WITHDRAWALS=true` only to display the retained classic withdrawals UI instead of A1. Vite values are embedded at build time: rebuild after changing them.

The Docker image uses the Vite build output in Nginx; the `try_files` fallback serves `index.html` for client-side routes.

## Render (staging)

The admin is a Render static site (`livecommerce-admin`): root `admin`, build `npm ci && npm run build`, publish `dist`, rewrite `/*` to `/index.html`. Build settings: `VITE_API_BASE_URL=https://livecommerce-api-4s2b.onrender.com`, `VITE_APP_NAME=gbam`, `VITE_APP_ENV=staging`. Add the admin's address (`https://livecommerce-admin.onrender.com` or whatever Render assigns) to `ALLOWED_ORIGINS` on the API.

## Wallet changes

Manual wallet add/deduct (seller and buyer detail) needs a whole-naira amount and a reason of at least 5 characters, asks for confirmation, and writes an `AdminWalletAdjustment` record (who, when, amount, reason, balance before and after) in the same transaction as the change. Deductions never take a wallet below zero, and a buyer deduction only takes money that isn't held for bids.
