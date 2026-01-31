import express, { Express } from "express";
import path from "path";
import compression from "compression";
import apiRoutes from "./routes/api";

const app: Express = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(compression({ level: 6 }));
app.use(express.json());

// API Routes
app.use("/api", apiRoutes);

// Serve static files from client/dist
const distPath = path.join(__dirname, "../client/dist");
app.use(express.static(distPath));

// SPA fallback - serve index.html for all non-API routes
app.get(/^(?!\/api\/)/, (_req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

export default app;
