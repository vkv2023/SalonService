# Java to TypeScript Conversion (Parallel Path)

This folder provides a TypeScript conversion starter for your Java services using PostgreSQL on Neon.

## What is converted

- User service routes: `/api/users/**` and auth compatibility routes under `/api/auth/**`
- Salon service routes: `/api/salons/**`
- Category service routes: `/api/categories/**`
- Service-offering routes: `/api/service_offering/**` and `/api/service-offering/salon-owner/**`
- Booking routes: `/api/bookings/**`
- Payment routes: `/api/payments/**`

The app runs one service at a time using `SERVICE_NAME`, so it can be deployed as independent microservices using the same codebase/image pattern.

## Setup

1. Copy `.env.example` to `.env`.
2. Set `DATABASE_URL` to your Neon Postgres URL.
3. Set `CLERK_PUBLISHABLE_KEY`, `CLERK_ISSUER`, and `CLERK_AUDIENCE` for Clerk mode.
4. Install dependencies:

```bash
npm install
```

5. Generate Prisma client and create schema in Neon:

```bash
npm run prisma:generate
npm run prisma:migrate -- --name init
```

6. Start a service (example: user service on port 5001):

```bash
set SERVICE_NAME=user
set PORT=5001
npm run dev
```

For PowerShell:

```powershell
$env:SERVICE_NAME="user"
$env:PORT="5001"
npm run dev
```

To launch and open the sign-in page directly on Windows CMD:

```bash
npm run dev:signin
```

Sign-in page URL:

```text
http://localhost:5001/sign-in
```

### Browser note for Clerk sign-in

- Preferred: run sign-in in a normal browser (Chrome/Edge/Firefox).
- Some embedded browsers (for example VS Code integrated browser) may block Clerk SDK scripts.
- If Clerk SDK cannot load, the page uses a fallback flow:
  - Redirect to Clerk using your `CLERK_ISSUER`
  - Return to `/sign-in` with a Clerk token in URL params
  - Exchange that token with backend `/api/auth/login`
- In fallback mode, complete sign-in first, then return to `/sign-in` to finish app session sync.

## Service names

- `user`
- `salon`
- `category`
- `service-offering`
- `booking`
- `payment`

## Clerk replacement path

- Services now validate Clerk JWT directly (Authorization: Bearer token).
- User identity is linked in Neon via `user.clerkId`.
- Role checks still use your existing roles: CUSTOMER, ADMIN, SALON_OWNER.
- The browser sign-in page tries Clerk JS first and falls back to redirect-token mode if Clerk SDK cannot be loaded.
- After Clerk auth returns to `/sign-in`, the page syncs the authenticated user into the backend profile table.
- The page stores the app login payload in `localStorage` under `salonAuth` after successful login.

### Required auth env

- `AUTH_MODE`: clerk | legacy | hybrid
- `CLERK_PUBLISHABLE_KEY`
- `CLERK_ISSUER` (or `CLERK_ISSUER_URL`)
- `CLERK_AUDIENCE`
- `CLERK_JWKS_URL` (optional; auto-derived from issuer if omitted)

### Auth endpoint behavior

- `POST /api/auth/signup`
  - Requires Clerk Bearer token.
  - Creates or links local user with `clerkId`.
  - Returns local profile metadata (no placeholder JWT).
- `POST /api/auth/login`
  - Requires Clerk Bearer token.
  - Resolves local user by `clerkId` (or email fallback for first link).
  - Returns local profile metadata.
- `GET /api/auth/access-token/refresh-token/:refreshToken`
  - Deprecated, returns 410 (Clerk SDK manages token refresh).

## Rollout without breaking existing Java apps

1. Keep Java services running as current production baseline.
2. Deploy one TypeScript service in parallel.
3. Shift specific gateway route(s) to the TypeScript service.
4. Compare behavior and data for those routes.
5. Roll back route instantly if needed.

This supports zero-downtime migration while preserving current functionality.
