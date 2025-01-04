import { LogGenerator } from '../logGenerator';
import { chromium } from 'playwright-core';
import TurndownService from 'turndown';
import { readFileSync } from 'fs';
import path from 'path';
import { Server } from 'socket.io';
import { fieldProcessor } from './field-processor';
const logGenerator = new LogGenerator();
const turndownService = new TurndownService();

// Read the inject script at startup
const injectScript = readFileSync(path.join(__dirname, '../injector/dist/inject-single.js'), 'utf-8');

// Process a queue item and update its status in the core API
export const processItem = async (data: any, io: Server) => {
    // Log the start of processing
    try {
        const url = data.url.url;
        let log = logGenerator.generateLog(`processing item ${data.id} ${url}`);
        io.to('system-message').emit('log', log);

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
        io.to('system-message').emit('result0', {title:"processing", message: responseData.url.url, timestamp: new Date().toISOString() });

        // Fetch and process webpage content
        const { title, mainText, html, reducedHtml, readabilityHtml } = await fetchUrl(url);
        const markdown = turndownService.turndown(html);

        io.to('system-message').emit('result1', {title:"title", message: title, timestamp: new Date().toISOString() });
        io.to('system-message').emit('result2', {title:"mainText", message: mainText, timestamp: new Date().toISOString() });
        io.to('system-message').emit('result3', {title:"html", message: html, timestamp: new Date().toISOString() });
        io.to('system-message').emit('result4', {title:"reducedHtml", message: reducedHtml.html, timestamp: new Date().toISOString() });
        io.to('system-message').emit('result5', {title:"readabilityHtml", message: readabilityHtml.textContent, timestamp: new Date().toISOString() });
        io.to('system-message').emit('result6', {title:"markdown", message: markdown, timestamp: new Date().toISOString() });

        fieldProcessor(data, {title, mainText, html, reducedHtml, readabilityHtml, markdown});


        // Send POST request to core API to update item status with markdown
        response = await fetch(`http://${process.env.CORE_HOST}:${process.env.CORE_PORT}${process.env.CORE_API_PATH}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.CORE_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                queueId: data.id,
                status: "COMPLETED"
            })
        });

        responseData = await response.json();
        log = logGenerator.generateLog(JSON.stringify(responseData));
        io.to('system-message').emit('log', log);

    } catch (error) {
        // Handle and broadcast any errors during processing
        const errorLog = logGenerator.generateLog(`Error posting status: ${error}`);
        io.to('system-message').emit('error', errorLog);
    }
}

// Fetch webpage content using Playwright
const fetchUrl = async (url: string): Promise<any> => {
    const browser = await chromium.launch({
        executablePath: process.env.CHROME_EXECUTABLE_PATH
    });

    try {
        const context = await browser.newContext();
        const page = await context.newPage();

        await Promise.all([
            page.waitForLoadState('load'),
            page.waitForLoadState('domcontentloaded'),
            page.waitForLoadState('networkidle'),
        ]);

        await page.goto(url, { timeout: 5000 });

        await page.waitForTimeout(1000);
        await page.evaluate(async () => {
            await new Promise<void>((resolve) => {
                let totalHeight = 0;
                const distance = 200;
                const timer = setInterval(() => {
                    const scrollHeight = document.body.scrollHeight;
                    window.scrollBy(0, distance);
                    totalHeight += distance;

                    if (totalHeight >= scrollHeight) {
                        clearInterval(timer);
                        resolve();
                    }
                }, 50);
            });
        });

        // Inject and execute the script to get the page title
        const domExtractions = await page.evaluate(injectScript);

        return domExtractions;
    } finally {
        await browser.close();
    }
}