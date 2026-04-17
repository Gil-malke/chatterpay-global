# ChatterPay Global

## Overview

Full-stack web application where Kenyan users earn by chatting with verified international clients. Built with React + Vite frontend and Node.js/Express backend.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite, Tailwind CSS, shadcn/ui, wouter (routing), TanStack Query
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Auth**: JWT (bcryptjs + jsonwebtoken)
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Artifact

- `artifacts/chatterpay` — React + Vite web app at path `/`
- `artifacts/api-server` — Express API server at path `/api`

## User Roles

1. **Kenyan Users** — Register/Login, Deposit via M-Pesa, Buy contract, Chat, Earn USDT
2. **Foreign Clients** — Admin-created accounts only, can Login and Chat
3. **Admin** — Full control: create foreign accounts, assign clients, manage system

## Demo Accounts

- Admin: `admin` / `admin123`
- Kenyan User: `john_ke` / `user123` (has KSh 500, already assigned to james_us)
- Kenyan User: `mary_ke` / `user123`
- Foreign Client: `james_us` / `client123`
- Foreign Client: `sophie_uk` / `client123`

## Key Features

- M-Pesa STK Push deposit (simulated without credentials, real with MPESA_* env vars)
- Assignment system: Admin assigns foreign clients to Kenyan users
- Contract system: 24hr contract = KSh 200, max 5 foreign clients
- Real-time chat (polling every 3s), users earn 0.1 USDT per message
- Withdrawal requests (KSH or USDT), admin approval flow
- Notifications for key events

## Environment Variables Required for Real M-Pesa

- `MPESA_CONSUMER_KEY`
- `MPESA_CONSUMER_SECRET`
- `MPESA_SHORTCODE`
- `MPESA_PASSKEY`
- `MPESA_CALLBACK_URL`

## Architecture

- OpenAPI spec in `lib/api-spec/openapi.yaml`
- Generated hooks in `lib/api-client-react/src/generated/`
- Database schema in `lib/db/src/schema/`
- API routes in `artifacts/api-server/src/routes/`
- Frontend pages in `artifacts/chatterpay/src/pages/`
