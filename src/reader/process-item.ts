import { LogGenerator } from '../logGenerator';
const logGenerator = new LogGenerator();
export const processItem = async (data: any, broadcast: (message: string) => void) => {

    const log = logGenerator.generateLog(`processing item ${data.id}`);
    broadcast(JSON.stringify(log));
}