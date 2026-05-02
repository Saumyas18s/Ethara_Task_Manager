# Team Task Manager

A production-ready web application for managing team projects and tasks, built for the Ethara.AI selection assignment.

## Tech Stack

- **Backend:** Node.js, Express.js, Prisma ORM, PostgreSQL, Zod, JWT.
- **Frontend:** React (Vite), Tailwind CSS, React Query, Zustand.
- **Deployment:** Railway.

## Features

- **Authentication:** JWT-based login and registration with bcrypt password hashing.
- **Role-Based Access Control:** ADMIN and MEMBER roles with specific permissions.
- **Project Management:** Create, update, and delete projects (Admin only). Add/remove team members.
- **Task Management:** Kanban-style task board. Create, update, and track tasks.
- **Dashboard:** Overview of total tasks, status breakdown, and overdue tasks.

## Local Setup

### Prerequisites

- Node.js (v20.19+ recommended)
- PostgreSQL database

### Installation

1. Clone the repository.
2. Run `npm run install:all` in the root directory.
3. Create a `.env` file in the `backend` directory based on `.env.example`.
4. Run `cd backend && npx prisma migrate dev` to set up the database.
5. Run `npm run dev` from the root to start both backend and frontend.

## Deployment to Railway

1. Connect your GitHub repository to Railway.
2. Add a PostgreSQL plugin to your Railway project.
3. Set the following Environment Variables in Railway:
   - `DATABASE_URL`: (Automatically provided by Railway's PostgreSQL plugin)
   - `JWT_SECRET`: A long random string.
   - `NODE_ENV`: `production`
   - `VITE_API_URL`: `/api` (for monorepo deployment)
4. Railway will automatically detect the root `package.json` and run the `build` and `start` scripts.
5. Ensure `npx prisma migrate deploy` is run during the build phase or manually in the Railway console.

## Project Structure

- `backend/`: Express API source code and Prisma schema.
- `frontend/`: React application source code.
- `package.json`: Monorepo root with orchestration scripts.
