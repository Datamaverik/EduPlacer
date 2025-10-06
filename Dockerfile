FROM node:20-alpine

# install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

RUN apk add --no-cache postgresql-client

WORKDIR /usr/app

# copy package metadata first for efficient caching
COPY package.json pnpm-lock.yaml ./

# install deps
RUN pnpm install --frozen-lockfile

# copy rest
COPY . .
# Ensure entrypoint script is copied (explicit) so chmod step won't fail
COPY app/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

# make entrypoint executable
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3000

# default command is the entrypoint which will run migrations then start the app
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]