import dotenv from 'dotenv';
dotenv.config();

// Core API configuration from environment variables
const coreHost = process.env.CORE_HOST;
const corePort = process.env.CORE_PORT;
const coreApiKey = process.env.CORE_API_KEY;
const coreApiPath = process.env.CORE_API_PATH;

// Fetch queue data from core API
const checkQueue = async () => {
    const response = await fetch(`http://${coreHost}:${corePort}${coreApiPath}`, {
        headers: {
            'Authorization': `Bearer ${coreApiKey}`
        }
    });

    const data = (await response.json());
    console.log(data);
    return JSON.stringify(data);
}

export default checkQueue;