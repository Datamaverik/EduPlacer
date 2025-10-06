## Getting Started

docker compose up --build -d
docker compose exec app pnpm exec prisma migrate reset --force --skip-seed

## Quick start (commands only)

Run these commands to get a developer environment up quickly:

```bash
# clone
git clone https://github.com/<your-username>/edu-placer.git
cd edu-placer

# (install Node 18+ and pnpm if you don't have them)
# https://nodejs.org/ and https://pnpm.io/

# install dependencies
pnpm install

# start local stack (build images and run containers)
docker compose up --build -d
```

If you need to completely reset the Postgres data (destructive):

```bash
docker compose down -v
docker compose up --build -d
docker compose exec app pnpm exec prisma migrate reset --force --skip-seed
```

## Run locally without Docker

1. Ensure you have a Postgres database running and set `DATABASE_URL` in your `.env` pointing at that DB (example: `postgresql://postgres:postgres@localhost:5432/eduplacer?schema=public`).
2. Install dependencies

pnpm install

3. Generate Prisma client and apply migrations

pnpm exec prisma generate
pnpm exec prisma migrate deploy

4. Run dev server

pnpm run dev

## Prisma

- Schema: `prisma/schema.prisma`
- Generated client: `node_modules/.prisma/client` (imported from `lib/prisma.ts`)

Common commands:

- Generate client: `pnpm exec prisma generate`
- Create a migration (dev): `pnpm exec prisma migrate dev --name <name>`
- Reset DB (dev, destructive): `pnpm exec prisma migrate reset --force --skip-seed`

## Environment variables

See `.env.example`. Key variables used by the app:

## Common Issues

- Port 5432 already in use: Another Postgres is running on your machine. Either stop it or change the host mapping in `docker-compose.yml`.
- Entrypoint overwritten by bind-mount: The Dockerfile copies the entrypoint to `/usr/local/bin` so it won't be hidden by the project bind-mount during development. If you change the entrypoint, ensure it stays outside the bind-mounted directory.
- Disk full when building images: check `docker system df` and consider `docker system prune -a --volumes` (destructive for images/containers/volumes not in use).
