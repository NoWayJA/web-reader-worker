import { LogGenerator } from '../logGenerator';
const logGenerator = new LogGenerator();

// Process a queue item and update its status in the core API
export const processItem = async (data: any, broadcast: (message: string) => void) => {
    // Log the start of processing
    const log = logGenerator.generateLog(`processing item ${data.id}`);
    broadcast(JSON.stringify(log));

    try {
        // Send POST request to core API to update item status
        const response = await fetch(`http://${process.env.CORE_HOST}:${process.env.CORE_PORT}${process.env.CORE_API_PATH}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.CORE_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                queueId: data.id,
                status: "PROCESSING"
            })
        });

        // Broadcast the API response
        const responseData = await response.json();
        const log = logGenerator.generateLog(JSON.stringify(responseData));
        broadcast(JSON.stringify(log));
    } catch (error) {
        // Handle and broadcast any errors during processing
        const errorLog = logGenerator.generateLog(`Error posting status: ${error}`);
        broadcast(JSON.stringify(errorLog));
    }
}