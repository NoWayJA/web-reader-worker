import { LogGenerator } from '../logGenerator';
import { chromium } from 'playwright-core';

const logGenerator = new LogGenerator();

// Process a queue item and update its status in the core API
export const processItem = async (data: any, broadcast: (message: string) => void) => {
    // Log the start of processing
    try {
        const url = data.url.url;
        console.log(`processing item ${data.id} ${url}`);
        let log = logGenerator.generateLog(`processing item ${data.id} ${url}`);
        broadcast(JSON.stringify(log));

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
        log = logGenerator.generateLog(JSON.stringify(responseData));
        broadcast(JSON.stringify(log));

        // Fetch and process webpage content
        const html = await fetchUrl(url);
        log = logGenerator.generateLog(`Fetched HTML content length: ${html.length}`);
        broadcast(JSON.stringify(log));

    } catch (error) {
        // Handle and broadcast any errors during processing
        const errorLog = logGenerator.generateLog(`Error posting status: ${error}`);
        broadcast(JSON.stringify(errorLog));
    }
}

// Fetch webpage content using Playwright
const fetchUrl = async (url: string): Promise<string> => {
    const browser = await chromium.launch({
        executablePath: process.env.CHROME_EXECUTABLE_PATH
    });
    
    try {
        const context = await browser.newContext();
        const page = await context.newPage();
        
        // Navigate and wait for network idle
        await page.goto(url, { waitUntil: 'networkidle' });
        
        // Get the full HTML content
        const html = await page.content();
        
        return html;
    } finally {
        // Always close the browser
        await browser.close();
    }
}