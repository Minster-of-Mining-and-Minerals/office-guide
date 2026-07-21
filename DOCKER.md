# Docker setup

The Compose stack runs PostgreSQL, the Express API, the standalone Next.js
application, and nginx. nginx is the only service published to the host.

## Start locally

```bash
cp .env.example .env
docker compose up --build -d
docker compose ps
```

Open `http://localhost:3000`. Database migrations run automatically whenever the
backend container starts. PostgreSQL data and announcement uploads are kept in
named Docker volumes.

The seeders intentionally do not run automatically because they reset floors,
offices, permissions, roles, and users. For a new installation, review the
`SEED_ADMIN_*` values in `.env`, then run:

```bash
docker compose exec backend npm run seed
```

This creates all six floors, loads the bundled 90-office directory from the
merged JSON, and creates the configured administrator with all permissions.

The seed command is destructive and is intended for first-time setup or an
explicit reset. It must not be run against a database whose existing content
needs to be preserved.

## Production configuration

Set `PUBLIC_URL` to the externally reachable origin (without a trailing slash),
replace `JWT_SECRET` and `AUTH_SECRET` with long random values, and use a strong
database password. TLS can be terminated by a host reverse proxy or added to
the nginx service with mounted certificates, following the website project's
deployment pattern.

## Useful commands

```bash
docker compose logs -f
docker compose down
docker compose down -v  # also deletes database and uploaded-media volumes
```

The last command permanently deletes local Docker-managed application data.
