import {
    schemaPreamble, schema, extractPreamble,
    schemaListPreamble, listSchema, extractListPreamble
} from "./prompts";
import { ChatOpenAI } from "@langchain/openai";
import { Ollama } from "@langchain/ollama";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { Server } from 'socket.io';

const openaiKey = process.env.OPENAI_API_KEY;
const defaultAIEngine = "gpt-4o-mini";

// Select appropriate AI model based on configuration
const selectModel = (modelName: string) => {
    let langchainModel: any = null;
    switch (modelName) {
        case "gpt-3.5-turbo":
            langchainModel = new ChatOpenAI({
                model: "gpt-3.5-turbo",
                openAIApiKey: openaiKey,
            });
            break;
        case "gpt-4o":
            langchainModel = new ChatOpenAI({
                model: "gpt-4o",
                openAIApiKey: openaiKey,
            });
            break;
        case "gpt-4o-mini":
            langchainModel = new ChatOpenAI({
                model: "gpt-4o-mini",
                openAIApiKey: openaiKey,
            });
            break;
        case "llama3.1:70b":
            langchainModel = new Ollama({
                baseUrl: "http://localhost:11434",
                model: "llama3.1:70b",
            });
            break;
        default:
            langchainModel = new Ollama({
                baseUrl: "http://localhost:11434",
                model: "llama3.1:70b",
            });
            break;
    }
    return langchainModel;
}

// Extract specific fields from webpage content using AI
const extract = async (field: any, pageData: any, io: Server) => {
    const prompt = `
    ${field.prompt} 
    ${schemaPreamble} 
    ${schema(field.name)} 
    ${extractPreamble}
    `;
    const langchainModel = selectModel(defaultAIEngine);
    const messages = [
        new SystemMessage(prompt),
        new HumanMessage(JSON.stringify(pageData.readabilityHtml)),
    ];

    const stream = await langchainModel.stream(messages);
    let retval = "";
    let alertval = "";
    io.to('system-message').emit("clearSocket");
    for await (let chunk of stream) {
        let text: string = defaultAIEngine.startsWith("llama") ? chunk : chunk.text;
        retval += text.replace(/\n/g, "<br>");
        alertval += text;
        retval = retval.replace(/<(?!\/?(br|strong)\b)[^>]*>/gi, "");
        io.to('system-message').emit("socket", text);
        process.stdout.write(text);
    }
    return retval;
}

// Extract list information from webpage content using AI
const extractList = async (data: any, pageData: any, io: Server) => {
    const prompt = `
    ${data.url.configuration.listPrompt} 
    ${schemaListPreamble} 
    ${listSchema(data.url.configuration.name)} 
    ${extractListPreamble}
    `;
    const langchainModel = selectModel(defaultAIEngine);
    const messages = [
        new SystemMessage(prompt),
        new HumanMessage(JSON.stringify(pageData.readabilityHtml)),
    ];

    const stream = await langchainModel.stream(messages);
    let retval = "";
    let alertval = "";
    io.to('system-message').emit("clearSocket");
    for await (let chunk of stream) {
        let text: string = defaultAIEngine.startsWith("llama") ? chunk : chunk.text;
        retval += text.replace(/\n/g, "<br>");
        alertval += text;
        retval = retval.replace(/<(?!\/?(br|strong)\b)[^>]*>/gi, "");
        io.to('system-message').emit("socket", text);
        process.stdout.write(text);
    }
    return alertval;
}

export { extract, extractList };