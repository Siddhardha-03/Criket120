# Cricket Platform

Responsive full-stack web application for tracking cricket matches across upcoming, live, and completed states. The platform exposes a REST API powered by Node.js, Express, and MySQL, and a React frontend styled with Bootstrap 5 for fluid layouts across desktop, tablet, and mobile devices.

## Features

- Match listing segmented by status with search and filtering
- Detailed match view including scores, venue, winner, and player of the match
- Live match ticker sourced from an open-source Cricket API with Cricbuzz scraping fallback (auto-refreshing)
- RESTful API for CRUD operations on matches
- Responsive UI built with Bootstrap 5 utility classes and grid system
- Axios-based data fetching with configurable API base URL

## Tech Stack

- **Backend:** Node.js, Express, mysql2, dotenv, cors
- **Backend Integrations:** Open-source cricket API (no key) with Cricbuzz scraping fallback via Axios
- **Frontend:** React (create-react-app), React Router, Axios, Bootstrap 5
- **Database:** MySQL 8.0

## Project Structure

```
cricket-platform/
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── .env
│   ├── config/
│   │   └── db.js
│   ├── models/
│   │   └── matchModel.js
│   ├── controllers/
│   │   └── matchController.js
│   └── routes/
│       └── matchRoutes.js
└── frontend/
    ├── package.json
    ├── public/
    │   └── index.html
    └── src/
        ├── App.js
        ├── index.js
        ├── styles.css
        ├── api/
        │   └── api.js
        ├── pages/
        │   ├── HomePage.jsx
        │   └── MatchPage.jsx
        └── components/
            ├── Navbar.jsx
            ├── MatchCard.jsx
            ├── MatchList.jsx
            └── MatchDetails.jsx
```

## Prerequisites

- Node.js 18+
- npm 8+
- MySQL 8.0 server

## Backend Setup

1. Install dependencies:
   ```powershell
   cd backend
   npm install
   ```
2. Configure environment variables in `backend/.env`:
   ```env
   PORT=5000
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
+   DB_PASSWORD=system
   DB_NAME=cricket_platform
   CRICBUZZ_API_KEY=your_rapidapi_key
   # Optional overrides (defaults shown below)
   # CRICBUZZ_API_HOST=free-cricbuzz-cricket-api.p.rapidapi.com
   # CRICBUZZ_API_BASE_URL=https://free-cricbuzz-cricket-api.p.rapidapi.com
   # CRICKET_API_SERVER=https://cricket-api.vercel.app
   DB_SSL=false
   DB_SSL_REJECT_UNAUTHORIZED=false
   DB_CONNECTION_LIMIT=10
   ```
   Use `backend/.env.example` as a reference when provisioning new environments.
3. Create the database and table:
   ```sql
   CREATE DATABASE IF NOT EXISTS cricket_platform;
   USE cricket_platform;

   CREATE TABLE matches (
     id INT AUTO_INCREMENT PRIMARY KEY,
     team1 VARCHAR(100),
     team2 VARCHAR(100),
     venue VARCHAR(100),
     match_date DATETIME,
     status ENUM('upcoming','live','completed') DEFAULT 'upcoming',
     score_team1 VARCHAR(20),
     score_team2 VARCHAR(20),
     winner VARCHAR(100),
     player_of_match VARCHAR(100),
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );
   ```
4. Start the development server:
   ```powershell
   npm run dev
   ```
   The API will be available at `http://localhost:5000`.

## Frontend Setup

1. Install dependencies:
   ```powershell
   cd frontend
   npm install
   ```
2. (Optional) Configure the API base URL by creating `frontend/.env`:
   ```env
   REACT_APP_API_BASE_URL=http://localhost:5000/api
   ```
   Defaults to `http://localhost:5000/api` if not set.
3. Start the React development server:
   ```powershell
   npm start
   ```
   The application runs at `http://localhost:3000`.

## Deployment on Railway

Railway is recommended for both the backend API and a managed MySQL instance. The React frontend can be hosted either via the Railway Static Site service or any CDN that serves the `frontend/build` directory.

### 1. Database

1. Create a **MySQL** service in Railway.
2. Copy the automatically generated environment variables. Railway exposes them as `MYSQLHOST`, `MYSQLPORT`, `MYSQLUSER`, `MYSQLPASSWORD`, and `MYSQLDATABASE`.

### 2. Backend API Service

