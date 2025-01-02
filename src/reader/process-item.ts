import { LogGenerator } from '../logGenerator';
import { chromium } from 'playwright-core';
import TurndownService from 'turndown';

const logGenerator = new LogGenerator();
const turndownService = new TurndownService();

// Process a queue item and update its status in the core API
export const processItem = async (data: any, broadcast: (message: string) => void) => {
    // Log the start of processing
    try {
        const url = data.url.url;
        console.log(`processing item ${data.id} ${url}`);
        let log = logGenerator.generateLog(`processing item ${data.id} ${url}`);
        broadcast(JSON.stringify(log));

        // Send POST request to core API to update item status
        var response = await fetch(`http://${process.env.CORE_HOST}:${process.env.CORE_PORT}${process.env.CORE_API_PATH}`, {
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
        let responseData = await response.json();
        log = logGenerator.generateLog(JSON.stringify(responseData));
        broadcast(JSON.stringify(log));

        // Fetch and process webpage content
        const html = await fetchUrl(url);
        const markdown = turndownService.turndown(html);
        log = logGenerator.generateLog(`Converted HTML to Markdown, length: ${markdown.length}`);
        broadcast(JSON.stringify(log));

        // Send POST request to core API to update item status with markdown
        response = await fetch(`http://${process.env.CORE_HOST}:${process.env.CORE_PORT}${process.env.CORE_API_PATH}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.CORE_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                queueId: data.id,
                status: "COMPLETED",
                markdown: markdown
            })
        });

        responseData = await response.json();
        log = logGenerator.generateLog(JSON.stringify(responseData));
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

        // Navigate to URL with longer timeout
        await page.goto(url, { timeout: 60000 });
        
        // Wait for full page load
        await Promise.all([
            page.waitForLoadState('load'),
            page.waitForLoadState('domcontentloaded'),
            page.waitForLoadState('networkidle'),
        ]);

        // Scroll through the page to trigger lazy loading
        await page.evaluate(async () => {
            await new Promise<void>((resolve) => {
                let totalHeight = 0;
                const distance = 100;
                const timer = setInterval(() => {
                    const scrollHeight = document.body.scrollHeight;
                    window.scrollBy(0, distance);
                    totalHeight += distance;

                    if(totalHeight >= scrollHeight){
                        clearInterval(timer);
                        resolve();
                    }
                }, 100);
            });
        });

        // Wait for dynamic content
        await page.waitForTimeout(4000);
        
        // Get the fully rendered HTML after all modifications
        const html = await page.evaluate(() => {
            // Remove any script tags to prevent execution
            const scripts = document.getElementsByTagName('script');
            while(scripts.length > 0) {
                scripts[0].parentNode?.removeChild(scripts[0]);
            }
            return document.documentElement.outerHTML;
        });

        return html;
    } finally {
        await browser.close();
    }
}