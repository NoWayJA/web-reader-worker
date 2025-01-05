const schemaPreamble = `The following is a schema for a web page. It is used to describe the content of the web page. 
The content has been extracted in various formats. This is to help identify the most relevant content for the user.`;

// const schema = `{
//   "$schema": "https://json-schema.org/draft/2020-12/schema",
//   "$id": "https://bluecat.ai/product.schema.json",
//   "title": "WebPage",
//   "description": "A selection of representations of a web page",
//   "type": "object",
//   "properties": {
//     "title": {
//       "type": "string",
//       "description": "The title of the page, based on metadata and content"
//     },
//     "mainText": {
//       "type": "string",
//       "description": "The main text of the page, based on word density from the content"
//     },
//     "html": {
//       "type": "string",
//       "description": "The html of the page body"
//     },
//     "reducedHtml": {
//       "type": "string",
//       "description": "The html of the page body, without scripts, styles, invisible elements and other non-content elements"
//     },
//     "readabilityHtml": {
//       "type": "string",
//       "description": "The html of the page body, formatted for readability"
//     },
//     "markdown": {
//       "type": "string",
//       "description": "The markdown of the page body, formatted for readability"
//     }
//   }
// }`;

const schema = (fieldName: string) => {
    return `
Input WebPage Schema
{
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "$id": "https://bluecat.ai/product.schema.json",
    "title": "Input WebPage Information",
    "description": "A selection of representations of a web page",
    "type": "object",
    "properties": {
      "title": {
        "type": "string",
        "description": "The title of the page, based on metadata and content"
      },
      "mainText": {
        "type": "string",
        "description": "The main text of the page, based on word density from the content"
      },
      "readabilityHtml": {
        "type": "string",
        "description": "The html of the page body, formatted for readability"
      }
    }
  }
    
Output WebPage Schema
{
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "$id": "https://bluecat.ai/product.schema.json",
    "title": "Output WebPage Information",
    "description": "A selection of representations of a web page",
    "type": "object",
    "properties": {
      "success": {
        "type": "boolean",
        "description": "Whether the extraction was successful"
      },
      "${fieldName}": {
        "type": "string",
        "description": "The extracted information"
      }
    }
  }
  
  `;
};

const extractPreamble = 'using this schema and the matching json below. Extract the field as requested by the user.';

export { schemaPreamble, schema, extractPreamble };
