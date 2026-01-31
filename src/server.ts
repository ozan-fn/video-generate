import express, { Express } from "express";
import path from "path";
import compression from "compression";
import { createServer } from "http";
import { Server } from "socket.io";
import apiRoutes from "./routes/api";
import registerSocketHandlers from "./socket";

const app: Express = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3001;

app.use(compression({ level: 6 }));
app.use(express.json());

const storagePath = path.join(process.cwd(), "storages");
app.use("/storages", express.static(storagePath));

app.use("/api", apiRoutes);

const distPath = path.join(__dirname, "../client/dist");
app.use(express.static(distPath));

app.use((_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
});

const io = new Server(httpServer, {
    cors: {
        origin: "*",
    },
});

registerSocketHandlers(io);

httpServer.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});

export { httpServer, io, app };
