import {  schemaPreamble, schema, extractPreamble } from "./prompts";


const extract = async (field: any, pageData: any) => {
    // @ts-ignore
    const prompt = `${field.prompt} ${schemaPreamble} ${schema} ${extractPreamble} ${JSON.stringify(pageData)}`;
    const response = "tmp response";
    return response;
}

export { extract };