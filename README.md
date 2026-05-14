# TaskFlow - Team Task Manager

TaskFlow is a full-stack team task manager for project creation, employee assignment, task status tracking, and role-based dashboards.

## Features

- Admin and Employee signup/login from one dynamic auth panel
- Duplicate email, wrong password, invalid role, and form validation messages
- Admin project creation with name, type, priority, deadline, status, and assigned members
- Admin project edit, status select, drag-and-drop status board, task assignment, assignee updates, and deletion
- Employee dashboard limited to assigned projects/tasks with task status updates
- Dashboard metrics for active work, completion rate, overdue work, task status distribution, and project health
- REST API with JWT auth, RBAC middleware, SQLite database, Sequelize relationships, and seeded demo data
- Railway-ready production serving of the Vite build from Express

## Tech Stack

- Frontend: React, Vite, Lucide icons, custom responsive CSS
- Backend: Node.js, Express, Sequelize
- Database: SQLite
- Auth: bcrypt password hashing and JWT sessions

## Demo Accounts

All seeded demo accounts use this password:

```txt
Taskflow@123
```

| Role | Email |
| --- | --- |
| Admin | admin@taskflow.dev |
| Employee | maya@taskflow.dev |
| Employee | rahul@taskflow.dev |
| Employee | nina@taskflow.dev |

## Local Setup

```bash
npm run install:all
npm --prefix client run build
npm start
```

Open `http://localhost:8080`.

For development:

```bash
npm --prefix server run dev
npm --prefix client run dev
```

The Vite client proxies `/api` to `http://localhost:8080`.

## Environment Variables

```txt
PORT=8080
JWT_SECRET=replace-with-a-long-secret
SQLITE_PATH=optional/custom/path/taskflow.sqlite
SEED_DEMO=true
```

Set `SEED_DEMO=false` to start with an empty database.

## REST API Summary

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/dashboard`
- `GET /api/users?role=MEMBER`
- `GET /api/projects`
- `POST /api/projects`
- `PUT /api/projects/:id`
- `DELETE /api/projects/:id`
- `POST /api/projects/:id/tasks`
- `PUT /api/tasks/:id`
- `DELETE /api/tasks/:id`

## Railway Deployment

1. Push this folder to GitHub.
2. Create a new Railway project from the GitHub repository.
3. Set `JWT_SECRET` in Railway Variables.
4. Railway uses `railway.toml`:
   - Build: `npm run install:all && npm run build`
   - Start: `npm start`
5. After deployment, submit the live Railway URL, GitHub repo URL, README, and a 2-5 minute demo video.

For persistence on Railway, attach a volume and set `SQLITE_PATH` to a path inside the mounted volume.
