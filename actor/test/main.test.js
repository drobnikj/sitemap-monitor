const nock = require('nock');
const axios = require('axios');

const scope = nock('https://apify.com')
    .get('/test')
    .reply(200, {
        license: {
            key: 'mit',
            name: 'MIT License',
            spdx_id: 'MIT',
            url: 'https://api.github.com/licenses/mit',
            node_id: 'MDc6TGljZW5zZTEz',
        },
    });

test('adds 1 + 2 to equal 3', async () => {
    const res = await axios.get('https://apify.com/test')
    console.log(res)
});
