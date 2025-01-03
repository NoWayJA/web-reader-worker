export function FindTitle(): string {
    const possibilities = [
        document.title,
        document.querySelector('h1')?.textContent,
        document.querySelector('article h1')?.textContent,
        document.querySelector('.article-title')?.textContent,
        document.querySelector('[itemprop="headline"]')?.textContent,
        document.querySelector('meta[property="og:title"]')?.getAttribute('content'),
        document.querySelector('meta[name="twitter:title"]')?.getAttribute('content')
    ];
    return possibilities.find(title => title?.trim()) || 'Untitled Page';
}

export function FindArticle(): string {
    // Common article selectors to try first
    const commonSelectors = [
        'article',
        '[role="article"]',
        '.post-content',
        '.article-content',
        '.entry-content',
        '#article-content',
        '.post-body',
        '.article-body'
    ];

    function cleanText(element: Element): string {
        // Keep track of links for later replacement
        const links: { text: string; url: string }[] = [];
        
        // Clone the element to avoid modifying the original DOM
        const clone = element.cloneNode(true) as Element;
        
        // Remove unwanted elements
        const unwanted = ['script', 'style', 'noscript', 'iframe', 'form', 'button', 'input', 'nav', 'header', 'footer'];
        unwanted.forEach(tag => {
            clone.querySelectorAll(tag).forEach(el => el.remove());
        });

        // Process links
        clone.querySelectorAll('a').forEach((a, index) => {
            if (a.textContent && a.href) {
                const linkText = a.textContent.trim();
                links.push({ text: linkText, url: a.href });
                a.textContent = `[${index + 1}]`;
            }
        });

        // Get clean text
        let text = clone.textContent?.trim() || '';
        
        // Append links as references if any exist
        if (links.length > 0) {
            text += '\n\nReferences:\n';
            links.forEach((link, index) => {
                text += `[${index + 1}] ${link.text}: ${link.url}\n`;
            });
        }

        // Clean up whitespace
        return text
            .replace(/[\r\n]+/g, '\n')    // normalize line breaks
            .replace(/[ \t]+/g, ' ')       // normalize spaces
            .replace(/\n{3,}/g, '\n\n');   // max 2 consecutive line breaks
    }

    // Try common selectors first
    for (const selector of commonSelectors) {
        const element = document.querySelector(selector);
        if (element) {
            const text = cleanText(element);
            if (text.length > 500) {
                return text;
            }
        }
    }

    // If no common selectors work, find the element with most text content
    interface ElementScore {
        element: Element;
        textLength: number;
        density: number;
    }

    function getTextDensity(element: Element): ElementScore {
        const text = element.textContent || '';
        const childNodes = element.children.length;
        const links = element.getElementsByTagName('a').length;
        
        // Calculate text density excluding navigation and menu items
        const density = childNodes === 0 ? 0 : (text.length / childNodes);
        const linkRatio = childNodes === 0 ? 0 : links / childNodes;

        return {
            element,
            textLength: text.length,
            density: linkRatio > 0.5 ? 0 : density // Penalize link-heavy sections
        };
    }

    function isGoodCandidate(element: Element): boolean {
        const tagName = element.tagName.toLowerCase();
        // Skip elements that usually don't contain main content
        const badTags = ['nav', 'header', 'footer', 'menu', 'aside', 'script', 'style', 'form'];
        if (badTags.includes(tagName)) return false;

        // Skip elements with certain classes/ids
        const badClasses = ['nav', 'menu', 'sidebar', 'footer', 'header', 'comment'];
        const className = element.className.toLowerCase();
        const id = element.id.toLowerCase();
        return !badClasses.some(bad => className.includes(bad) || id.includes(bad));
    }

    let bestCandidate: ElementScore = { element: document.body, textLength: 0, density: 0 };
    const minLength = 500; // Minimum text length to consider

    // Traverse the DOM looking for the best candidate
    function findBestCandidate(element: Element) {
        if (!isGoodCandidate(element)) return;

        const score = getTextDensity(element);
        
        // Update best candidate if this element has better metrics
        if (score.textLength > minLength && 
            (score.density > bestCandidate.density || 
             (score.density === bestCandidate.density && score.textLength > bestCandidate.textLength))) {
            bestCandidate = score;
        }

        // Recursively check children
        Array.from(element.children).forEach(findBestCandidate);
    }

    findBestCandidate(document.body);
    return cleanText(bestCandidate.element);
}

export function SayHello(): string {
    return "Hello from DOM Worker!";
}
