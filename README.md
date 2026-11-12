# SIPKAK

> Report damaged campus facilities on the map, and follow them until they're fixed

<h3 align="center">A campus damage-reporting web app for ITB Ganesha: students pin problems on the real campus map, and the facilities team tracks and fixes them</h3>

<!-- Screenshot: drag an image of the app into this file on GitHub, then put the line GitHub gives you here. -->

## Overview

`SIPKAK` lets students at ITB Ganesha report damaged facilities, such as a broken lamp, a leaking tap or a loose handrail, by putting a pin on the campus map. The facilities team sees every report on the same map, updates its status, and adds notes. The student who sent the report is notified of each change.

**The app is deployed and ready to use at <https://sipkak.vercel.app>.** The facilities team signs in at <https://sipkak.vercel.app/admin>.

It consists of a campus map with every open report, a report damage form with a duplicate warning, a reporter's history and notifications, and an admin dashboard. It works on phones and desktops: below 900 px wide it uses a phone layout with a bottom nav, and above that a three-pane desktop layout.

SIPKAK is a **simulated prototype**: the whole flow works end to end through a real REST API, but location, photo storage, admin sign-in and live updates are deliberately simplified (see [Simulated Parts](#simulated-parts)).

## Tech Stack and Languages

<p align="center">
  <img src="https://raw.githubusercontent.com/Ender-Wiggin2019/ServiceLogos/main/TypeScript/TypeScript.png" alt="TypeScript" width="160"/>
  <img src="https://raw.githubusercontent.com/Ender-Wiggin2019/ServiceLogos/main/React/React.png" alt="React" width="160"/>
  <img src="https://raw.githubusercontent.com/Ender-Wiggin2019/ServiceLogos/main/Vite/Vite.png" alt="Vite" width="160"/>
  <img src="https://raw.githubusercontent.com/Ender-Wiggin2019/ServiceLogos/main/Node.js/Node.js.png" alt="Node.js" width="160"/>
</p>

<p align="center">
  <a href="./frontend">Frontend</a>
  •
  <a href="./backend">Backend</a>
  •
  <a href="#deployment">Deployment</a>
</p>

## Authors

<div align="center">
  <table>
    <tr>
      <th>NIM</th>
      <th>Name</th>
      <th>GitHub</th>
    </tr>
    <tr align="center">
      <td>18023026</td>
      <td>Kenzie Nauval Putra Friyuana</td>
      <td>
        <a href="https://github.com/18023026-sudo">
          <img src="https://github.com/18023026-sudo.png" width="48" alt="18023026-sudo" /><br/>
          <sub><b>@18023026-sudo</b></sub>
        </a>
      </td>
    </tr>
    <tr align="center">
      <td>18223010</td>
      <td>Vandega Arozan Musholinem</td>
      <td>
        <a href="https://github.com/Vandoza">
          <img src="https://github.com/Vandoza.png" width="48" alt="Vandoza" /><br/>
          <sub><b>@Vandoza</b></sub>
        </a>
      </td>
    </tr>
    <tr align="center">
      <td>18223082</td>
      <td>Mahesa Satria Prayata</td>
      <td>
        <a href="https://github.com/echaa0018">
          <img src="https://github.com/echaa0018.png" width="48" alt="echaa0018" /><br/>
          <sub><b>@echaa0018</b></sub>
        </a>
      </td>
    </tr>
  </table>
</div>

## About SIPKAK

`SIPKAK` is designed around one simple loop: see a problem, pin it, and know when it's fixed. Students don't need an account. Each browser gets its own anonymous reporter ID, so "My reports" and "Notifications" work from the first visit.

The project is built with a split frontend-backend architecture in one repository (npm workspaces). The React frontend draws the real ITB Ganesha map from OpenStreetMap with Leaflet and talks only to the backend's REST API. The Express backend holds the business rules and stores data either in memory (for development) or in Supabase (Postgres, for deployment). Both are deployed on Vercel, and the frontend forwards `/api/*` to the backend, so the browser never talks to the database.

---

## Features

- Campus map of ITB Ganesha with one marker per report, in three status styles: **Waiting for review** (orange dot), **In progress** (blue ring) and **Done** (grey circle with a check).
- Report details with the photo, building and floor, a Reported / In progress / Done timeline, the latest note from facilities, and a **Same problem (+1)** button.
- **Report damage** form with a draggable pin, "Use my location", photo upload (resized in the browser), building, floor and description, with validation messages next to each field.
- **Duplicate warning**: 400 ms after the pin stops moving, the form looks for an open report within 30 m and offers a +1 instead of a new report.
- **Report sent** pop-up with the report number and time, then **My reports** with each report's status.
- **Notifications** with an unread badge, sent whenever facilities change a report's status or add a note.
- **Admin dashboard**: list, map and details side by side, with All / Waiting / In progress / Done filters that also hide map pins, and a **Save and notify reporter** button.
- Every date shown as `dd/MM/yyyy · HH:mm WIB` (Western Indonesia Time).
- Accessible: real buttons, links and labels, visible focus, 44 px touch targets, and labelled map markers.
- Two interchangeable data stores (memory and Supabase) behind one interface, tested by the same contract tests.

---

## Simulated Parts

These parts are simplified on purpose. Each one is marked in the code with a `// SIMULATED:` comment that says what a real app would do.

| Part | What SIPKAK does | What a real app would do |
| --- | --- | --- |
| Location | "Use my location" moves the pin to a fixed spot south of Aula Barat (±12 m). A "Simulate being at…" select jumps to any building. | Ask the browser's GPS (`navigator.geolocation`). |
| Map | One SVG drawn from OpenStreetMap, placed at its real coordinates with Leaflet. | Use a tile server. |
| Photo | Resized in the browser (longest side 800 px, JPEG quality 0.7) and sent inside the JSON as a data URL. | Upload the file to storage (e.g. Supabase Storage) and keep only its URL. |
| Admin sign-in | One shared password (`ADMIN_PASSWORD`) that returns a fixed token (`ADMIN_TOKEN`), kept in `sessionStorage`. | A real account per staff member with short-lived tokens. |
| Live updates | The app asks for notifications every 15 seconds and when the window gets focus. | Push updates from the server (e.g. Supabase Realtime). |
| Reporter identity | A random UUID kept in `localStorage`, sent as the `X-Reporter-Id` header. `VITE_DEMO_REPORTER_ID` can fix it to the demo reporter. | A real sign-in, or at least the random ID only. |
| Data | `DATA_STORE=memory` (the default) loads the seed data at startup and resets on restart. | Always a database (`DATA_STORE=supabase`). |

---

## Project Structure

```text
SIPKAK/
  backend/                Express 5 REST API (TypeScript)
    src/
      createApp.ts        builds the Express app (routes, 404, error handler)
      index.ts            Vercel's entry point (default export, no listen)
      dev.ts              local server on port 3001
      routes/             HTTP only: parse input, call a service, send the response
      services/           business rules: reports, +1s, status updates, notifications
      store/              the Store interface, memory store and Supabase store
      data/               seed reports and notifications, buildings, map bounds
      lib/                errors, validation schemas, distance maths
    test/                 Vitest + Supertest tests, including the store contract tests
    scripts/smoke.mjs     checks every endpoint of a running API
    supabase/             schema.sql and seed.sql for Supabase
  frontend/               React + Vite web app (TypeScript)
    public/map/           the ITB Ganesha campus map (SVG)
    src/
      api/                the only place that calls fetch
      components/         map, lists, details, form, dialogs, layouts
      pages/              admin sign-in and admin dashboard
      lib/                WIB dates, reporter ID, photo resizing, data hooks
      styles/tokens.css   colours, radius and font
    vercel.json           forwards /api/* to the backend
```

---

## Installation & Setup

### Requirements

- Git
- Node.js 24 or newer (26 recommended, see `.nvmrc`)
- npm (comes with Node.js)

### Dependencies

- Express 5
- React and React Router
- Leaflet and React Leaflet
- Zod
- Supabase JS client (backend only)
- IBM Plex Sans (via Fontsource)
- Vitest, Supertest and React Testing Library
- ESLint and Prettier

Install everything for both apps from the repository root:

```bash
npm install
```

> [!IMPORTANT]
> Copy the two `.env.example` files to `.env` before running the application. Do not commit `.env` or real deployment secrets.

### Environment

Create the two environment files. In PowerShell:

```powershell
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
```

On macOS or Linux, use `cp` instead of `Copy-Item`.

`backend/.env` (read by `npm run dev` only; on Vercel these go in the project's environment variables):

| Variable | Default | What it does |
| --- | --- | --- |
| `PORT` | `3001` | The local API port |
| `DATA_STORE` | `memory` | `memory` (resets on restart) or `supabase` |
| `ADMIN_PASSWORD` | `sipkak-admin` | The facilities team's sign-in password |
| `ADMIN_TOKEN` | `change-me-to-a-long-random-string` | The token admins get after signing in |
| `SUPABASE_URL` | empty | Your Supabase Project URL, e.g. `https://xxxx.supabase.co` (no `/rest/v1/`) |
| `SUPABASE_SECRET_KEY` | empty | Your Supabase secret key (`sb_secret_…`), server only |

`frontend/.env`:

| Variable | Example | What it does |
| --- | --- | --- |
| `VITE_DEMO_REPORTER_ID` | `00000000-0000-4000-8000-000000000001` | Makes this browser the demo reporter, so the seed reports show up under My reports and Notifications. Leave it empty for a random reporter ID. |

---

## How to Run

### Local Development

Start both apps with one command from the repository root:

```bash
npm run dev
```

- Reporter app: <http://localhost:5173>
- Admin dashboard: <http://localhost:5173/admin> (password: the `ADMIN_PASSWORD` in `backend/.env`)
- API: <http://localhost:3001/api/health>

The Vite dev server forwards `/api/*` to the API on port 3001. With `DATA_STORE=memory`, the API starts with 8 sample reports and 4 notifications, and resets every time it restarts.

To run only one app, use `npm run dev -w backend` or `npm run dev -w frontend`.

### Using Supabase

1. Create a Supabase project. In its **SQL Editor**, run `backend/supabase/schema.sql`, then `backend/supabase/seed.sql`. The seed **empties the tables first**, so running it again also resets the demo data.
2. In `backend/.env`, set `DATA_STORE=supabase`, `SUPABASE_URL` and `SUPABASE_SECRET_KEY`.
3. Restart `npm run dev`. <http://localhost:3001/api/health> now shows `"store":"supabase"`, and data survives restarts.

Row Level Security is on for every table with no policies, so only the backend's secret key can read or write.

### Deployment

SIPKAK deploys as **two Vercel projects** from this repository:

| Project | Root Directory | What it is |
| --- | --- | --- |
| backend | `backend` | The Express API, run as one Vercel Function |
| frontend | `frontend` | The React app, served as static files |

The browser only talks to the frontend: `frontend/vercel.json` forwards every `/api/*` request to the backend, so there is no CORS to set up and the Supabase key never reaches the browser.

You need this repository on GitHub, a [Vercel](https://vercel.com) account (the free Hobby plan is enough), and a Supabase project with `schema.sql` and `seed.sql` already run (see [Using Supabase](#using-supabase)).

**1. Deploy the backend**

1. In Vercel, click **Add New… → Project** and **Import** this repository.
2. Next to **Root Directory**, click **Edit** and pick **`backend`**. **Framework Preset** should say **Express**; leave the build and install settings as they are.
3. Under **Environment Variables**, add these for **Production**:

   | Name | Value |
   | --- | --- |
   | `DATA_STORE` | `supabase` |
   | `SUPABASE_URL` | your Project URL, e.g. `https://xxxx.supabase.co` (no `/rest/v1/` at the end) |
   | `SUPABASE_SECRET_KEY` | your Supabase **secret** key (`sb_secret_…`) |
   | `ADMIN_PASSWORD` | the password the facilities team will sign in with |
   | `ADMIN_TOKEN` | a long random string, from the command below |

   ```powershell
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

   Don't set `PORT`: Vercel takes care of it.
4. Click **Deploy**. Optional but faster for Indonesia: in **Settings → Functions**, set **Function Region** to **Singapore (sin1)** and redeploy.
5. Open `https://<your-backend>.vercel.app/api/health`. It should show `{"ok":true,"store":"supabase"}`.

**2. Point the frontend at the backend**

In `frontend/vercel.json`, the first rewrite's `destination` must be your backend's address, e.g. `https://<your-backend>.vercel.app/api/$1`. Commit and push the change.

**3. Deploy the frontend**

1. In Vercel, click **Add New… → Project** and import the **same repository** again.
2. Set **Root Directory** to **`frontend`**. **Framework Preset** should say **Vite**.
3. Optional, for a demo: add `VITE_DEMO_REPORTER_ID` = `00000000-0000-4000-8000-000000000001`, so every visitor sees the seed reports under My reports and Notifications.
4. Click **Deploy**, then open the frontend's address: the map shows the reports, `/api/health` shows `"store":"supabase"` (through the rewrite), and `/admin` asks for your `ADMIN_PASSWORD`.

From then on, every push to `main` redeploys both projects, and Vercel skips a project when nothing in its folder changed.

**Good to know**

- Environment variables only apply to new deployments. After changing one, open **Deployments**, click **⋯** on the latest one and choose **Redeploy**.
- Vercel Functions accept request bodies up to 4.5 MB. Photos are shrunk in the browser to about 100 KB, so this only matters for very large uploads that skip the form.
- Changing `ADMIN_TOKEN` signs every admin out.
- The smoke script (see [Build](#build)) also works against the deployed backend. Each run adds one "Smoke test" report; run `seed.sql` again to go back to the clean demo data.

---

## Build

Build both apps from the repository root:

```bash
npm run build
```

- Backend: `npm run build -w backend` compiles TypeScript into `backend/dist`.
- Frontend: `npm run build -w frontend` builds the site into `frontend/dist`.

### Full Quality Gate

```bash
npm run check
```

It runs ESLint and the Prettier format check, then type-checks both apps, then runs every test in both apps. Run it, and `npm run build`, before you push.

| Command | What it does |
| --- | --- |
| `npm run dev` | Runs the API and the frontend together |
| `npm run lint` | ESLint and the Prettier format check |
| `npm run typecheck` | TypeScript checks for both apps |
| `npm run test` | All Vitest tests for both apps |
| `npm run check` | `lint`, `typecheck` and `test` |
| `npm run build` | Builds both apps |
| `npm run smoke -w backend` | Checks every endpoint of a running API and prints ✓ or ✗ for each |
| `npm run test:supabase -w backend` | Runs the store contract tests against Supabase, using the keys in `backend/.env` |

The smoke script tests `http://localhost:3001` by default. To test a deployed backend instead (PowerShell):

```powershell
$env:API_URL="https://your-backend.vercel.app"; $env:ADMIN_PASSWORD="<your admin password>"; npm run smoke -w backend
```

---

## REST API

The base path is `/api`. Requests and responses are JSON, and every time is an ISO 8601 string in UTC. Errors always look like `{ "error": { "code": "VALIDATION_ERROR", "message": "…", "details": { "description": "Too short" } } }`, with codes `VALIDATION_ERROR` (400), `UNAUTHORIZED` (401), `NOT_FOUND` (404), `CONFLICT` (409), `PAYLOAD_TOO_LARGE` (413) and `INTERNAL` (500).

| Method | Path | Does |
| --- | --- | --- |
| GET | `/api/health` | Health check: `{"ok":true,"store":"memory"}` |
| GET | `/api/buildings` | Buildings for the form's dropdown |
| GET | `/api/reports?status=&mine=true` | Reports, newest first. `status` is `waiting`, `in_progress` or `done`; `mine=true` needs `X-Reporter-Id` |
| GET | `/api/reports/nearby?lat=&lng=&radius=30` | Open reports within `radius` metres (at most 100), nearest first, each with `distanceM` |
| GET | `/api/reports/:id` | One report |
| POST | `/api/reports` | Creates a report: `{description, building, floor?, lat, lng, accuracyM?, photo?}` |
| POST | `/api/reports/:id/confirmations` | "Same problem (+1)". `409` if you already confirmed it or sent it yourself |
| GET | `/api/notifications` | Your notifications, newest first, and the unread count |
| POST | `/api/notifications/read` | Marks the given `ids` as read (all of them without ids) |
| POST | `/api/admin/login` | `{password}` returns `{token}`, or `401` |
| PATCH | `/api/admin/reports/:id` | `{status?, note?}` updates a report and notifies its reporter. Needs `Authorization: Bearer <token>` |

Reporters have no accounts: the frontend sends a UUID as `X-Reporter-Id`. It's required for creating a report, +1 and notifications, and optional on other GET requests, where it only sets `isMine`. The API never returns anyone's reporter ID.

Validation rules: `description` is 5–280 characters, `building` must be a known building, `floor` is at most 20 characters, `lat` and `lng` must be inside the campus map, and `photo` must be a JPEG data URL of at most 10 MB.

---

## Supported Workflows

### Reporting Damage

- The student opens **Report damage** and places the pin by dragging the map (phone), clicking the map (desktop), or using **Use my location**
- The nearest building is picked automatically until the student chooses one
- 400 ms after the pin stops, the app checks for open reports within 30 m and shows "Already reported N m away" with a **Same problem (+1)** button
- The photo is resized in the browser before it is sent
- The API validates the report, gives it the next number (e.g. `#0146`) and starts it as **Waiting for review**
- A **Report sent** pop-up shows the number and time, and the new orange marker is already on the map

### Confirming a Report (+1)

- Anyone except the report's sender can press **Same problem (+1)** once
- The API keeps one +1 per reporter per report and answers `409` for a second one
- The browser remembers the +1, so the button stays disabled after a reload

### Following a Report

- **My reports** lists the reports sent from this browser, newest first, with their status
- When facilities change a report, its sender gets a notification: "Your report is now In progress", "Your report is Done", or "Admin added a note to your report"
- The unread count shows on the Notifications tab; opening a notification marks it read and opens its report on the map

### Facilities Admin

- The admin signs in at `/admin/login`; the token lasts until the tab is closed
- On desktop, the list, map and details sit side by side; clicking a row selects its pin and clicking a pin selects its row
- The status filter (All / Waiting / In progress / Done, each with a count) applies to the list and the map
- The admin picks a status, writes an optional note, and presses **Save and notify reporter**; the change is recorded in the report's history
- On a phone, **Map** and **Reports** tabs lead to a report page with the same controls

---

## Security Notes

- Do not commit `.env`
- Keep `SUPABASE_SECRET_KEY`, `ADMIN_PASSWORD` and `ADMIN_TOKEN` in the backend only, never in the frontend or the repository
- Use your own `ADMIN_PASSWORD` and a long random `ADMIN_TOKEN` for any public deployment, not the example values
- Row Level Security is on for every Supabase table with no policies, so the public (publishable) key can't read or write anything
- If a secret key is ever exposed, create a new one in Supabase and delete the old one
- The browser only talks to the frontend's `/api/*`, which Vercel forwards to the backend; no database key reaches the browser

---

<br/>
<br/>

<div align="center">
SIPKAK • 2026
</div>
