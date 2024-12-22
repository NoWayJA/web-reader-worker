import dotenv from 'dotenv';
import WebSocket from 'ws';
import { LogGenerator } from '../logGenerator';
dotenv.config();

// Core API configuration from environment variables
const coreHost = process.env.CORE_HOST;
const corePort = process.env.CORE_PORT;
const coreApiKey = process.env.CORE_API_KEY;
const coreApiPath = process.env.CORE_API_PATH;

const logGenerator = new LogGenerator();
// Fetch queue data from core API
const checkQueue = async (ws: WebSocket) => {
    try {
        const response = await fetch(`http://${coreHost}:${corePort}${coreApiPath}`, {
            headers: {
                'Authorization': `Bearer ${coreApiKey}`
        }
    });

    const data = (await response.json());
        console.log(data);
        const log = logGenerator.generateLog(JSON.stringify(data));
        ws.send(JSON.stringify(log));
        return JSON.stringify(data);
    } catch (error) {
        console.error('Error fetching queue data:', error);
        const log = logGenerator.generateLog('Error fetching queue data');
        ws.send(JSON.stringify(log));
        return null;
    }
}

export default checkQueue;