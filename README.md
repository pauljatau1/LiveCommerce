# LiveCommerce

A post-Auqli build: a live commerce platform rebuilt from the Auqli V1 codebase.

## Structure

| Folder | What it is | Stack |
|---|---|---|
| `server/` | Backend API (auth, products, orders, payments, livestreams) | Node.js, Express, MongoDB |
| `seller-web/` | Seller dashboard and livestream studio | React, Vite, Tailwind |
| `admin/` | Admin panel | React, TypeScript, Vite |
| `mobile/` | Buyer mobile app | React Native, Expo |

Each folder keeps its full original git history (Nov 2024 to Apr 2026). Unmerged feature branches from the original repos are preserved under `archive/<project>/...`.

## Secrets

All `.env` files, certificates, Firebase configs and hard-coded keys were removed from the history during import and replaced with `REDACTED` where they appeared in code. Every credential from the old Auqli setup should be treated as exposed and rotated before anything goes live. New secrets go in local `.env` files, which are git-ignored; use the `.env.example` files as templates.
