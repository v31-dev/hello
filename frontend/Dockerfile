FROM node:lts-alpine AS base

# install simple http server for serving static content
RUN npm install -g http-server

# make the 'app' folder the current working directory
WORKDIR /app

# copy both 'package.json' and 'package-lock.json' (if available)
COPY package*.json ./

# install project dependencies
RUN npm install

# copy project files and folders to the current working directory (i.e. 'app' folder)
COPY . .

ENV PORT 3000
EXPOSE 3000


################################################################################
# Local development
################################################################################
FROM base AS development

CMD [ "npm", "run", "dev"]
################################################################################


################################################################################
# Production build
################################################################################
FROM base AS production

ARG VITE_AUTH_URL
ARG VITE_AUTH_CLIENT_ID

ENV VITE_AUTH_URL=$VITE_AUTH_URL
ENV VITE_AUTH_CLIENT_ID=$VITE_AUTH_CLIENT_ID

RUN npm run build

CMD [ "http-server", "dist" ]
################################################################################