const Apify = require('apify');
const { compareSitemapsStates } = require('./sitemap');
const { sendIntro, sendChanges } = require('./emails');
const { STATE_STORE_NAME, CURRENT_STATE_KEY, PREVIOUS_STATE_KEY } = require('./consts');
const { runScraper } = require('./scraper');

Apify.main(async () => {
    const input = await Apify.getInput();
    const { emailNotification, sitemapUrls } = input;
    // Run the crawler
    const { currentState } = await runScraper(input);
    // Compare sitemaps states
    const stateStore = await Apify.openKeyValueStore(STATE_STORE_NAME);
    const previousState = await stateStore.getValue(CURRENT_STATE_KEY);
    let sitemapsChanges = { isChanged: false };
    if (previousState) {
        sitemapsChanges = compareSitemapsStates(previousState, currentState);
        await stateStore.setValue(PREVIOUS_STATE_KEY, previousState);
    } else {
        // Send the first email
        await sendIntro(emailNotification, sitemapUrls);
    }
    if (sitemapsChanges && sitemapsChanges.isChanged) {
        await sendChanges(emailNotification, sitemapUrls, sitemapsChanges);
    }
    await stateStore.setValue(CURRENT_STATE_KEY, currentState);
    await Apify.setValue('OUTPUT', sitemapsChanges);
});
