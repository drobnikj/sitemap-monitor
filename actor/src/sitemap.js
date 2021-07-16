const compareSitemapsStates = (previousState, currentState) => {
    const sitemapsChanges = {
        isChanged: false,
        crawledAt: currentState.crawledAt,
        previousCrawledAt: previousState.crawledAt,
        sitemaps: {},
    };
    for (const sitemap of currentState.sitemaps) {
        const changes = {
            newUrls: [],
            removedUrls: [],
            lastModifiedChangedUrls: [],
            changeDetails: {},
            isChanged: false,
        };
        const previousSitemap = previousState.sitemaps.find((i) => i.url === sitemap.url);
        if (!previousSitemap) {
            // TODO: Handle this better
        } else {
            // TODO: Maybe compare sitemap extensions as well - https://developers.google.com/search/docs/advanced/sitemaps/image-sitemaps
            Object.values(sitemap.content).forEach(({ url, lastModified }) => {
                if (!previousSitemap.content[url]) {
                    changes.isChanged = true;
                    changes.newUrls.push(url);
                    changes.changeDetails[url] = {
                        url,
                        lastModified,
                    };
                } else if (lastModified && (previousSitemap.content[url].lastModified !== lastModified)) {
                    changes.isChanged = true;
                    changes.lastModifiedChangedUrls.push(url);
                    changes.changeDetails[url] = {
                        url,
                        lastModified,
                        lastModifiedPrevious: previousSitemap.content[url].lastModified,
                    };
                }
            });
            Object.values(previousSitemap.content).forEach(({ url, lastModified }) => {
                if (!sitemap.content[url]) {
                    changes.isChanged = true;
                    changes.removedUrls.push(url);
                    changes.changeDetails[url] = {
                        url,
                        lastModified,
                    };
                }
            });
        }
        sitemapsChanges.isChanged = changes.isChanged || sitemapsChanges.isChanged;
        sitemapsChanges.sitemaps[sitemap.url] = changes;
    }
    return sitemapsChanges;
};

module.exports = {
    compareSitemapsStates,
};
