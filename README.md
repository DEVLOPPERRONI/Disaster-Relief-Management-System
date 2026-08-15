# Disaster Management System

A full-stack Disaster Management System built with:

- Frontend: HTML5, CSS3, Bootstrap 5, Vanilla JavaScript, Fetch API
- Backend: Node.js, Express.js
- Database: Microsoft SQL Server (`mssql`)
- Auth: JWT

## Features

- User registration (name, email, phone, password)
- Login using email or phone
- JWT-protected dashboard and disaster APIs
- Modern responsive dashboard with sidebar
- Disaster CRUD (create, read, update, delete)
- Search disasters by name, type, status, severity
- Dashboard statistics from real database data
- Loading, empty, and error states
- Toast notifications and confirmation modal

## Project Structure

```text
DisasterManagementSystem/
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── config/
│   │   └── database.js
│   ├── routes/
│   │   ├── userRoutes.js
│   │   └── disasterRoutes.js
│   ├── controllers/
│   │   ├── userController.js
│   │   └── disasterController.js
│   └── middleware/
│       └── authMiddleware.js
├── frontend/
│   ├── index.html
│   ├── login.html
│   ├── register.html
│   ├── dashboard.html
│   ├── disasters.html
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── api.js
│       ├── auth.js
│       ├── dashboard.js
│       └── disasters.js
├── .env
├── .env.example
├── .gitignore
└── README.md
```

## Database Requirements

Use your existing SQL Server database with these tables:

### Users

```sql
CREATE TABLE Users
(
    UserID INT IDENTITY(1,1) PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Email VARCHAR(150) NOT NULL UNIQUE,
    Phone VARCHAR(20) NOT NULL UNIQUE,
    Password VARCHAR(255) NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE()
);
```

### Disasters

```sql
CREATE TABLE Disasters
(
    DisasterID INT IDENTITY(1,1) PRIMARY KEY,
    DisasterName VARCHAR(100) NOT NULL,
    DisasterType VARCHAR(50) NOT NULL,
    Description VARCHAR(500),
    Severity VARCHAR(20) NOT NULL,
    Status VARCHAR(30) NOT NULL,
    StartDate DATETIME NOT NULL,
    EndDate DATETIME NULL,
    AffectedPeople INT DEFAULT 0,
    CreatedAt DATETIME DEFAULT GETDATE()
);
```

## Environment Variables

Copy `.env.example` to `.env` and update values:

```env
PORT=5000
DB_AUTH_MODE=sql
DB_SERVER=YOUR_SQL_SERVER
DB_DATABASE=YOUR_DATABASE
DB_USER=YOUR_USERNAME
DB_PASSWORD=YOUR_PASSWORD
DB_PORT=1433
JWT_SECRET=change_this_secret
```

For Windows Authentication, set:

```env
DB_AUTH_MODE=windows
DB_USER=
DB_PASSWORD=
```

## Installation

1. Open terminal in `DisasterManagementSystem/backend`
2. Install dependencies:

```bash
npm install
```

## Run the App

From `DisasterManagementSystem/backend`:

```bash
npm run dev
```

Open:

- `http://localhost:5000`

Backend serves frontend files statically.

## API Endpoints

### Users

- `POST /api/users/register`
- `POST /api/users/login`

### Disasters (JWT required)

- `GET /api/disasters`
- `GET /api/disasters/:id`
- `GET /api/disasters/search?query=value`
- `POST /api/disasters`
- `PUT /api/disasters/:id`
- `DELETE /api/disasters/:id`

### Dashboard (JWT required)

- `GET /api/dashboard/stats`

## Troubleshooting

- **401 Unauthorized**: Login again and ensure token exists in browser storage.
- **Database errors**: Verify `.env` SQL Server credentials and DB accessibility.
- **Port conflict**: Change `PORT` in `.env`.
- **Frontend not loading**: Ensure backend is running and open `http://localhost:5000`.
