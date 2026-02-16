require('dotenv').config();

const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const pollRoutes = require('./routes/polls');
const initPollSocket = require('./socket/pollSocket');

const app = express();
const server = http.createServer(app);

let CORS_ORIGIN = process.env.CLIENT_URL || 'http://localhost:5173';
if (CORS_ORIGIN.endsWith('/')) {
    CORS_ORIGIN = CORS_ORIGIN.slice(0, -1);
}

app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());

app.use('/api/polls', pollRoutes);

app.get('/', (_req, res) => {
    res.json({ status: 'Polling API is running' });
});

const io = new Server(server, {
    cors: {
        origin: CORS_ORIGIN,
        methods: ['GET', 'POST'],
    },
});

initPollSocket(io);

const PORT = process.env.PORT || 5000;

mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('Connected to MongoDB');
        server.listen(PORT, () => {
            console.log(`Server listening on http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        console.error('MongoDB connection error:', err.message);
        process.exit(1);
    });
