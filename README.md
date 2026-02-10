# Hello Chat

A simple Docker Compose chat application using NodeJS, Vue 3, Socket.io and Redis with OpenID Connect authentication.
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

**Note:** The `openid profile email groups` scopes are requested, and the `groups` claim is used to determine user roles in the application.

## Local Development

### Prerequisites
- Docker and Docker Compose installed
- A `.devcontainer` configuration is available as well.
- `.env` file configured using `sample.env`

### Running the App

```bash
docker compose up --build
```

The application will be available at `http://localhost:80`. Access is routed through Nginx, which sits in front of both the frontend and backend components.

### Development Features

- **Backend hot-reload** - Changes trigger auto-restart
- **Frontend hot-reload** - Vue components hot-reload without restart (via Vite)

The `docker-compose.override.yml` file enables these features automatically.

## Production Deployment

For production, remove the override file:
```bash
docker compose -f docker-compose.yml up --build
```

Ensure the required environment variables from `sample.env` are set in your production environment.
