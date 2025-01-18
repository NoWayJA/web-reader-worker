import { extractList } from './llm';
import { LogGenerator } from '../logGenerator';
import TurndownService from 'turndown';
import { fetchUrl } from './fetch-url';


const logGenerator = new LogGenerator();
const turndownService = new TurndownService();

// @ts-ignore
const processList = async (data: any, url: string, responseData: any, io: Server) => {
    io.to('system-message').emit('clear-result-boxes');
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

            // Send POST request to core API to update item status
            var response = await fetch(`http://${process.env.CORE_HOST}:${process.env.CORE_PORT}${process.env.CORE_API_PATH}/list`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.CORE_API_KEY}`,
                    'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            queueId: data.id,
            status: "COMPLETED",
            fieldData: listData
        })
    });

    responseData = await response.json();
    const log = logGenerator.generateLog(JSON.stringify(responseData));
    io.to('system-message').emit('log', log);
}

export { processList };