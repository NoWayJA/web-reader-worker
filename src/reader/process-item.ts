import { LogGenerator } from '../logGenerator';
const logGenerator = new LogGenerator();

export const processItem = async (data: any, broadcast: (message: string) => void) => {

    const log = logGenerator.generateLog(`processing item ${data.id}`);
    broadcast(JSON.stringify(log));

    try {
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
        const responseData = await response.json();
        const log = logGenerator.generateLog(JSON.stringify(responseData));
        broadcast(JSON.stringify(log));
    } catch (error) {
        const errorLog = logGenerator.generateLog(`Error posting status: ${error}`);
        broadcast(JSON.stringify(errorLog));
    }
}