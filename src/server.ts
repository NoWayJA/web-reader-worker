import express from 'express';
import { createServer } from 'http';
import WebSocket from 'ws';
import path from 'path';
import { checkQueue } from './reader';
import { LogGenerator } from './logGenerator';

// Initialize Express and WebSocket server
const app = express();
const server = createServer(app);
const wss = new WebSocket.Server({ server });
const logGenerator = new LogGenerator();

// Broadcast function to send message to all clients
function broadcast(message: string) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Route for main status page
app.get('/', (_req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Control flag for WebSocket loop
var runLoop = true;

// Handle new WebSocket connections
wss.on('connection', async (ws) => {
    const log = logGenerator.generateLog("New client joined system-message group");
    broadcast(JSON.stringify(log));

    ws.on('close', () => {
        const log = logGenerator.generateLog("Client left system-message group");
        broadcast(JSON.stringify(log));
    });
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    startQueueCheck();
}); 

// Separate async function to handle queue checking
async function startQueueCheck() {
    while (runLoop) {
        try {
            await checkQueue(broadcast);

        } catch (error) {
            const errorLog = logGenerator.generateLog(`Error: ${error}`);
            broadcast(JSON.stringify(errorLog));
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}

