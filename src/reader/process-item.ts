import { LogGenerator } from '../logGenerator';
import TurndownService from 'turndown';
import { Server } from 'socket.io';
import { fieldProcessor } from './field-processor';
import { processList } from './list-processor';
import { fetchUrl } from './fetch-url';


const logGenerator = new LogGenerator();
const turndownService = new TurndownService();

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

const processPage = async (data: any, url: string, responseData: any, io: Server) => {
    io.to('system-message').emit('clear-result-boxes');
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


