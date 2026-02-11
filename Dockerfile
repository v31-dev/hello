# ==============================================================================
# Stage 1: Build Frontend
# ==============================================================================
FROM node:lts-alpine AS build-frontend

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./
RUN npm ci

# Copy frontend source
COPY frontend/ ./

# Build frontend (requires build args)
ARG VITE_AUTH_URL
ARG VITE_AUTH_CLIENT_ID
ENV VITE_AUTH_URL=$VITE_AUTH_URL
ENV VITE_AUTH_CLIENT_ID=$VITE_AUTH_CLIENT_ID
RUN npm run build


# ==============================================================================
# Stage 2: Production - Backend + Built Frontend
# ==============================================================================
FROM node:lts-alpine

WORKDIR /app

# Copy backend package files
COPY backend/package*.json ./
RUN npm ci --omit=dev

# Copy backend source
COPY backend/ ./

# Copy built frontend from build stage
COPY --from=build-frontend /app/frontend/dist ./public

ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000

CMD ["node", "index.js"]
