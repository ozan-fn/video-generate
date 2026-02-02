import express, { Express } from 'express';
import path from 'path';
import compression from 'compression';
import { createServer } from 'http';
import { Server } from 'socket.io';
import apiRoutes from './routes/api';
import registerSocketHandlers from './socket';
import sessionRoutes from './routes/sessionRoutes';
import bodyParser from 'body-parser';

const app: Express = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3001;

app.use(compression({ level: 6 }));
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', apiRoutes);
app.use('/api/session', sessionRoutes);

const distPath1 = path.join(__dirname, '../storages');
app.use('/storages', express.static(distPath1));

const distPath = path.join(__dirname, '../client/dist');
app.use(express.static(distPath));

app.use((_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
});

const io = new Server(httpServer, {
    cors: {
        origin: '*',
    },
});

// registerSocketHandlers(io);

httpServer.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});

export { httpServer, io, app };
