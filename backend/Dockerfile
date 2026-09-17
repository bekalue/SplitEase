# ---- Build stage ----
FROM node:20-alpine AS build

WORKDIR /app/backend

COPY package*.json ./
COPY prisma ./prisma

RUN npm ci

COPY . .

RUN npx prisma generate
RUN npm run build

# ---- Runtime stage ----
FROM node:20-alpine AS runtime

ENV NODE_ENV=production

WORKDIR /app/backend

COPY package*.json ./
COPY prisma ./prisma

RUN npm ci --omit=dev

COPY --from=build /app/backend/dist ./dist
COPY --from=build /app/backend/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/backend/node_modules/@prisma ./node_modules/@prisma

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
