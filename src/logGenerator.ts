export class LogGenerator {
    private startTime: Date;

    constructor() {
        this.startTime = new Date();
    }

    // Generate log entry with system stats and custom message
    generateLog(message: string): LogEntry {
        const currentTime = new Date();
        const uptime = Math.floor((currentTime.getTime() - this.startTime.getTime()) / 1000);
        
        return {
            title: "log",
            timestamp: currentTime.toISOString(),
            uptime: `${uptime} seconds`,
            memory: process.memoryUsage().heapUsed / 1024 / 1024, // Memory in MB
            cpu: process.cpuUsage(),
            message: message
        };
    }
}

// Log entry structure
export interface LogEntry {
    title: string;
    timestamp: string;
    uptime: string;
    memory: number;
    cpu: NodeJS.CpuUsage;
    message: string;
} 