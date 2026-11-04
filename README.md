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

## Running the server

Requires Node.js 24 and a MongoDB database (a free MongoDB Atlas cluster works).

```bash
cd server
cp .env.example .env   # fill in MONGODB_URI, JWT_SECRET, SESSION_SECRET at minimum
npm ci
npm run dev
```

The server starts with only the three core settings. On startup it logs each feature (Agora, Paystack, Shipbubble, Gemini, Termii, S3, show recording) as on or off, depending on which settings are present. `GET /health` reports uptime and database state.

Tests: `npm test` (uses an in-memory MongoDB, no accounts needed).

Docker: `docker build -t livecommerce-server server/` builds the production image (Node 24, non-root).

## Secrets

All `.env` files, certificates, Firebase configs and hard-coded keys were removed from the history during import and replaced with `REDACTED` where they appeared in code. Every credential from the old Auqli setup should be treated as exposed and rotated before anything goes live. New secrets go in local `.env` files, which are git-ignored; use the `.env.example` files as templates.
