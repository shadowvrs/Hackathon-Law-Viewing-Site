# Canada Law Tracker (Hackathon-Law-Viewing-Site)

A fullstack web application to view, search, and express opinions on legislation and laws being introduced and passed in Canada.

Built with **Svelte 5** (Frontend), **Express** (Backend), and written entirely in **TypeScript** across a Yarn/npm workspace monorepo.
Data is modeled directly off official Parliament of Canada LEGISinfo schemas ([testInfo.json](file:///home/gilbert/Documents/projects/hackathon/testInfo.json)).

---

## 📁 Project Architecture

```
hackathon/
├── testInfo.json           # Template and dataset of Canadian Parliament & Senate bills
├── client/                 # Svelte 5 + Vite + TypeScript frontend
│   ├── src/
│   │   ├── lib/
│   │   │   └── LawCard.svelte # Svelte 5 runes bill card with sponsor, stage, and reaction UI
│   │   ├── App.svelte      # Main page with Chamber & Bill type filtering and search
│   │   ├── main.ts         # Svelte entry point
│   │   └── app.css         # Reset & global styles
│   ├── vite.config.ts      # Vite config with /api proxy to Express
│   └── tsconfig.json
│
├── server/                 # Express + TypeScript backend
│   ├── src/
│   │   ├── routes/
│   │   │   └── api.ts      # API endpoints serving & filtering testInfo.json data
│   │   └── index.ts        # Express server entry point & static SPA serving
│   ├── .env.example        # Environment variables template
│   └── tsconfig.json
│
├── shared/                 # Shared TypeScript models and types (@app/shared)
│   ├── src/
│   │   └── index.ts        # Comprehensive ParliamentBill interface matching testInfo.json
│   └── tsconfig.json
│
└── package.json            # Root workspace configuration & unified scripts
```

---

## 🚀 Quick Start

### 1. Start Development Mode

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

| Yarn Command | npm Command | Description |
|---|---|---|
| `yarn dev` | `npm run dev` | Runs both backend and frontend dev servers concurrently |
| `yarn dev:client` | `npm run dev:client` | Starts only the Svelte frontend dev server |
| `yarn dev:server` | `npm run dev:server` | Starts only the Express backend dev server |
| `yarn typecheck` | `npm run typecheck` | Runs Svelte and TypeScript typecheck across workspaces |
| `yarn build` | `npm run build` | Builds `shared`, `server`, and `client` for production |
| `yarn start` | `npm run start` | Runs the production Express server |

---

## 🔌 API Endpoints (Powered by `testInfo.json`)

| Method | Endpoint | Query Params | Description |
|---|---|---|---|
| `GET` | `/api/health` | - | Returns API status, uptime, and loaded bill count |
| `GET` | `/api/bills` (or `/api/laws`) | `search`, `chamber`, `documentType`, `status`, `isGovernment` | Returns filtered list of legislation records |
| `GET` | `/api/bills/:id` | - | Returns a specific bill by numeric `Id` (e.g. `14310361`) or `NumberCode` (e.g. `S-8`, `C-41`) |
| `POST` | `/api/bills/:id/reactions` | - | Submits reaction (`{ "type": "support" \| "oppose" }`) |
