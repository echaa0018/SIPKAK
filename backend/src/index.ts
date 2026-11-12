import express from 'express';
import { createApp } from './createApp.js';

// Vercel's entry point. Vercel's zero-config Express looks for a src/index.ts that imports and
// uses express, and serves its default export itself, so never call listen() here.
// The real app (createApp) is mounted on a plain express() app.
const app = express();
app.use(createApp());

export default app;
