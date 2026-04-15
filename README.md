# notnow

Task management for people who work across many projects.

## Prerequisites

- Node.js 22+
- MongoDB Atlas (or local MongoDB)

## Setup

```bash
# Install all dependencies (from repo root)
npm install --workspaces
```

Create `packages/api/.env`:

```
PORT=4000
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/notnow?retryWrites=true&w=majority
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret
CORS_ORIGIN=http://localhost:3000
```

## Development

Open two terminals:

**Terminal 1 - API** (port 4000):

```bash
cd packages/api
npm run dev
```

**Terminal 2 - Web** (port 3000):

```bash
cd packages/web
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
packages/
  api/          Express + Mongoose API
    src/
      config/   DB connection, env validation
      middleware/  auth, authorization, validation
      models/   User, Handle, Team, Group, Task, TimeEntry, Notification
      routes/   auth, teams, groups, tasks, time, trash, notifications
      services/ ordering (fractional indexing), socket.io, reminders
  web/          Next.js 15 + React 19 frontend
    src/
      app/      Pages (auth, pipeline, groups, upcoming, time, settings, trash)
      components/  layout (Topbar, Sidebar, DetailPane), tasks (TaskRow, etc.)
      hooks/    useAuth, useTasks, useGroups, useTeam, useSocket, etc.
      stores/   Zustand (auth, UI state)
      lib/      API client, query client, ordering utils
```

## Tech Stack

- **Backend**: Node.js, Express, Mongoose, Socket.IO, Zod
- **Frontend**: Next.js 15, React 19, Tailwind CSS v4, Zustand, TanStack Query, dnd-kit
- **Database**: MongoDB