1. Create a new **Node.js** service pointing to the `backend` directory.
2. Set the "Start Command" to `npm start`. Dependencies are installed automatically from `backend/package.json`.
3. In the service settings, add the following environment variables:
   - `PORT=8080` (or another port; Railway will proxy to the public URL)
   - `CRICKET_API_SERVER=https://cricket-api.vercel.app`
   - `DATABASE_URL` – optional. If you prefer Railway’s single `DATABASE_URL`, paste it here; the backend will parse it automatically.
   - Otherwise map the provided MySQL variables:
     - `DB_HOST=${MYSQLHOST}`
     - `DB_PORT=${MYSQLPORT}`
     - `DB_USER=${MYSQLUSER}`
     - `DB_PASSWORD=${MYSQLPASSWORD}`
     - `DB_NAME=${MYSQLDATABASE}`
   - `DB_SSL=true` (Railway’s shared MySQL instances require TLS.)
   - `DB_SSL_REJECT_UNAUTHORIZED=false` (Railway certificates are self-signed.)

4. Redeploy the backend after saving variables. Railway will expose a public URL such as `https://cricket-backend.up.railway.app`. Use this value when configuring the frontend.

### 3. Frontend Static Site

1. Build the production bundle locally or via CI:
   ```powershell
   cd frontend
   npm install
   npm run build
   ```
2. Deploy the `frontend/build` directory by creating a **Static Site** service in Railway (or upload to your preferred static host).
3. Set `REACT_APP_API_BASE_URL` environment variable on the static host to the backend URL, for example:
   ```env
   REACT_APP_API_BASE_URL=https://cricket-backend.up.railway.app/api
   ```
4. Rebuild/redeploy to ensure the frontend bundle is generated with the correct API base URL.

> **Tip:** For multi-environment setups, create `frontend/.env.production` files that define `REACT_APP_API_BASE_URL` before running `npm run build`.

## Available Scripts

### Backend (@ `backend/package.json`)
- `npm run dev` – Start Express server with nodemon
- `npm start` – Start Express server with Node

### Frontend (@ `frontend/package.json`)
- `npm start` – Start React development server
- `npm run build` – Build production bundle
- `npm test` – Run CRA test runner

## REST API Endpoints

| Method | Endpoint           | Description                     | Body / Params |
|--------|--------------------|---------------------------------|---------------|
| GET    | `/api/matches`     | Fetch all matches (filterable)  | `?status=live`
| GET    | `/api/matches/:id` | Fetch a single match            | `id` path param|
| POST   | `/api/matches`     | Create a new match              | `{ team1, team2, venue, match_date, status }`
| PUT    | `/api/matches/:id` | Update match scores/details     | `{ status, score_team1, score_team2, winner, player_of_match }`
| DELETE | `/api/matches/:id` | Delete a match                  | `id` path param|
| GET    | `/api/live-matches` | Fetch IDs & titles for live matches (RapidAPI Cricbuzz with HTML fallback) | none |
| GET    | `/api/live-score/:matchId` | Fetch detailed live score for given match | `matchId` path param|

### Authentication Endpoints

| Method | Endpoint | Description | Body / Params |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user and send verification email | `{ email, password }` |
| POST | `/api/auth/login` | Login verified user and receive JWT | `{ email, password }` |
| GET  | `/api/auth/verify-email` | Verify email address using token from email | `?token=uuid` |
| POST | `/api/auth/forgot-password` | Request password reset email | `{ email }` |
| POST | `/api/auth/reset-password` | Set new password with valid reset token | `?token=uuid`, `{ newPassword }` |

## Development Notes

- Bootstrap styles load via CDN in `frontend/public/index.html`; JS bundle is imported in `src/index.js`.
- Axios client (`frontend/src/api/api.js`) exposes helper functions for match queries.
- Ensure CORS policy allows your frontend origin if deploying separately. Backend now applies Helmet, rate limiting, and CORS defaults to `FRONTEND_URL`.
- Authentication flows require SMTP credentials and JWT secret configured in `.env` (see `backend/.env.example`).
- Live scores component polls `/api/live-matches` and `/api/live-score/:id` every 30 seconds. Data is sourced from the RapidAPI "free-cricbuzz-cricket-api" when available, with Cricbuzz HTML scraping as a fallback.
- Extend or adjust polling interval via `REFRESH_INTERVAL` in `LiveScores.jsx` as needed.

## Future Enhancements

- Role-based authorization for protected match management
- Admin dashboard for creating/updating matches via UI
- Automated tests for API routes and React components
