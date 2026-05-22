# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

This workspace contains a restaurant ERP system with three sub-projects:

| Directory | Description |
|---|---|
| `erp-restaurante/` | NestJS + Prisma backend (TypeScript) |
| `epicurean-frontend/` | React 19 + Vite + TypeScript frontend |
| `SIstemaRestayrente/` | Original static HTML prototype (reference only, being migrated) |

---

## Backend — `erp-restaurante/`

### Commands

```bash
# Development (watch mode)
npm run dev

# Build
npm run build

# Lint (auto-fix)
npm run lint

# Unit tests (jest, all *.spec.ts under src/)
npm run test

# Single test file
npx jest src/product/product.controller.spec.ts

# Test coverage
npm run test:cov

# E2E tests
npm run test:e2e

# Database migrations
npx prisma migrate dev --name <migration_name>
npx prisma migrate deploy           # apply to existing DB
npx prisma studio                   # GUI browser for the DB
npx ts-node prisma/seed.ts          # seed data

# Docker (Postgres + app together)
docker-compose up -d
```

### Environment

Copy `.env` for local dev — it already contains working defaults for Docker Compose:
- `DATABASE_URL` — points to `localhost:5432` (change `localhost` → `db` when running inside Docker)
- `PORT=3000`
- `JWT_SECRET` — replace before any non-dev deployment
- `CORS_ORIGIN` — comma-separated list of allowed frontend origins

### Architecture

The backend follows a layered pattern per module:

```
controller  →  useCase  →  repository  →  Prisma
```

Every domain feature lives in its own NestJS module under `src/<domain>/`. Each module typically contains:
- `<domain>.controller.ts` — HTTP handlers, guards, Swagger decorators
- `useCases/<domain>.usecase.ts` — business logic
- `repository/<domain>.repository.ts` — Prisma queries
- `dto/` — `class-validator` DTOs
- `domain/` — pure validators / domain helpers (no framework dependencies)

**Auth**: JWT via `@nestjs/jwt`. The `AuthGuard` verifies the token and attaches the payload to `request.user`. The `RolesGuard` + `@Roles(...)` decorator enforces role-based access. Roles defined in the Prisma schema: `GERENTE`, `BALCONISTA`, `GARCOM` — there is **no COZINHA or CLIENTE role** in the database.

**Swagger**: available at `http://localhost:3000/api` when the server is running.

### Prisma schema highlights

- `User` — `GERENTE | BALCONISTA | GARCOM` roles
- `Product` — inventory items with unit measurement, quantities, optional supplier
- `Supplier` — linked to products via `Product_supplier` join table and directly via `Product.id_supplier`
- `Purchase` / `Purchase_items` — incoming stock entries; `hash` field ensures idempotent submissions
- `Recipe_Dish` / `Dish` — menu dishes and their ingredient breakdown (technical sheet)
- `Setting` — singleton row (`id = "singleton"`) for restaurant-wide config
- `Log` — audit log entries
- **Tables and orders have no Prisma model yet** — those features are fully mocked in the frontend

---

## Frontend — `epicurean-frontend/`

### Commands

```bash
# Development server (port 5173, proxies /api → backend :3000)
npm run dev

# Type-check + production build
npm run build

# Preview production build
npm run preview

# Lint
npm run lint
```

### Architecture

**Routing** (`src/App.tsx`): React Router v7. Routes are role-gated via `<PrivateRoute allow={[roles]}>`:

| Path | Role(s) required |
|---|---|
| `/login` | public |
| `/cardapio` | public (customer menu) |
| `/balcao` | BALCONISTA |
| `/admin` | GERENTE |
| `/garcom` | GARCOM, GERENTE |
| `/cozinha` | GERENTE (no dedicated backend role exists) |

**State management** — three React Context providers in `src/store/`:
- `AuthProvider` — JWT token + user, persisted to `localStorage` under keys `epicurean_token` / `epicurean_user`
- `OrderProvider` — tables and orders fully mocked in `localStorage` (`epicurean_mock_tables`, `epicurean_mock_orders`); cross-tab sync via `StorageEvent`
- `NotifProvider` — toast notifications

**API layer** (`src/services/api.ts`): a single axios instance with:
- `baseURL` defaulting to `/api` (proxied in dev, override with `VITE_API_URL` in prod)
- Request interceptor: injects `Authorization: Bearer <token>`
- Response interceptor: clears auth and redirects to `/login` on 401 (only when a token was present, so public pages are unaffected)

Each domain has a service file in `src/services/` that calls the backend. All shared TypeScript types are in `src/types/index.ts`.

### Known backend gaps that force frontend mocks

- **Tables & orders**: no backend model exists; `OrderProvider` is the source of truth, stored in `localStorage`.
- **Public menu route**: `GET /recipe-dish` requires `GERENTE` or `BALCONISTA` auth. The `Garcom` page and `/cardapio` fall back to `src/lib/mockMenu.ts` when the request fails.
- **COZINHA role**: no such role exists in the DB; the Cozinha page is currently accessible only by `GERENTE`.
