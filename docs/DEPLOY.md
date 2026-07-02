# Deployment Guide

Deploy the three runtime components separately. All services need the env vars from `.env.example`.

## 1. Postgres (Neon)

1. Create a Neon project and enable the **pgvector** extension.
2. Run the migration SQL:

```bash
psql "$DATABASE_URL" -f packages/db/drizzle/0000_init.sql
pnpm db:seed
```

Ensure `OPENAI_API_KEY` is set when seeding so demo FAQ content is embedded.

## 2. Redis (Upstash)

Create an Upstash Redis database and set `REDIS_URL`.

## 3. API (Fly.io)

From `apps/api`:

```bash
fly launch --no-deploy
fly secrets set DATABASE_URL=... REDIS_URL=... JWT_SECRET=... OPENAI_API_KEY=... WIDGET_API_KEY=... CORS_ORIGINS=https://your-web-domain
fly deploy
```

Health check: `https://your-api.fly.dev/health`

## 4. Worker (Fly.io second process)

Deploy the same Docker image with a different command:

```bash
fly scale count worker=1
# or run a second Fly app with:
# CMD ["pnpm", "--filter", "@cx/api", "start:worker"]
```

Set the same secrets as the API.

## 5. Web (Vercel)

Import the repo in Vercel and set:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | Your Fly API URL |
| `NEXT_PUBLIC_WIDGET_API_KEY` | Same as `WIDGET_API_KEY` |

Root directory: `apps/web`

After deploy, update `README.md` live demo links and pin the repo on your GitHub profile.

## Post-deploy checklist

- [ ] Sign in at `/login` with seeded admin credentials
- [ ] Open `/demo` and verify widget chat + order lookup (`ORD-1001`)
- [ ] Confirm documents show status `ready` in admin
- [ ] Run `pnpm eval` against production DB (optional quality check)
