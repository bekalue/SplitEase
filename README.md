# 💸 SplitEase

**Split group expenses. Settle up with the fewest payments possible.**

SplitEase is a shared-expense tracker for roommates, trips, and group bills — a full-stack monorepo spanning a REST API, a web client, and a mobile client, all backed by a single PostgreSQL database.

[![Node](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10-E0234E?logo=nestjs&logoColor=white)](https://nestjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14%2B-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![Flutter](https://img.shields.io/badge/Flutter-3-02569B?logo=flutter&logoColor=white)](https://flutter.dev/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](#license)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Monorepo Structure](#monorepo-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [How Balances Are Calculated](#how-balances-are-calculated)
- [Engineering Practices](#engineering-practices)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

Splitting shared costs is a tedious, easy-to-get-wrong problem — who paid for groceries, who owes for the hotel, who still hasn't paid back last month's rent. SplitEase solves it with three simple concepts:

1. **Groups** — a roommate household, a trip, any set of people sharing costs
2. **Expenses** — logged by whoever paid, split evenly or custom among members
3. **Balances** — SplitEase computes exactly who owes whom, and simplifies it down to the *minimum number of payments* needed to settle the group

## Features

- 🔐 **Secure auth** — JWT access + refresh tokens, bcrypt-hashed passwords
- 👥 **Groups** — create groups, invite members by email
- 🧾 **Flexible expense splitting** — equal splits or custom per-person amounts
- ⚖️ **Smart settle-up** — greedy debt-simplification algorithm minimizes the number of payments required
- 📱 **Multi-client** — one API serving both web (Next.js) and mobile (Flutter)
- ✅ **Input validation** — every request validated and whitelisted at the API boundary
- 📄 **Interactive API docs** — Swagger/OpenAPI available at `/api/docs`
- 🩺 **Health checks** — `/health` endpoint for uptime monitors and orchestrators
- 🛡️ **Hardened by default** — Helmet security headers, rate limiting, CORS allowlist
- 🧪 **Tested** — unit and e2e test suites, run automatically in CI
- 🐳 **Containerized** — Docker + Docker Compose for one-command local environments
- 🔄 **CI/CD** — GitHub Actions pipeline: lint, test, build on every PR

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js, NestJS, TypeScript |
| ORM | Prisma |
| Database | PostgreSQL |
| Auth | JWT (access + refresh tokens), bcrypt |
| Web client | Next.js (React) |
| Mobile client | Flutter |
| API docs | Swagger / OpenAPI (`@nestjs/swagger`) |
| Logging | Pino (structured JSON logs) |
| Testing | Jest (unit), Supertest (e2e) |
| CI/CD | GitHub Actions |
| Containers | Docker, Docker Compose |
| Hosting (suggested) | Vercel (web) · Railway/Render (API) · Neon/Railway (Postgres) |

## Architecture

```
┌─────────────────────┐     ┌─────────────────────┐
│  Flutter mobile app  │     │   Next.js web app    │
│   iOS & Android       │     │  React, SSR           │
└───────────┬──────────┘     └──────────┬──────────┘
            │                            │
            └──────────────┬─────────────┘
                            ▼
                ┌───────────────────────┐
                │    REST API server     │
                │   Node.js + NestJS      │
                │  Helmet · rate limit ·  │
                │   Swagger · health      │
                └───────────┬────────────┘
                            │
              ┌─────────────┴─────────────┐
              ▼                            ▼
   ┌─────────────────────┐    ┌─────────────────────┐
   │ PostgreSQL database  │    │    Auth service       │
   │ users, groups,        │    │  JWT + refresh tokens  │
   │ expenses, splits      │    │                        │
   └─────────────────────┘    └─────────────────────┘
```

Both clients talk to the same REST API over HTTPS. The API is stateless — all session state lives in the JWT — so it scales horizontally without sticky sessions.

## Monorepo Structure

```
splitease/
├── backend/              # NestJS + Prisma + PostgreSQL REST API
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   ├── prisma/        # PrismaService (DB connection)
│   │   ├── auth/           # register, login, refresh, JWT strategy + guard
│   │   ├── groups/          # create/list groups, add members
│   │   ├── expenses/         # log expenses, equal or custom splits
│   │   ├── balances/          # net-balance + settle-up algorithm
│   │   └── health/             # /health endpoint
│   ├── test/               # e2e tests (Supertest)
│   ├── prisma/schema.prisma
│   ├── Dockerfile
│   ├── .env.example
│   └── package.json
│
├── frontend-web/         # Next.js web client
│   ├── app/                # routes (App Router)
│   ├── components/
│   ├── lib/                # API client, auth helpers
│   ├── .env.example
│   └── package.json
│
├── frontend-mobile/      # Flutter mobile client
│   ├── lib/
│   │   ├── main.dart
│   │   ├── models/
│   │   ├── screens/
│   │   ├── services/       # API client, auth storage
│   │   └── widgets/
│   ├── pubspec.yaml
│   └── .env.example
│
├── docker-compose.yml    # spins up backend + Postgres together
├── .github/
│   └── workflows/
│       └── ci.yml          # lint, test, build on every PR
└── README.md              # you are here
```

Each package (`backend`, `frontend-web`, `frontend-mobile`) has its own `package.json`/`pubspec.yaml`, dependencies, and env file. This isn't a strict npm-workspaces/Turborepo setup by default, but the structure is workspace-ready if you want to add one later (see [Roadmap](#roadmap)).

## Getting Started

### Prerequisites

- Node.js 18+
- Flutter SDK 3+ (for the mobile client)
- PostgreSQL 14+ (or Docker, see below)
- Docker + Docker Compose (optional, recommended for local dev)

### Option A — Docker Compose (fastest)

From the repo root:

```bash
docker compose up --build
```

This starts PostgreSQL and the backend API together, with the schema auto-migrated on boot.

### Option B — Run natively

```bash
cd backend
npm install

psql -U postgres -h localhost -c "CREATE DATABASE splitease;"
cp .env.example .env   # fill in real values

npx prisma migrate dev --name init
npm run start:dev
```

The API runs at `http://localhost:4000`. Interactive docs at `http://localhost:4000/api/docs`.

### Web client

```bash
cd frontend-web
npm install
cp .env.example .env.local   # set NEXT_PUBLIC_API_URL
npm run dev
```

### Mobile client

```bash
cd frontend-mobile
flutter pub get
flutter run
```

### Quick API test

```bash
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"password123","name":"Alice"}'
```

## Environment Variables

**`backend/.env`**

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string. Special characters in the password (like `#`) must be percent-encoded. | `postgresql://user:pass@localhost:5432/splitease` |
| `JWT_SECRET` | Signing secret for access tokens | a long random string |
| `JWT_EXPIRES_IN` | Access token lifetime | `15m` |
| `JWT_REFRESH_SECRET` | Signing secret for refresh tokens (must differ from `JWT_SECRET`) | a different long random string |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token lifetime | `7d` |
| `PORT` | Port the API listens on | `4000` |
| `CORS_ORIGINS` | Comma-separated allowlist of client origins | `http://localhost:3000,https://splitease.app` |
| `RATE_LIMIT_MAX` | Max requests per window per IP | `100` |

**`frontend-web/.env.local`**

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL of the backend API |

**`frontend-mobile/.env`**

| Variable | Description |
|---|---|
| `API_URL` | Base URL of the backend API |

See each package's `.env.example` for a template. **Never commit real `.env` files.**

## Database Schema

```
User ──< GroupMember >── Group
  │                          │
  │                          └──< Expense >── ExpenseSplit >── User
  └───────────────────────────────< Expense (paidBy)
```

- **User** — account credentials and profile
- **Group** — a set of people sharing expenses
- **GroupMember** — join table linking users to groups
- **Expense** — a single cost, tied to the group and the user who paid
- **ExpenseSplit** — how much each user owes for a given expense

Full definitions live in [`backend/prisma/schema.prisma`](./backend/prisma/schema.prisma).

## API Reference

All `/groups/*` routes require `Authorization: Bearer <accessToken>` and group membership. Full interactive documentation is generated automatically and served at `/api/docs`.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Liveness/readiness check |
| `POST` | `/auth/register` | Create an account |
| `POST` | `/auth/login` | Log in, receive tokens |
| `POST` | `/auth/refresh` | Exchange a refresh token for a new pair |
| `POST` | `/groups` | Create a group |
| `GET` | `/groups` | List the current user's groups |
| `POST` | `/groups/:id/members` | Add a member by email |
| `POST` | `/groups/:id/expenses` | Log an expense (equal or custom split) |
| `GET` | `/groups/:id/expenses` | List a group's expenses |
| `GET` | `/groups/:id/balances` | Net balances + simplified settle-up plan |

**Example: log an expense split evenly across three people**

```json
POST /groups/<groupId>/expenses
{
  "description": "Groceries",
  "amount": 60,
  "paidById": "<userId who paid>",
  "splitAmongUserIds": ["<userId1>", "<userId2>", "<userId3>"]
}
```

## How Balances Are Calculated

For each group, SplitEase:

1. Sums what each member **paid** across all expenses
2. Subtracts what each member **owes** based on their splits
3. Nets these into a single balance per person (positive = owed money, negative = owes money)
4. Runs a **greedy debt-simplification** pass: repeatedly matches the largest creditor with the largest debtor until everyone nets to zero

This means a group of 6 people with dozens of shared expenses might settle in as few as 2–3 payments, instead of everyone paying everyone individually.

## Engineering Practices

- **Testing** — unit tests per service (`*.spec.ts`) plus end-to-end tests against a real test database (`backend/test/`). Run with `npm run test` and `npm run test:e2e`.
- **CI/CD** — every PR runs lint, type-check, unit tests, and e2e tests via GitHub Actions (`.github/workflows/ci.yml`) before merge is allowed.
- **Linting & formatting** — ESLint + Prettier, enforced pre-commit via Husky + lint-staged so bad formatting never reaches `main`.
- **Conventional commits** — commit messages follow `feat:`, `fix:`, `chore:`, etc., enabling automated changelogs.
- **API documentation** — Swagger/OpenAPI generated directly from NestJS decorators, always in sync with the actual code.
- **Structured logging** — JSON logs via Pino, ready to ship to a log aggregator (Datadog, Grafana Loki, etc.) in production.
- **Security headers & rate limiting** — Helmet middleware and per-IP rate limiting on by default.
- **Containerized environments** — `Dockerfile` per app, `docker-compose.yml` for local orchestration; the same images are deployable to any container platform.
- **Environment parity** — `.env.example` in every package documents required config so "works on my machine" issues are minimized.

## Roadmap

- [ ] npm workspaces / Turborepo for shared TypeScript types between `backend` and `frontend-web`
- [ ] Push notifications on new expenses / settle-up
- [ ] Recurring expenses (rent, subscriptions)
- [ ] Multi-currency support
- [ ] Expense categories and spending insights
- [ ] Real-time balance updates (WebSockets)
- [ ] Error monitoring integration (Sentry)

## Contributing

Issues and pull requests are welcome. Please open an issue to discuss significant changes before submitting a PR. All PRs must pass CI (lint, tests, build) before merge.

## License

MIT — see [`LICENSE`](./LICENSE) for details.