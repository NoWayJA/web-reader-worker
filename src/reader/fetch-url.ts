import { chromium, Page } from 'playwright-core';
import { readFileSync } from 'fs';
import path from 'path';

// Read the inject script at startup
const injectScript = readFileSync(path.join(__dirname, '../injector/dist/inject-single.js'), 'utf-8');


// Fetch webpage content using Playwright
const fetchUrl = async (url: string): Promise<any> => {
    const browser = await chromium.launch({
        executablePath: process.env.CHROME_EXECUTABLE_PATH,
        args: ['--disable-blink-features=AutomationControlled',
            '--headless=new',
        ]
    });
    try {
        const context = await browser.newContext();
        const page = await context.newPage();
        // First navigate to the URL
        await page.goto(url, { timeout: 5000 });
        await waitForPageLoad(page);
        await page.waitForTimeout(1000);
        await page.evaluate(async () => {
            await new Promise<void>((resolve) => {
                let totalHeight = 0;
                const distance = 200;
                const timer = setInterval(() => {
                    const scrollHeight = document.body.scrollHeight;
                    window.scrollBy(0, distance);
                    totalHeight += distance;

                    if (totalHeight >= scrollHeight) {
                        clearInterval(timer);
                        resolve();
                    }
                }, 50);
            });
        });

        // Inject and execute the script to get the page title
        const domExtractions = await page.evaluate(injectScript);

        return domExtractions;
    } finally {
        await browser.close();
    }
}

type LinkData = {
    url: string;
    text: string;
};

const fetchUrlList = async (url: string, listExpression: string): Promise<LinkData[]> => {
    const browser = await chromium.launch({
        executablePath: process.env.CHROME_EXECUTABLE_PATH,
        args: ['--disable-blink-features=AutomationControlled',
            '--headless=new',
        ]
    });

    try {
        const context = await browser.newContext();
        const page = await context.newPage();
        await page.goto(url, { timeout: 5000 });
        await waitForPageLoad(page);
        await page.waitForTimeout(1000);
        await page.evaluate(async () => {
            await new Promise<void>((resolve) => {
                let totalHeight = 0;
                const distance = 200;
                const timer = setInterval(() => {
                    const scrollHeight = document.body.scrollHeight;
                    window.scrollBy(0, distance);
                    totalHeight += distance;

                    if (totalHeight >= scrollHeight) {
                        clearInterval(timer);
                        resolve();
                    }
                }, 50);
            });
        });

        const links: LinkData[] = await page.evaluate(() => {
            const elements = document.querySelectorAll('a');
            return Array.from(elements).map(el => ({
                url: el.href,
                text: el.textContent?.trim() || ''
            }));
        });

        const filteredLinks = links.filter(link => link.url.match(listExpression));

        return filteredLinks;
    } finally {
        await browser.close();
    }
}

const waitForPageLoad = async (page: Page) => {
    try {
        await Promise.all([
            page.waitForLoadState('load', { timeout: 20000 }),
            page.waitForLoadState('domcontentloaded', { timeout: 20000 }),
            page.waitForLoadState('networkidle', { timeout: 20000 }),
        ]);
        await page.waitForTimeout(1000);
    } catch (error: any) {
        console.warn('Page load states timed out in waitForPageLoad:', error.message);
        // Continue execution even if load states timeout
    }
}

export { fetchUrl, fetchUrlList };