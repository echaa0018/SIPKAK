# Deploying SIPKAK

SIPKAK deploys as **two Vercel projects** from the same GitHub repository:

| Project | Root Directory | What it is |
| --- | --- | --- |
| backend | `backend` | The Express API, run as one Vercel Function |
| frontend | `frontend` | The React app, served as static files |

The browser only ever talks to the frontend. `frontend/vercel.json` forwards every `/api/...` request to the backend, so there is no CORS to set up and the Supabase key never reaches the browser.

You need a GitHub account with this repository pushed, a [Vercel](https://vercel.com) account (the free Hobby plan is enough), and a Supabase project with `backend/supabase/schema.sql` and `backend/supabase/seed.sql` already run in its SQL Editor.

## 1. Deploy the backend

1. In Vercel, click **Add New… → Project** and **Import** this repository.
2. Next to **Root Directory**, click **Edit**, pick **`backend`** and click **Continue**.
3. **Framework Preset** should say **Express**. Leave the build and install settings as they are.
4. Open **Environment Variables** and add:

   | Name | Value |
   | --- | --- |
   | `DATA_STORE` | `supabase` |
   | `SUPABASE_URL` | your Project URL, e.g. `https://xxxx.supabase.co` (no `/rest/v1/` at the end) |
   | `SUPABASE_SECRET_KEY` | your Supabase **secret** key (`sb_secret_…`) |
   | `ADMIN_PASSWORD` | the password the facilities team will sign in with |
   | `ADMIN_TOKEN` | a long random string (see below) |

   To make a good `ADMIN_TOKEN`, run this in PowerShell and paste the output:

   ```powershell
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

   Don't set `PORT`: Vercel takes care of it.
5. Click **Deploy** and wait for it to finish.
6. Optional but faster for Indonesia: open the project's **Settings → Functions**, set **Function Region** to **Singapore (sin1)** (the same region as a Singapore Supabase project) and redeploy.
7. Copy the backend's domain from the project page, e.g. `sipkak-backend.vercel.app`, and check it:
   `https://sipkak-backend.vercel.app/api/health` should show `{"ok":true,"store":"supabase"}`.

## 2. Point the frontend at the backend

1. In `frontend/vercel.json`, replace `REPLACE-WITH-YOUR-BACKEND` with your backend's name, so the first rewrite reads, for example:

   ```json
   "destination": "https://sipkak-backend.vercel.app/api/$1"
   ```

2. Commit and push that change.

## 3. Deploy the frontend

1. In Vercel, click **Add New… → Project** and import the **same repository** again.
2. Set **Root Directory** to **`frontend`**. **Framework Preset** should say **Vite** (build command `npm run build`, output directory `dist`).
3. Optional, for the demo: add the environment variable `VITE_DEMO_REPORTER_ID` = `00000000-0000-4000-8000-000000000001`. Every visitor then counts as the demo reporter, so the seed reports show up under My reports and Notifications. Leave it out to give every browser its own reporter ID.
4. Click **Deploy**.
5. Open the frontend's domain, e.g. `https://sipkak.vercel.app`:
   - the campus map shows the 8 seed reports;
   - `https://sipkak.vercel.app/api/health` shows `{"ok":true,"store":"supabase"}` (it went through the rewrite);
   - `https://sipkak.vercel.app/admin` asks for the `ADMIN_PASSWORD` you set.

From now on, every push to `main` redeploys both projects. Vercel skips a project when nothing in its folder changed.

## 4. Check the deployed API with the smoke script

From the repository root on your computer:

```powershell
$env:API_URL="https://sipkak-backend.vercel.app"; $env:ADMIN_PASSWORD="<your admin password>"; npm run smoke -w backend
```

It should end with `17 passed, 0 failed`. Each run adds one "Smoke test" report to the database; run `seed.sql` again in Supabase to go back to the clean demo data.

## Good to know

- **Environment variables only apply to new deployments.** After changing one, open **Deployments**, click **⋯** on the latest one and choose **Redeploy**.
- **Request size:** Vercel Functions accept request bodies up to 4.5 MB. Photos are shrunk in the browser to about 100 KB, so this only matters for very large uploads that skip the form.
- **Changing `ADMIN_TOKEN`** signs every admin out: the app sends them back to the sign-in page.
- **Secrets:** `SUPABASE_SECRET_KEY`, `ADMIN_PASSWORD` and `ADMIN_TOKEN` belong only in the backend project's environment variables, never in the frontend project or in the repository.
