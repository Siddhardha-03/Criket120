# Cricket Platform

Responsive full-stack web application for tracking cricket matches across upcoming, live, and completed states. The platform exposes a REST API powered by Node.js, Express, and MySQL, and a React frontend styled with Bootstrap 5 for fluid layouts across desktop, tablet, and mobile devices.

## Features

- Match listing segmented by status with search and filtering
- Detailed match view including scores, venue, winner, and player of the match
- RESTful API for CRUD operations on matches
- Responsive UI built with Bootstrap 5 utility classes and grid system
- Axios-based data fetching with configurable API base URL

## Tech Stack

- **Backend:** Node.js, Express, mysql2, dotenv, cors
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
   DB_PASSWORD=system
   DB_NAME=cricket_platform
   ```
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

## Development Notes

- Bootstrap styles load via CDN in `frontend/public/index.html`; JS bundle is imported in `src/index.js`.
- Axios client (`frontend/src/api/api.js`) exposes helper functions for match queries.
- Ensure CORS policy allows your frontend origin if deploying separately.

## Future Enhancements

- Authentication layer for protected match management
- Admin dashboard for creating/updating matches via UI
- Automated tests for API routes and React components
