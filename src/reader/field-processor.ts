import { Server } from 'socket.io';
import { extract } from './llm';

const fieldProcessor = async (requestData: any, _pageData: any, io: Server) => {
    let returnData: any = {};
    for (const field of requestData.url.configuration.fields) {
        const result = await extract(field.child, _pageData, io);
        returnData[field.child.name] = result;
    }
    return returnData;
}

export { fieldProcessor };