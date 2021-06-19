const Apify = require('apify');
const xml2js = require('xml2js');
const {
    createHash,
} = require('crypto');

const { CheerioCrawler } = Apify;

const createUniqueKeyFromUrl = (url) => {
    const hash = createHash('sha256');
    const cleanUrl = url.split('://')[1]; // Remove protocol
    hash.update(cleanUrl);
    return hash.digest('hex');
};

async function handlePageFunction({ request, body }) {
    const { url, userData } = request;
    // TODO: Enqueue sitemap from robot.txt
    // TODO: sitemap.txt
    const sitemapData = await xml2js.parseStringPromise(body);
    const isSitemapIndex = !!sitemapData.sitemapindex;
    const isUrlSet = !!sitemapData.urlset;
    if (!isSitemapIndex && !isUrlSet) throw new Error('Cannot parse sitemap!');
    const key = createUniqueKeyFromUrl(url);
    const content = {};
    const indexUrl = ({ loc: [sitemapUrl], lastmod }) => {
        content[sitemapUrl] = {
            url: sitemapUrl,
            lastModified: lastmod && lastmod[0],
        };
    };
    if (isSitemapIndex) {
        sitemapData.sitemapindex.sitemap.forEach(indexUrl);
    } else {
        sitemapData.urlset.url.forEach(indexUrl);
    }
    // Save whole sitemap for debugging
    await Apify.setValue(key, body, { contentType: 'application/xml' });
    await Apify.pushData({
        url: request.url,
        key,
        isSitemapIndex,
        isUrlSet,
        content,
        ...userData,
        // isRecursive: this.isRecursive,
    });
    // Enqueue child sitemaps
    // TODO
    // if (isRecursive && isSitemapIndex) {
    //     for (const { loc: [siteMapUrl] } of sitemapData.sitemapindex.sitemap) {
    //         await requestQueue.addRequest({ url: siteMapUrl, userData: { parentUrl: url } });
    //     }
    // }
}

class SitemapScraper extends CheerioCrawler {
    constructor({ input, ...options }) {
        super(options);
        const { isRecursive = false, monitor = 'all' } = input;
        this.monitor = monitor;
        this.isRecursive = isRecursive;
    }
}

const runScraper = async (input) => {
    // Create a RequestList
    const requestList = await Apify.openRequestList('start-urls', [
        { url: 'https://apify.com/sitemap.xml' },
        { url: 'https://auts.cz/sitemap.xml' },
    ]);
    const requestQueue = await Apify.openRequestQueue();
    // Function called for each URL
    // Create a CheerioCrawler
    const crawler = new SitemapScraper({
        requestList,
        requestQueue,
        additionalMimeTypes: ['application/xml', 'text/xml'],
        handlePageFunction,
        input,
    });
    await crawler.run();
    const ddt = await Apify.openDataset();
    const { items } = await ddt.getData();
    const currentState = {
        crawledAt: new Date(),
        sitemaps: items,
    };
    return { currentState };
};

module.exports = {
    runScraper,
};
