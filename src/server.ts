import express from 'express';
import { createServer } from 'http';
import WebSocket from 'ws';
import path from 'path';
import { LogGenerator } from './logGenerator';
import { checkQueue } from './reader';

// Initialize Express and WebSocket server
const app = express();
const server = createServer(app);
const wss = new WebSocket.Server({ server });

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
    console.log('Client connected');
    
    const logGenerator = new LogGenerator();
    
    // Main loop: check queue and send updates every second
    do {
       const data = await checkQueue();
       const log = logGenerator.generateLog(data);
       ws.send(JSON.stringify(log));
       await new Promise(resolve => setTimeout(resolve, 1000));
    } while (runLoop);

    // Cleanup on connection close
    ws.on('close', () => {
        console.log('Client disconnected');
        runLoop = false;
    });
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 