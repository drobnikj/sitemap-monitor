const { uniqueHostnames } = require('../src/emails');

describe('uniqueHostnames()', () => {
    test('works', () => {
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
});
