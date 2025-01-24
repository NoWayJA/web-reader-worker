import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { LogGenerator } from '../logGenerator';
import { processItem } from './process-item';
dotenv.config();

// Core API configuration from environment variables
const coreHost = process.env.CORE_HOST;
const corePort = process.env.CORE_PORT;
const coreApiKey = process.env.CORE_API_KEY;
const coreApiPath = process.env.CORE_API_PATH;
const workerGroup = process.env.WORKER_GROUP;
const logGenerator = new LogGenerator();

// Fetch and process items from the queue, broadcasting status updates
const checkQueue = async (io: Server): Promise<string | null> => {
    // Notify clients that queue check is starting
    let log = logGenerator.generateLog("Checking queue");
    io.to('system-message').emit('log', log);
    
    try {
        // Fetch queue data from core API
        const response = await fetch(`http://${coreHost}:${corePort}${coreApiPath}`, {
            headers: {
                'Authorization': `Bearer ${coreApiKey}`,
                'WorkerGroup': workerGroup || ''
            }
        });

        const data = await response.json() as any;
        log = logGenerator.generateLog(JSON.stringify(data) as string);
        io.to('system-message').emit('log', log);

        // Process queue item if valid ID exists
        if (data.hasOwnProperty('id')) {
            await processItem(data, io);
        }
        return null;
    } catch (error) {
        // Broadcast any errors that occur during queue processing
        log = logGenerator.generateLog(`Error fetching queue data: ${error}`);
        io.to('system-message').emit('log', log);
        return null;
    }
}

export default checkQueue;