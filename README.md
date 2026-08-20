# Minister of Mines Office Guide

A comprehensive web application for managing and navigating the Ministry of Mines office directory, including features for office details, signage, announcements, and more.

## Tech Stack
- **Frontend**: Next.js, React, Tailwind CSS
- **Backend**: Node.js, Express, Sequelize (ORM)
- **Database**: PostgreSQL
- **Web Server**: Nginx (Reverse Proxy)
- **Containerization**: Docker & Docker Compose

## Prerequisites
Before you begin, ensure you have the following installed on your system:
- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)
- Git

---

## 🚀 Setup & Deployment Instructions (Docker)

This is the recommended way to run the application for both production and consistent development environments.

### 1. Clone the Repository
```bash
git clone <your-repository-url>
cd office-guide
```

### 2. Configure Environment Variables
Ensure you have a `.env` file in the root directory of the project. This file configures the database, frontend/backend URLs, and authentication secrets.

If you don't have one, create a `.env` file and populate it with the necessary variables based on `docker-compose.yml` (e.g., `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET`, `AUTH_SECRET`, etc.).

### 3. Build and Start the Containers
Run the following command in the root directory to build the images and start all services in detached mode:
```bash
docker compose up -d --build
```
*This command starts the PostgreSQL database, Backend API, Frontend app, and Nginx proxy.*

### 4. Database Migrations
Once the containers are up and running, you need to set up the database tables. Run the migration command inside the backend container:
```bash
docker compose exec backend npm run migrate
```

### 5. Seeding Data
To populate the database with initial required data, run the general seed command:
```bash
docker compose exec backend npm run seed
```

**Seeding Office Directory Data:**
To specifically seed the bilingual office directory data (floors and offices) from the JSON seeder file, you can use the npm script:
```bash
docker compose exec backend npm run seed:offices
```

Alternatively, you can run the node script directly inside the container:
```bash
docker compose exec backend node scripts/seed-offices.js
```

### 6. Accessing the Application
By default, Nginx is configured to map to port `8082` on the host machine.
- **Frontend App:** `http://localhost:8082` (or your server's IP, e.g., `http://10.0.71.61:8082`)
- **Backend API:** `http://localhost:8082/api`

### 7. Per-Floor Signage & Kiosks
The application supports assigning independent content to specific floors.

**Accessing Floor Kiosks:**
To open a kiosk for a specific floor, navigate to the `/floor/[number]` route:
- Floor 1 Kiosk: `http://localhost:8082/floor/1` (or your server IP)
- Floor 2 Kiosk: `http://localhost:8082/floor/2`

**Display Modes:**
From the Admin Dashboard's **Appearance** tab, you can assign different display modes for each floor independently:
- **Office Guide only:** Shows the floor's directory.
- **Announcements only:** Shows a full-screen carousel of uploaded media.
- **Both:** Alternates between the guide and announcements on a timer.

**Announcements:**
When creating announcements in the dashboard, you can assign them to a specific floor or set them as "Global". 
- **Global** announcements appear on every floor's kiosk.
- **Floor-specific** announcements will ONLY appear on that exact floor's kiosk.

---

## 💻 Local Development (Without Docker)

If you prefer to run the application directly on your host machine for development purposes, you will need [Node.js](https://nodejs.org/) installed and a running PostgreSQL instance.

### Backend Setup
1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your `.env` file inside the `backend` directory with your local database credentials.
4. Run migrations and seed data:
   ```bash
   npm run migrate
   npm run seed
   npm run seed:offices
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```
   *The backend will run on port 4001.*

### Frontend Setup
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Ensure you have a `.env` file in the `frontend` directory pointing to the local backend (e.g., `NEXT_PUBLIC_BASE_URL=http://localhost:4001/api`).
4. Start the development server:
   ```bash
   npm run dev
   ```
   *The frontend will run on port 3001.*

---

## 🛠️ Useful Docker Commands

- **View Logs:**
  ```bash
  # All services
  docker compose logs -f
  
  # Specific service (e.g., backend)
  docker compose logs -f backend
  ```

- **Stop Services:**
  ```bash
  docker compose stop
  ```

- **Tear Down Services (Removes containers and networks):**
  ```bash
  docker compose down
  ```

- **Tear Down & Remove Data (WARNING: Deletes database volumes):**
  ```bash
  docker compose down -v
  ```
