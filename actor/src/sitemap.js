const Apify = require('apify');
const { URL } = require('url');

const { utils: { log } } = Apify;

const compareSitemapsStates = (previousState, currentState, opts = {}) => {
    const { includeUrlsRegexps, excludeUrlsRegexps } = opts;
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
                .filter(({ url }) => filterUrl(url, { includeUrlsRegexps, excludeUrlsRegexps }))
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
                .filter(({ url }) => filterUrl(url, { includeUrlsRegexps, excludeUrlsRegexps }))
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
const filterUrl = (url, { includeUrlsRegexps, excludeUrlsRegexps }) => {
    try {
        const { pathname, search } = new URL(url);
        const pathWithSearch = `${pathname}${search}`;
        if (includeUrlsRegexps && includeUrlsRegexps.length) {
            const includes = includeUrlsRegexps.map((item) => new RegExp(item));
            const oneMatch = includes.reduce((prev, regExp) => {
                return regExp.test(pathWithSearch) || prev;
            }, false);
            if (!oneMatch) {
                return false;
            }
        }
        if (excludeUrlsRegexps && excludeUrlsRegexps.length) {
            const excludes = excludeUrlsRegexps.map((item) => new RegExp(item));
            const oneMatch = excludes.reduce((prev, regExp) => {
                return prev || regExp.test(pathWithSearch);
            }, false);
            if (oneMatch) {
                return false;
            }
        }
    } catch (err) {
        // TODO: error handling
        log.warning('Cannot filter url', { url, includeUrlsRegexps, excludeUrlsRegexps });
        log.exception(err);
        return true;
    }
    return true;
};

module.exports = {
    compareSitemapsStates,
};
