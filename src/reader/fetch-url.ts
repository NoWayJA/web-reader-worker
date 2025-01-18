import { chromium } from 'playwright-core';
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

        await Promise.all([
            page.waitForLoadState('load'),
            page.waitForLoadState('domcontentloaded'),
            page.waitForLoadState('networkidle'),
        ]);

        await page.goto(url, { timeout: 5000 });

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

export { fetchUrl };