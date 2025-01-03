import { Readability } from "@mozilla/readability";

const ActiveHtml = () => {
    return document.body.innerHTML;
}

const ReducedHtml = () => {
        let data = extractVisibleTextAndLinksInOrder(document.body);
        let simplifiedDOM = simplifyDOM();
        let html = new XMLSerializer().serializeToString(simplifiedDOM);
        html = html.replace(/^\s*[\r\n]/gm, '');
        let pageTitle = document.title;
        //      var article = new Readability(document).parse();
        return {
            text: data.join('\n'),
            html: html,
            pageTitle: pageTitle,
            dom: document.body
        };
}

const ReadabilityHtml = () => {
    var article = new Readability(document).parse();
    return article;
}

function extractVisibleTextAndLinksInOrder(element: Element): string[] {
    let result: any = [];
    // Function to traverse nodes and extract visible text/links
    function traverse(node: ChildNode) {
        if (!isVisible(node as Element)) return;
        if (node.nodeType === Node.ELEMENT_NODE && !isVisible(node as Element)) return
        const testArry = ['SCRIPT', 'STYLE', 'NOSCRIPT', 'IFRAME', 'IMG',
            'SVG', 'SELECT', 'FORM', 'HEADER', 'FOOTER']
        if (testArry.includes((node as Element).tagName) &&
            (node as Element).tagName.toUpperCase()) return
        if (node.nodeType === Node.TEXT_NODE) {
            // If it's a text node and non-empty, add the text content
            if (node.parentElement && isVisible(node.parentElement)) {
                result.push(node.textContent!.trim());
            }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            // Skip non-visible elements
            // If it's an anchor tag and visible, add the href
            if ((node as Element).tagName === 'A' && (node as HTMLAnchorElement).href) {
                result.push((node as HTMLAnchorElement).href);
            } else {
                // Recursively process the child nodes
                node.childNodes.forEach((childNode) => traverse(childNode));
            }
        }
    }
    traverse(element);
    return result.filter((item: any) => item !== '');
}

function isVisible(element: Element): boolean {
    if (element.nodeType !== Node.ELEMENT_NODE) return true;
    const style = window.getComputedStyle(element);
    return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
}
function simplifyDOM(): DocumentFragment {

    // Function to recursively remove attributes from an element and its children
    function removeAttributes(elem: HTMLElement): HTMLElement {
        // Clone the element without attributes
        let clone = elem.cloneNode(false) as HTMLElement;
        let attributes = clone.attributes;
        let wantedAttributes = ["href", "src", "alt", "title"];
        for (let i = 0; i < attributes.length; i++) {
            let attr = attributes[i];
            if (!wantedAttributes.includes(attr.name)) {
                clone.removeAttribute(attr.name,);
            }
        }

        // Remove class attributes
        clone.removeAttribute('class');

        // If the element has children, process them recursively
        for (let child of Array.from(elem.childNodes)) {
            if (!isVisible(child as Element)) continue;
            if (child.nodeType === Node.ELEMENT_NODE) {
                // Recursively remove attributes for child elements
                clone.appendChild(removeAttributes(child as HTMLElement));
            } else if (child.nodeType === Node.TEXT_NODE) {
                // Clone text nodes as they are
                clone.appendChild(child.cloneNode(true));
            }
        }
        return clone;
    }


    // Clone the entire body (or the document element)
    let cloneBody = document.body.cloneNode(true) as HTMLElement;

    const unwanted = ['SCRIPT', 'STYLE', 'NOSCRIPT', 'IFRAME', 'IMG',
        'SVG', 'SELECT', 'FORM', 'HEADER', 'FOOTER'];

    // Remove unwanted elements from the cloned body
    unwanted.forEach(tag => {
        let elements = cloneBody.querySelectorAll(tag);
        elements.forEach(element => element.remove());
    });

    // Recursively remove attributes from the cloned body
    let simplifiedDOM = removeAttributes(cloneBody);

    // Create a new DocumentFragment to hold the simplified DOM
    let newDocumentFragment = document.createDocumentFragment();
    newDocumentFragment.appendChild(simplifiedDOM);

    return newDocumentFragment;
}


export { ActiveHtml, ReducedHtml, ReadabilityHtml };