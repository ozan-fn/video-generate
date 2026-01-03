import { config } from "dotenv";
config({ override: true });
import express from "express";
import compression from "compression";
import authRouter, { authenticateToken } from "./features/auth/auth.js";
import generateRouter from "./features/generate/route.js";
import generateVideoRouter from "./features/generate-video/route.js";
import mongoose from "mongoose";
import path from "path";

mongoose.connect(process.env.DATABASE_URL!);

const app = express();
const port = 3000;

app.use(compression());
app.use(express.json({ limit: "10mb" }));

app.use("/api/auth", authRouter);
app.use("/api/generate", generateRouter);
app.use("/api/generate-video", generateVideoRouter);

app.get("/api/protected", authenticateToken, (req, res) => {
    res.json({ message: "This is a protected route", user: (req as any).user });
});

// Serve static files from dist
app.use(express.static(path.join(__dirname, "../../dist")));

// Catch-all handler: send back index.html for any non-API routes
app.use((req, res) => {
    res.sendFile(path.join(__dirname, "../../dist/index.html"));
});

app.listen(port, () => {
    console.log(`🟢 Server running at http://localhost:${port}`);
});
