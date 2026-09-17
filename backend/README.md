# SplitEase backend

NestJS + Prisma + PostgreSQL REST API for the SplitEase expense splitter.

## Setup

```bash
npm install

# create the database (adjust name/credentials to match your .env)
psql -U postgres -h localhost -c "CREATE DATABASE splitease;"

# generate Prisma client and run the first migration
npx prisma migrate dev --name init

npm run start:dev
```

Server runs on `http://localhost:4000` by default (see `.env`).

## Auth flow

1. `POST /auth/register` `{ email, password, name }` → returns `accessToken` + `refreshToken`
2. `POST /auth/login` `{ email, password }` → same
3. Send `Authorization: Bearer <accessToken>` on every protected route
4. When the access token expires (15 min by default), `POST /auth/refresh` `{ refreshToken }` for a new pair

## Endpoints

```
POST   /auth/register
POST   /auth/login
POST   /auth/refresh

POST   /groups                         { name }
GET    /groups                         # groups the current user belongs to
POST   /groups/:id/members             { email }

POST   /groups/:id/expenses            { description, amount, paidById, splitAmongUserIds } (or explicit `splits`)
GET    /groups/:id/expenses

GET    /groups/:id/balances            # net balance per member + a minimal settle-up plan
```

All `/groups/*` routes require a valid access token and group membership.

## Example: create an expense split evenly

```json
POST /groups/<groupId>/expenses
{
  "description": "Groceries",
  "amount": 60,
  "paidById": "<userId who paid>",
  "splitAmongUserIds": ["<userId1>", "<userId2>", "<userId3>"]
}
```

## Notes

- Passwords hashed with bcrypt (12 rounds).
- `/groups/:id/balances` returns both raw per-user net balances and a simplified settlement plan (minimum number of payments to zero everyone out).
- CORS is wide open in `main.ts` for local dev — restrict `app.enableCors()` to your actual web/mobile origins before deploying.