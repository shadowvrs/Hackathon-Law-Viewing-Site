# Canada Law Tracker (Hackathon-Law-Viewing-Site)

A web application to easily express your opposition or support for a legislative bill in Canada.

Built with **Svelte 5** (Frontend), **Express** (Backend), and written entirely in **TypeScript** across a Yarn/npm workspace monorepo.
Data obtained directly off of ([LegisInfo](https://www.parl.ca/legisinfo/)).



# Features

- One click email functionality

- Direct link to full documents of current bills

- Login and profile that will eventually allow the user to customize their preset email prompt, automatically fill in their local MPs email and more

- Search through bills

- View quick information on current bills

## 🚀 Quick Start

### 1. Initialize the Database (run this first!)

> ⚠️ **This must be run once before `yarn dev` / `npm run dev`**, otherwise the server will fail to start because the SQLite database file won't exist.

Using Yarn:

```bash
yarn db:init
```

Or using npm:

```bash
npm run db:init
```

This creates the `server/database.sqlite` file and all required tables.

---

### 2. Start Development Mode

Using Yarn:

```bash
yarn dev
```

Or using npm:

```bash
npm run dev
```

- **Frontend (Svelte 5):** [http://localhost:5173](http://localhost:5173) (Vite dev server with HMR and `/api` proxy)
- **Backend (Express):** [http://localhost:3001](http://localhost:3001) (Express server with `tsx watch` hot-reload)

---

## 🛠 Available Scripts

| Yarn Command      | npm Command          | Description                                             |
| ----------------- | -------------------- | ------------------------------------------------------- |
| `yarn dev`        | `npm run dev`        | Runs both backend and frontend dev servers concurrently |
| `yarn dev:client` | `npm run dev:client` | Starts only the Svelte frontend dev server              |
| `yarn dev:server` | `npm run dev:server` | Starts only the Express backend dev server              |
| `yarn typecheck`  | `npm run typecheck`  | Runs Svelte and TypeScript typecheck across workspaces  |
| `yarn build`      | `npm run build`      | Builds `shared`, `server`, and `client` for production  |
| `yarn start`      | `npm run start`      | Runs the production Express server                      |

---

## 🔌 API Endpoints

| Method | Endpoint                      | Query Params                                                  | Description                                                                                    |
| ------ | ----------------------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `GET`  | `/api/health`                 | -                                                             | Returns API status, uptime, and loaded bill count                                              |
| `GET`  | `/api/bills` (or `/api/laws`) | `search`, `chamber`, `documentType`, `status`, `isGovernment` | Returns filtered list of legislation records                                                   |
| `GET`  | `/api/bills/:id`              | -                                                             | Returns a specific bill by numeric `Id` (e.g. `14310361`) or `NumberCode` (e.g. `S-8`, `C-41`) |
| `POST` | `/api/bills/:id/reactions`    | -                                                             | Submits reaction (`{ "type": "support" \| "oppose" }`)                                         |
