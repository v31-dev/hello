# Hello Chat

A chat application using Node.js, Vue 3, Socket.io, and Redis with OpenID Connect authentication.
There is no message persistence implemented.

## Architecture

**Docker Compose Services:**
- **frontend** - Vue 3 application with Vuetify UI framework
- **backend** - Express.js server with Socket.io for real-time chat
- **nginx** - Reverse proxy routing frontend and backend from a single origin
- **redis** - Redis adapter for Socket.io pub/sub to relay messages across backend instances

**External Services:**
- **OIDC Provider** - Any OpenID Connect provider (e.g., Pocket ID, Auth0, Okta) for authentication

## Authentication

This application uses **OpenID Connect (OIDC)** for authentication. By default, it's configured for [Pocket ID](https://github.com/pocket-id/pocket-id) but can easily be switched to any OIDC provider.

### Setting up Authentication

1. Create an OIDC application in your provider (e.g., Pocket ID)
2. Set the **callback URI** to: `http://localhost/callback` (or your production domain)
3. Set the **post-logout redirect URI** to: `http://localhost/` (or your production domain)
4. Update `.env` with your credentials.

## Local Development

### Prerequisites
- Docker and Docker Compose installed
- A `.devcontainer` configuration is available as well.
- `.env` file configured using `sample.env`

### Running the App

```bash
docker compose up --build
```

The application will be available at `http://localhost`. Access is routed through Nginx, which sits in front of both the frontend and backend components.

### Development Features

- **Backend hot-reload** - Changes trigger auto-restart
- **Frontend hot-reload** - Vue components hot-reload without restart (via Vite)

The local `docker-compose.yml` is only for development - it includes Redis, Nginx, and all dependencies for convenience.

## Production Deployment

### Building the Production Image

The production deployment uses a single optimized Dockerfile that:
1. Builds the frontend static files (Vue 3 with Vite)
2. Serves both backend API and frontend static files from a single Node.js process
3. No nginx required - backend serves everything on port 4000

Build and run:

```bash
# Build with OIDC credentials
docker build \
  --build-arg VITE_AUTH_URL=your-oidc-provider-url \
  --build-arg VITE_AUTH_CLIENT_ID=your-client-id \
  -t hello-chat:latest \
  .

# Run in production
docker run -d \
  -p 4000:4000 \
  -e REDIS_URL=redis://default:password@redis-host:6379 \
  -e AUTH_URL=your-oidc-provider-url \
  -e AUTH_CLIENT_ID=your-client-id \
  hello-chat:latest
```

### External Dependencies

1. Your own OIDC provider
2. A Redis instance

### Deploying to Dokploy

1. Add a service of type Application and point to the repository using the Git provider with build type Dockerfile.
2. Add **Build Arguments** in the Environment tab:
   - `VITE_AUTH_URL` - Your OIDC provider URL
   - `VITE_AUTH_CLIENT_ID` - Your OIDC client ID
3. Set **Environment Variables** in the Environment tab:
   - `REDIS_URL` - Full Redis connection string (e.g., `redis://user:pass@host:6379`)
   - `AUTH_URL` - OIDC provider base URL
   - `AUTH_CLIENT_ID` - OIDC client ID
4. Map a domain to port 4000.
5. Deploy