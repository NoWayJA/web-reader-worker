import express from 'express';
import { createServer } from 'http';
import WebSocket from 'ws';
import path from 'path';
import { LogGenerator } from './logGenerator';

const app = express();
const server = createServer(app);
const wss = new WebSocket.Server({ server });

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Serve the status page
app.get('/', (_req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

var runLoop = true;

// WebSocket connection handler
wss.on('connection', async (ws) => {
    console.log('Client connected');
    
    const logGenerator = new LogGenerator();
    
    do {
        const log = logGenerator.generateLog();
        ws.send(JSON.stringify(log));
        await new Promise(resolve => setTimeout(resolve, 1000));
    } while (runLoop);

    ws.on('close', () => {
        console.log('Client disconnected');
        runLoop = false;
    });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 