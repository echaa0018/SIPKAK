import { existsSync } from 'node:fs';
import { createApp } from './createApp.js';

// Local development only. On Vercel, env vars come from the dashboard.
if (existsSync('.env')) process.loadEnvFile();

const port = Number(process.env.PORT ?? 3001);
createApp().listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
});
