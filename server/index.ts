// Load environment variables FIRST (before any other imports that use them)
import { env } from "./env";

import express from "express";
import cors from "cors";
import { redeemRouter } from "./routes/redeem";

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

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
