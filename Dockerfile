FROM node:22-alpine AS build

# Habilitamos Corepack para tener pnpm disponible de forma nativa e inmediata
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

RUN pnpm prune --prod --config.ignore-scripts=true

FROM node:22-alpine
WORKDIR /app

ENV NODE_ENV=production

COPY package.json ./

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/main"]