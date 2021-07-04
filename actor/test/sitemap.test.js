const { compareSitemapsStates } = require('../src/sitemap');

describe('sitemap compareSitemapStates() works', () => {
    test('handle changes', () => {
        const sitemapState = {
            url: 'https://example.com/sitemap.xml',
            key: 'aa3c3d4896f26d1cc7b94857a844e3c55a6c5e6a3c9fe3065b50266540f04c5b',
            isSitemapIndex: false,
            isUrlSet: true,
            content: {
                'https://example.com/store': {
                    url: 'https://example.com/store',
                },
                'https://example.com/pricing/1': {
                    url: 'https://example.com/pricing/1',
                    lastModified: '2021-06-12T00:00:00+00:00',
                },
                'https://example.com/pricing/2': {
                    url: 'https://example.com/pricing/2',
                    lastModified: '2021-06-12T00:00:00+00:00',
                },
                'https://example.com/pricing/3': {
                    url: 'https://example.com/pricing/3',
                    lastModified: '2021-06-12T00:00:00+00:00',
                },
            },
        };
        const changedSitemapState = JSON.parse(JSON.stringify(sitemapState));
        const removedUrl = 'https://example.com/store';
        delete changedSitemapState.content[removedUrl];
        const newUrl = 'https://example.com/new-url';
        changedSitemapState.content[newUrl] = {
            url: newUrl,
        };
        const changedLastModifiedUrl = 'https://example.com/pricing/1';
        changedSitemapState.content[changedLastModifiedUrl] = {
            url: changedLastModifiedUrl,
            lastModified: '2021-06-14T00:00:00+00:00',
        };
        const sitemapChanges = compareSitemapsStates({ sitemaps: [sitemapState] }, { sitemaps: [changedSitemapState] });
        const changes = sitemapChanges.sitemaps[sitemapState.url];
        expect(sitemapChanges.isChanged).toBe(true);
        expect(changes.isChanged).toBe(true);
        expect(changes.newUrls).toStrictEqual([newUrl]);
        expect(changes.changeDetails[newUrl]).toEqual({
            url: newUrl,
        });
        expect(changes.removedUrls).toStrictEqual([removedUrl]);
        expect(changes.changeDetails[removedUrl]).toEqual({
            url: removedUrl,
        });
        expect(changes.lastModifiedChangedUrls).toStrictEqual([changedLastModifiedUrl]);
        expect(changes.changeDetails[changedLastModifiedUrl]).toStrictEqual({
            url: changedLastModifiedUrl,
            lastModified: '2021-06-14T00:00:00+00:00',
            lastModifiedPrevious: '2021-06-12T00:00:00+00:00',
        });
    });
});
