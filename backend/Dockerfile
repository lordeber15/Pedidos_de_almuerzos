# syntax=docker/dockerfile:1

# Imágenes base fijadas a versiones exactas para builds reproducibles.
# Deben compartir versión de Alpine: el binario de Node se copia de una a otra.
ARG NODE_IMAGE=node:20.20.2-alpine3.23
ARG ALPINE_IMAGE=alpine:3.23.4

# Imagen oficial de Node: de aquí sale el binario `node` para el runtime.
FROM ${NODE_IMAGE} AS node

# ---------------------------------------------------------------------------
# deps: solo dependencias de producción. Va primero y depende únicamente de
# package*.json, así que cambiar el código no invalida esta capa.
# ---------------------------------------------------------------------------
FROM node AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev --no-audit --no-fund

# ---------------------------------------------------------------------------
# test: corre la suite de tests. No forma parte de la imagen final; se usa con
#   docker build --target test ./backend
# ---------------------------------------------------------------------------
FROM deps AS test
COPY src ./src
COPY test ./test
RUN npm test

# ---------------------------------------------------------------------------
# runtime: Alpine limpio + el binario de Node + node_modules + el código.
# Sin npm, npx ni yarn (la app se ejecuta con `node` directamente): menos
# peso y menos superficie de ataque. Borrarlos de la imagen de Node no
# serviría, porque seguirían en sus capas; por eso se parte de Alpine.
# ---------------------------------------------------------------------------
FROM ${ALPINE_IMAGE} AS runtime

ENV NODE_ENV=production

# libstdc++ es la única librería que el binario de Node necesita en Alpine.
# Se crea el usuario sin privilegios `node` (mismo uid que la imagen oficial).
RUN apk add --no-cache libstdc++ \
    && addgroup -g 1000 node \
    && adduser -u 1000 -G node -s /bin/sh -D node

COPY --from=node /usr/local/bin/node /usr/local/bin/node

WORKDIR /app

# Archivos de solo lectura para la app: pertenecen a root y el proceso corre
# como `node`, que no puede modificarlos.
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src

USER node

EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=5s --start-period=15s --retries=5 \
  CMD wget -qO- http://127.0.0.1:3000/health > /dev/null || exit 1

CMD ["node", "src/server.js"]
