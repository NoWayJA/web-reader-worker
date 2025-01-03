function findTitle(): string {
    // Try different common title locations
    const possibilities = [
        // Standard HTML title
        document.title,
        // Main heading
        document.querySelector('h1')?.textContent,
        // Article title
        document.querySelector('article h1')?.textContent,
        document.querySelector('.article-title')?.textContent,
        document.querySelector('[itemprop="headline"]')?.textContent,
        // OpenGraph title
        document.querySelector('meta[property="og:title"]')?.getAttribute('content'),
        // Twitter title
        document.querySelector('meta[name="twitter:title"]')?.getAttribute('content')
    ];

    // Return first non-empty match
    return possibilities.find(title => title?.trim()) || 'Untitled Page';
}

export default findTitle();
