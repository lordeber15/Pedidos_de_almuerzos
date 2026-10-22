# syntax=docker/dockerfile:1

# Imágenes base fijadas a versiones exactas para builds reproducibles.
ARG NODE_IMAGE=node:20.20.2-alpine3.23
# nginx sin privilegios: corre como usuario no root y escucha en el 8080.
ARG NGINX_IMAGE=nginxinc/nginx-unprivileged:1.31.7-alpine

# ---------------------------------------------------------------------------
# deps: dependencias (incluye las de desarrollo: Vite las necesita para el
# build). Depende solo de package*.json, así que se reutiliza entre builds.
# ---------------------------------------------------------------------------
FROM ${NODE_IMAGE} AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --no-audit --no-fund

# ---------------------------------------------------------------------------
# build: genera la SPA estática en /app/dist.
# ---------------------------------------------------------------------------
FROM deps AS build
# Vite inyecta VITE_API_URL en tiempo de BUILD, no en runtime.
# Se pasa como --build-arg desde docker-compose (tomado de BACKEND_URL).
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}
COPY index.html vite.config.js ./
COPY src ./src
RUN npm run build

# ---------------------------------------------------------------------------
# runtime: solo nginx y los archivos estáticos; nada de Node ni node_modules.
# ---------------------------------------------------------------------------
FROM ${NGINX_IMAGE} AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/healthz > /dev/null || exit 1
