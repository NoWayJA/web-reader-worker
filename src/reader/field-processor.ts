

const fieldProcessor = async (requestData: any, _pageData: any) => {

 //   console.log("fieldProcessor", requestData.url.configuration.fields, pageData);
    requestData.url.configuration.fields.forEach((field: any) => {
        console.log("field", field.child.name);
        console.log("prompt", field.child.prompt);
    });
}

export { fieldProcessor };