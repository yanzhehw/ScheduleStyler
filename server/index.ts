// Load environment variables FIRST (before any other imports that use them)
import { env } from "./env";

import express from "express";
import cors from "cors";
import { redeemRouter } from "./routes/redeem";
import { markUsedRouter } from "./routes/mark-used";
import { backgroundsRouter } from "./routes/backgrounds";
import { trackRouter } from "./routes/track";
import { githubWebhookRouter } from "./routes/github-webhook";

const app = express();
const PORT = env.SERVER_PORT;

// Middleware
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:3000"],
  credentials: true,
}));
app.use(express.json());

// Routes
app.use("/api/redeem", redeemRouter);
app.use("/api/mark-used", markUsedRouter);
app.use("/api/backgrounds", backgroundsRouter);
app.use("/api/track", trackRouter);
app.use("/api/webhooks/github", githubWebhookRouter);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
