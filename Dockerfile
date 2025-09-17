# syntax=docker/dockerfile:1.6

ARG NODE_VERSION=20
ARG NPM_STRICT_SSL=true
ARG NODE_TLS_REJECT_UNAUTHORIZED=1

FROM node:${NODE_VERSION}-bookworm-slim AS base

ARG NPM_STRICT_SSL
ARG NODE_TLS_REJECT_UNAUTHORIZED

COPY docker/certs/ /tmp/custom-certs/

RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates curl wget \
 && CERTS="$(find /tmp/custom-certs -type f \( -name '*.pem' -o -name '*.crt' \))" \
 && if [ -n "$CERTS" ]; then \
      for cert in $CERTS; do \
        name=$(basename "${cert%.*}"); \
        cp "$cert" "/usr/local/share/ca-certificates/${name}.crt"; \
      done && update-ca-certificates; \
    fi \
 && apt-get clean && rm -rf /var/lib/apt/lists/*

ENV NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt \
    SSL_CERT_FILE=/etc/ssl/certs/ca-certificates.crt \
    NEXT_TELEMETRY_DISABLED=1 \
    PNPM_HOME=/pnpm \
    npm_config_strict-ssl=${NPM_STRICT_SSL} \
    NODE_TLS_REJECT_UNAUTHORIZED=${NODE_TLS_REJECT_UNAUTHORIZED} \
    PATH=${PNPM_HOME}:${PATH}

RUN corepack enable

WORKDIR /app

FROM base AS deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* ./

RUN pnpm install --frozen-lockfile --prod=false

FROM deps AS builder

ENV NODE_ENV=production

COPY . .

RUN pnpm prisma generate
RUN pnpm build

FROM base AS runner

ENV NODE_ENV=production \
    PORT=3000

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/next-env.d.ts ./next-env.d.ts
COPY --from=builder /app/next-auth.d.ts ./next-auth.d.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next

EXPOSE 3000

CMD ["pnpm", "start"]
