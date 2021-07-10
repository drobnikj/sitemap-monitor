const moment = require('moment');
const { uniqueHostnames, sendAndLogChanges } = require('../src/emails');

describe('emails', () => {
    test('uniqueHostnames works', () => {
        const urlSources = [
            {
                url: 'https://apify.com/sitemap.xml',
            },
            {
                url: 'https://test.example.com/sitemap.xml',
            },
            {
                url: 'https://apify.com/sitemap2.xml',
            },
        ];
        expect(uniqueHostnames(urlSources)).toStrictEqual(['apify.com', 'test.example.com']);
    });
    test('sendAndLogChanges works', async () => {
        const pushData = jest.fn();
        const dataset = {
            pushData,
        };
        await sendAndLogChanges('test@test.test', [
            {
                url: 'http://farpeak.com/sitemap.xml',
            },
        ], {
            isChanged: true,
            crawledAt: '2021-07-09T22:00:19.421Z',
            sitemaps: {
                'http://farpeak.com/sitemap.xml': {
                    newUrls: [],
                    removedUrls: [],
                    lastModifiedChangedUrls: [
                        'https://www.farpeak.com/home',
                    ],
                    changeDetails: {
                        'https://www.farpeak.com/home': {
                            url: 'https://www.farpeak.com/home',
                            lastModified: '2021-06-29',
                            lastModifiedPrevious: '2021-07-09',
                        },
                    },
                    isChanged: true,
                },
            },
        }, dataset);
        const { createdAt, changes, ...theRest } = pushData.mock.calls[0][0];
        expect(theRest).toStrictEqual({
            sitemapUrls: 'http://farpeak.com/sitemap.xml',
            sitemap: 'farpeak.com',
        });
        expect(changes).toContain(`${moment(new Date('2021-06-29')).format('YYYY-MM-DDTHH:mm')}`);
    });
});
