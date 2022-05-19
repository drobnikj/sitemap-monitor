const { compareSitemapsStates } = require('../src/sitemap');
const { MONITOR_TYPES } = require('../src/consts');
const testRecursiveSiteMap = require('./test_data/recursive_map.json')

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
        const sitemapChanges = compareSitemapsStates({ crawledAt: 'yesterday', sitemaps: [sitemapState] }, { crawledAt: 'today', sitemaps: [changedSitemapState] });
        const changes = sitemapChanges.sitemaps[sitemapState.url];
        expect(sitemapChanges.crawledAt).toBe('today');
        expect(sitemapChanges.previousCrawledAt).toBe('yesterday');
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

    test('include and exclude works', () => {
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
                'https://example.com/jobs/1': {
                    url: 'https://example.com/jobs/1',
                    lastModified: '2021-06-12T00:00:00+00:00',
                },
                'https://example.com/jobs/2': {
                    url: 'https://example.com/jobs/2',
                    lastModified: '2021-06-12T00:00:00+00:00',
                },
            },
        };
        const changedSitemapState = JSON.parse(JSON.stringify(sitemapState));
        // Exclude
        delete changedSitemapState.content['https://example.com/jobs/2'];
        changedSitemapState.content['https://example.com/jobs/3'] = {
            url: 'https://example.com/jobs/3',
            lastModified: '2021-06-12T00:00:00+00:00',
        };
        const sitemapChanges = compareSitemapsStates(
            { crawledAt: 'yesterday', sitemaps: [sitemapState] },
            { crawledAt: 'today', sitemaps: [changedSitemapState] },
            { excludeUrlsRegexps: ['^\/jobs.*'] },
        );
        expect(sitemapChanges.isChanged).toBe(false);
        delete changedSitemapState.content['https://example.com/pricing/3'];
        const sitemapChanges2 = compareSitemapsStates(
            { crawledAt: 'yesterday', sitemaps: [sitemapState] },
            { crawledAt: 'today', sitemaps: [changedSitemapState] },
            { excludeUrlsRegexps: ['^\/jobs.*', '^\/bla.*'] },
        );
        expect(sitemapChanges2.isChanged).toBe(true);
        expect(sitemapChanges2.sitemaps['https://example.com/sitemap.xml'].removedUrls).toStrictEqual(['https://example.com/pricing/3']);
        // Include
        const sitemapChanges3 = compareSitemapsStates(
            { crawledAt: 'yesterday', sitemaps: [sitemapState] },
            { crawledAt: 'today', sitemaps: [changedSitemapState] },
            { includeUrlsRegexps: ['^\/jobs.*', '^\/bla.*'] },
        );
        expect(sitemapChanges3.isChanged).toBe(true);
        expect(sitemapChanges3.sitemaps['https://example.com/sitemap.xml'].removedUrls).toStrictEqual(['https://example.com/jobs/2']);
        expect(sitemapChanges3.sitemaps['https://example.com/sitemap.xml'].newUrls).toStrictEqual(['https://example.com/jobs/3']);
    });

    test('recursive sitemap', () => {
        const sitemapState = testRecursiveSiteMap;
        const changedSitemapState = JSON.parse(JSON.stringify(testRecursiveSiteMap));
        // Nothing change
        const sitemapChanges = compareSitemapsStates(
            sitemapState,
            changedSitemapState,
        );
        expect(sitemapChanges.isChanged).toBe(false);
        delete changedSitemapState.sitemaps[0].content['https://freedomac1.com/wp-sitemap-posts-post-1.xml'];
        const sitemapChanges2 = compareSitemapsStates(
            sitemapState,
            changedSitemapState,
        );
        expect(sitemapChanges2.isChanged).toBe(true);
    });

    describe('handle monitor parameter', () => {
        test('onlyNewUrls', () => {
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
            const changedLastModifiedUrl = 'https://example.com/pricing/1';
            changedSitemapState.content[changedLastModifiedUrl] = {
                url: changedLastModifiedUrl,
                lastModified: '2021-06-14T00:00:00+00:00',
            };
            const sitemapChanges = compareSitemapsStates({ crawledAt: 'yesterday', sitemaps: [sitemapState] }, { crawledAt: 'today', sitemaps: [changedSitemapState] }, { monitor: MONITOR_TYPES.ONLY_NEW_URLS });
            const changes = sitemapChanges.sitemaps[sitemapState.url];
            expect(sitemapChanges.crawledAt).toBe('today');
            expect(sitemapChanges.previousCrawledAt).toBe('yesterday');
            expect(sitemapChanges.isChanged).toBe(false);
            expect(changes.isChanged).toBe(false);
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
        test('onlyRemoveUrls', () => {
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
            const newUrl = 'https://example.com/new-url';
            changedSitemapState.content[newUrl] = {
                url: newUrl,
            };
            const changedLastModifiedUrl = 'https://example.com/pricing/1';
            changedSitemapState.content[changedLastModifiedUrl] = {
                url: changedLastModifiedUrl,
                lastModified: '2021-06-14T00:00:00+00:00',
            };
            const sitemapChanges = compareSitemapsStates({ crawledAt: 'yesterday', sitemaps: [sitemapState] }, { crawledAt: 'today', sitemaps: [changedSitemapState] }, { monitor: MONITOR_TYPES.ONLY_REMOVED_URLS });
            const changes = sitemapChanges.sitemaps[sitemapState.url];
            expect(sitemapChanges.crawledAt).toBe('today');
            expect(sitemapChanges.previousCrawledAt).toBe('yesterday');
            expect(sitemapChanges.isChanged).toBe(false);
            expect(changes.isChanged).toBe(false);
            expect(changes.newUrls).toStrictEqual([newUrl]);
            expect(changes.changeDetails[newUrl]).toEqual({
                url: newUrl,
            });
            expect(changes.lastModifiedChangedUrls).toStrictEqual([changedLastModifiedUrl]);
            expect(changes.changeDetails[changedLastModifiedUrl]).toStrictEqual({
                url: changedLastModifiedUrl,
                lastModified: '2021-06-14T00:00:00+00:00',
                lastModifiedPrevious: '2021-06-12T00:00:00+00:00',
            });
        });
        test('onlyLastModifiedUrlChange', () => {
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
            const sitemapChanges = compareSitemapsStates({ crawledAt: 'yesterday', sitemaps: [sitemapState] }, { crawledAt: 'today', sitemaps: [changedSitemapState] }, { monitor: MONITOR_TYPES.ONLY_LAST_MOD_CHANGES });
            const changes = sitemapChanges.sitemaps[sitemapState.url];
            expect(sitemapChanges.crawledAt).toBe('today');
            expect(sitemapChanges.previousCrawledAt).toBe('yesterday');
            expect(sitemapChanges.isChanged).toBe(false);
            expect(changes.isChanged).toBe(false);
            expect(changes.newUrls).toStrictEqual([newUrl]);
            expect(changes.changeDetails[newUrl]).toEqual({
                url: newUrl,
            });
            expect(changes.removedUrls).toStrictEqual([removedUrl]);
            expect(changes.changeDetails[removedUrl]).toEqual({
                url: removedUrl,
            });
        });
    });
});
