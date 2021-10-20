const Apify = require('apify');
const { URL } = require('url');

const { utils: { log } } = Apify;

const compareSitemapsStates = (previousState, currentState, opts = {}) => {
    const { includeUrlsRegexp, excludeUrlsRegexp } = opts;
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
            Object.values(sitemap.content)
                .filter(({ url }) => filterUrl(url, { includeUrlsRegexp, excludeUrlsRegexp }))
                .forEach(({ url, lastModified }) => {
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
            Object.values(previousSitemap.content)
                .filter(({ url }) => filterUrl(url, { includeUrlsRegexp, excludeUrlsRegexp }))
                .forEach(({ url, lastModified }) => {
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

/**
 * Filter URL based on includeUrlsRegexp, excludeUrlsRegexp.
 * @param url
 * @param includeUrlsRegexp
 * @param excludeUrlsRegexp
 * @return {boolean}
 */
const filterUrl = (url, { includeUrlsRegexp, excludeUrlsRegexp }) => {
    try {
        if (includeUrlsRegexp) {
            const include = new RegExp(includeUrlsRegexp);
            const { pathname, search } = new URL(url);
            if (!include.test(`${pathname}${search}`)) {
                return false;
            }
        }
        if (excludeUrlsRegexp) {
            const exclude = new RegExp(excludeUrlsRegexp);
            const { pathname, search } = new URL(url);
            if (exclude.test(`${pathname}${search}`)) {
                return false;
            }
        }
    } catch (err) {
        // TODO: error handling
        log.warning('Cannot filter url', { url, includeUrlsRegexp, excludeUrlsRegexp });
        log.exception(err);
        return true;
    }
    return true;
};

module.exports = {
    compareSitemapsStates,
};
