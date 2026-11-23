# Admin staging configuration

Set `ADMIN_EMAILS` on the API server to a comma-separated list of authorized admin addresses. Empty or absent means no admin may sign in or register. Access is checked on every admin request; removing an address locks it out immediately.

Set `ALLOWED_ORIGINS` on the API to include the **exact staging admin origin** (scheme plus hostname and port if applicable), for example `https://admin-staging.example.com`. Keep any existing storefront and seller origins in the comma-separated value. The example hostname is illustrative, not a configured deployment.

Build the admin with `VITE_API_BASE_URL` set to the API root origin, and `VITE_APP_NAME=gbam`. Set `VITE_APP_ENV=production` in production admin builds to remove the simulation controls; the API independently refuses those requests when `APP_ENV=production`. Set `VITE_CLASSIC_WITHDRAWALS=true` only to display the retained classic withdrawals UI instead of A1. Vite values are embedded at build time: rebuild after changing them.

The Docker image uses the Vite build output in Nginx; the `try_files` fallback serves `index.html` for client-side routes.

No deployment or browser validation is implied by these instructions.
