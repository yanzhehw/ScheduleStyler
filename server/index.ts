// Load environment variables FIRST (before any other imports that use them)
import { env } from "./env";

import express from "express";
import cors from "cors";
import { adaptVercelHandler, adaptVercelHandlerWithParams } from "./vercel-adapter";

// Import Vercel API handlers (centralized source of truth)
import * as redeem from "../api/redeem";
import * as markUsed from "../api/mark-used";
import * as backgroundsIndex from "../api/backgrounds/index";
import * as backgroundsFile from "../api/backgrounds/[type]/[filename]";
import * as trackDownload from "../api/track/download";
import * as trackUser from "../api/track/user";
import * as trackStats from "../api/track/stats";
import * as githubWebhook from "../api/webhooks/github";

const app = express();
const PORT = env.SERVER_PORT;

// Middleware
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:3000"],
  credentials: true,
}));
app.use(express.json());

// Routes - adapted from Vercel serverless functions
app.all("/api/redeem", adaptVercelHandler(redeem));
app.all("/api/mark-used", adaptVercelHandler(markUsed));
app.all("/api/backgrounds", adaptVercelHandler(backgroundsIndex));
app.all("/api/backgrounds/:type/:filename", adaptVercelHandlerWithParams(backgroundsFile));
app.all("/api/track/download", adaptVercelHandler(trackDownload));
app.all("/api/track/user", adaptVercelHandler(trackUser));
app.all("/api/track/stats", adaptVercelHandler(trackStats));
app.all("/api/webhooks/github", adaptVercelHandler(githubWebhook));

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
