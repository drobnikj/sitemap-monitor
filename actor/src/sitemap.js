const compareSitemapsStates = (previousState, currentState) => {
    const sitemapsChanges = { isChanged: false };
    for (const sitemap of currentState.sitemaps) {
        const changes = {
            newUrls: [],
            removedUrls: [],
            lastModifiedChangedUrls: [],
            isChanged: false,
        };
        const previousSitemap = previousState.sitemaps.find((i) => i.url === sitemap.url);
        if (!previousSitemap) throw new Error('TODO - Handle this');
        Object.values(sitemap.content).forEach(({ url, lastModified }) => {
            if (!previousSitemap.content[url]) {
                changes.isChanged = true;
                changes.newUrls.push(url);
            } else if (lastModified && (previousSitemap.content[url].lastModified !== lastModified)) {
                changes.isChanged = true;
                changes.lastModifiedChangedUrls.push(url);
            }
        });
        Object.values(previousSitemap.content).forEach(({ url }) => {
            if (!sitemap.content[url]) {
                changes.isChanged = true;
                changes.removedUrls.push(url);
            }
        });
        sitemapsChanges.isChanged = changes.isChanged || sitemapsChanges.isChanged;
        sitemapsChanges[sitemap.url] = changes;
    }
    return sitemapsChanges;
};

module.exports = {
    compareSitemapsStates,
};
