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
3. Install dependencies:

```bash
npm install
```

4. Generate Prisma client and create schema in Neon:

```bash
npm run prisma:generate
npm run prisma:migrate -- --name init
```

5. Start a service (example: user service on port 5001):

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

### Required auth env

- `AUTH_MODE`: clerk | legacy | hybrid
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
