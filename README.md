# MoM Digital Signage

Bilingual digital signage and office wayfinding for Ethiopia's Ministry of
Mining. The public kiosk displays an English/Amharic office guide and media
announcements, while the protected administration interface manages floors,
offices, announcements, appearance, users, roles, and permissions.

## Technology

- Next.js 16, React 19, TypeScript, Redux Toolkit, and Tailwind CSS
- Express 5, Sequelize, PostgreSQL, JWT, and Socket.IO
- Docker Compose and nginx

## Requirements

For the recommended setup, install:

- Git
- Docker Engine or Docker Desktop
- Docker Compose v2 (`docker compose`, not the legacy `docker-compose`)

Confirm the tools are available:

```bash
git --version
docker --version
docker compose version
```

## First-time setup with Docker

### 1. Clone the repository

```bash
git clone https://github.com/Minster-of-Mining-and-Minerals/office-guide.git
cd office-guide
```

### 2. Create the local environment file

```bash
cp .env.example .env
```

Open `.env` and review its values. At minimum, replace these values before a
shared or production deployment:

```dotenv
DB_PASSWORD=choose-a-strong-database-password
JWT_SECRET=choose-a-long-random-jwt-secret
AUTH_SECRET=choose-a-different-long-random-auth-secret
SEED_ADMIN_PASSWORD=choose-a-strong-initial-admin-password
```

Random secrets can be generated with:

```bash
openssl rand -base64 48
```

The default local address is controlled by these matching values:

```dotenv
PUBLIC_URL=http://localhost:3000
HTTP_PORT=3000
```

If port 3000 is already occupied, change both values to the same free port,
for example `PUBLIC_URL=http://localhost:3001` and `HTTP_PORT=3001`.

### 3. Build and start the application

```bash
docker compose up --build -d
```

The backend automatically runs pending database migrations before it starts.
Wait until the database, backend, and frontend report `healthy`:

```bash
docker compose ps
```

If a service does not become healthy, inspect its logs:

```bash
docker compose logs --tail=200 db backend frontend nginx
```

### 4. Seed the initial data

Review the `SEED_ADMIN_*` values in `.env`, then run:

```bash
docker compose exec backend npm run seed
```

This creates:

- Six building floors
- The bundled 90-office directory covering Ground through 5th floor
- User types and permissions
- Administrative roles
- The initial Super Admin account configured in `.env`

The default development credentials are:

```text
Email: admin@gmail.com
Password: password
```

Change the default password before seeding a shared environment.

> **Warning:** The seed command resets floors, offices, users, roles, and
> permissions. Run it only for first-time setup or when an explicit data reset
> is intended.

### 5. Open the application

- Public kiosk: <http://localhost:3000/>
- Admin login: <http://localhost:3000/login>
- Admin dashboard: <http://localhost:3000/dashboard>
- Floor-specific kiosk: `http://localhost:3000/floor/<floor-number>`

nginx is the public entry point. It serves the frontend and routes API,
authentication, uploaded media, and Socket.IO traffic to the correct internal
container. The frontend's internal port 3000 and backend's internal port 4000
are intentionally not published directly.

## Docker services and persistent data

| Service | Purpose | Host access |
| --- | --- | --- |
| `nginx` | Public reverse proxy | `localhost:3000` by default |
| `frontend` | Standalone Next.js application | Internal only |
| `backend` | Express API and Socket.IO | Internal only |
| `db` | PostgreSQL 16 | Internal only |

PostgreSQL data and announcement uploads are stored in named Docker volumes.
They survive ordinary container rebuilds and `docker compose down`.

## Common commands

Start the existing containers:

```bash
docker compose up -d
```

Rebuild after code or public environment changes:

```bash
docker compose up --build -d
```

Follow all logs:

```bash
docker compose logs -f
```

Follow one service:

```bash
docker compose logs -f backend
```

Run pending migrations manually:

```bash
docker compose exec backend npm run migrate
```

Stop the stack while preserving data:

```bash
docker compose down
```

Update a checkout and rebuild:

```bash
git pull
docker compose up --build -d
```

## Completely reset the local installation

The following command deletes the local Docker database and uploaded media:

```bash
docker compose down -v
```

Afterward, rebuild and seed again:

```bash
docker compose up --build -d
docker compose exec backend npm run seed
```

## Office seed dataset

The floor-and-office seeder reads the single bundled file
`backend/seeders/all-floor-offices.json`. It contains all 90 offices across
Ground through 5th floor. Multiple offices may share a physical room; both
first-floor offices assigned to room 109 are preserved as separate records.

## Running without Docker

Docker is recommended. For manual development, install Node.js 22 and
PostgreSQL, then create a PostgreSQL database named `digital_signage_db`.

Backend:

```bash
cd backend
cp .env.example .env
npm ci
npm run migrate
npm run seed
npm run dev
```

Ensure the backend `.env` points to the local PostgreSQL instance. The backend
runs at `http://localhost:4000` by default.

In a second terminal, create `frontend/.env.local` with:

```dotenv
NEXT_PUBLIC_BASE_URL=http://localhost:4000/api
AUTH_BACKEND_URL=http://localhost:4000/api
AUTH_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000
AUTH_SECRET=replace-with-a-long-random-secret
NEXTAUTH_SECRET=replace-with-the-same-long-random-secret
```

Then start the frontend:

```bash
cd frontend
npm ci
npm run dev
```

## Troubleshooting

### `localhost:3000` does not open

Check the published nginx port and service health:

```bash
docker compose ps
```

The nginx row should include `0.0.0.0:3000->80/tcp`. If `.env` uses another
`HTTP_PORT`, open that port instead and ensure `PUBLIC_URL` matches it.

### Docker daemon permission denied

Start Docker Desktop or the Docker service. On Linux, ensure your user has
permission to access the Docker daemon, then log out and back in after changing
Docker group membership.

### Environment changes are not reflected in the browser

`NEXT_PUBLIC_*` variables are embedded during the frontend image build. Rebuild
instead of only restarting:

```bash
docker compose up --build -d frontend nginx
```

### Database credentials changed after first startup

PostgreSQL initialization variables apply only when its data volume is first
created. Either restore the previous credentials or, if local data may be
discarded, perform the complete reset described above.

## Additional documentation

- [Product direction](PRODUCT.md)
- [Design system](DESIGN.md)
- [Docker notes](DOCKER.md)
