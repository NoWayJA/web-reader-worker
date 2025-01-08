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
    "description": "The extracted ${fieldName} from the web page",
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

const schemaListPreamble = `The following is a schema for a web page. It is used to describe the content of the web page. 
The content has been extracted in various formats. This is to help identify the most relevant content for the user.`;

// @ts-ignore
const listSchema = (config: string) => {
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
  
Output JSON Schema
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://bluecat.ai/product.schema.json",
  "title": "Output JSON Information",
  "description": "Expression that identifies list items",
  "type": "object",
  "properties": {
    "success": {
      "type": "boolean",
      "description": "Whether the expression extraction was successful"
    },
      "contentAmount": {
      "type": "string",
      "description": "title/part/full/mix which describes the amount of content associated with each list item",
    },
    "regex": {
      "type": "string",
      "description": "the regular expression that identifies the list urls for the articles"
    }
  }
}
`;
};

const extractListPreamble = 'using this schema and the matching json below. Extract the list expression and return in the exact JSON format as requested by the user and matching the output schema. your entire response/output is going to consist of a single JSON object {}, and you will NOT wrap it within JSON md markers : ';

export { schemaPreamble, schema, extractPreamble, schemaListPreamble, listSchema, extractListPreamble };
