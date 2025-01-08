import { LogGenerator } from '../logGenerator';
import { chromium } from 'playwright-core';
import TurndownService from 'turndown';
import { readFileSync } from 'fs';
import path from 'path';
import { Server } from 'socket.io';
import { fieldProcessor } from './field-processor';
import { extractList } from './llm';

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
        if (responseData.url.contentPage) {
            await processPage(data, responseData.url.url, responseData, io);
        }

        if (responseData.url.listPage) {
            await processList(data, responseData.url.url, responseData, io);
        }

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

const processPage = async (data: any, url: string, responseData: any, io: Server) => {
    io.to('system-message').emit('result0', { title: "processing content Page", message: responseData.url.url, timestamp: new Date().toISOString() });

    // Fetch and process webpage content
    const { title, mainText, html, reducedHtml, readabilityHtml } = await fetchUrl(url);
    const markdown = turndownService.turndown(html);

    io.to('system-message').emit('result2', { title: "title", message: title });
    io.to('system-message').emit('result3', { title: "mainText", message: mainText });
    io.to('system-message').emit('result4', { title: "html", message: html });
    io.to('system-message').emit('result5', { title: "reducedHtml", message: reducedHtml.html, timestamp: new Date().toISOString() });
    io.to('system-message').emit('result6', { title: "readabilityHtml", message: readabilityHtml.textContent });
    io.to('system-message').emit('result7', { title: "markdown", message: markdown });

    const lengths = `title: ${title.length.toLocaleString()}, 
    mainText: ${mainText.length.toLocaleString()},
    html: ${html.length.toLocaleString()}, 
    reducedHtml: ${JSON.stringify(reducedHtml).length.toLocaleString()}, 
    readabilityHtml: ${JSON.stringify(readabilityHtml).length.toLocaleString()}, 
    markdown: ${markdown.length.toLocaleString()}`;
    io.to('system-message').emit('result8', { title: "lengths", message: lengths });

    const fieldData = await fieldProcessor(data, { title, mainText, html, reducedHtml, readabilityHtml, markdown }, io);
    const body = JSON.stringify({
        queueId: data.id,
        status: "COMPLETED",
        fieldData: fieldData
    })

    // Send POST request to core API to update item status with markdown
    const response = await fetch(`http://${process.env.CORE_HOST}:${process.env.CORE_PORT}${process.env.CORE_API_PATH}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.CORE_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: body
    });

    responseData = await response.json();
    const log = logGenerator.generateLog(JSON.stringify(responseData));
    io.to('system-message').emit('log', log);
}

// @ts-ignore
const processList = async (data: any, url: string, responseData: any, io: Server) => {
    io.to('system-message').emit('result0', { title: "processing list Page", message: data.url.url, timestamp: new Date().toISOString() });
    // Fetch and process webpage content
    const { title, mainText, html, reducedHtml, readabilityHtml } = await fetchUrl(url);
    const markdown = turndownService.turndown(html);

    io.to('system-message').emit('result2', { title: "title", message: title });
    io.to('system-message').emit('result3', { title: "mainText", message: mainText });
    io.to('system-message').emit('result4', { title: "html", message: html });
    io.to('system-message').emit('result5', { title: "reducedHtml", message: reducedHtml.html, timestamp: new Date().toISOString() });
    io.to('system-message').emit('result6', { title: "readabilityHtml", message: readabilityHtml.textContent });
    io.to('system-message').emit('result7', { title: "markdown", message: markdown });

    const lengths = `title: ${title.length.toLocaleString()}, 
    mainText: ${mainText.length.toLocaleString()},
    html: ${html.length.toLocaleString()}, 
    reducedHtml: ${JSON.stringify(reducedHtml).length.toLocaleString()}, 
    readabilityHtml: ${JSON.stringify(readabilityHtml).length.toLocaleString()}, 
    markdown: ${markdown.length.toLocaleString()}`;
    io.to('system-message').emit('result8', { title: "lengths", message: lengths });

    const listData = await extractList(data, { title, mainText, html, reducedHtml, readabilityHtml }, io);
    io.to('system-message').emit('result9', { title: "listData", message: listData });
}