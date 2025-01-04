import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { checkQueue } from './reader';
import { LogGenerator } from './logGenerator';

// Initialize Express and Socket.io server
const app = express();
const server = createServer(app);
const io = new Server(server);
const logGenerator = new LogGenerator();

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Route for main status page
app.get('/', (_req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Control flag for main processing loop
var runLoop = true;

// Handle socket.io connections
io.on('connection', (socket) => {
    socket.join('system-message');
    const log = logGenerator.generateLog("New client joined system-message group");
    io.to('system-message').emit('log', log);

    socket.on('disconnect', () => {
        const log = logGenerator.generateLog("Client left system-message group");
        io.to('system-message').emit('log', log);
    });
});

// Start server and begin processing queue
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    startQueueCheck();
});

// Main processing loop: check queue and broadcast updates
async function startQueueCheck() {
    while (runLoop) {
        try {
            await checkQueue(io);
        } catch (error) {
            const errorLog = logGenerator.generateLog(`Error: ${error}`);
            io.to('system-message').emit('log', errorLog);
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}

