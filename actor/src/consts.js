exports.STATE_STORE_NAME = `sitemap-monitor-${process.env.APIFY_ACTOR_TASK_ID || process.env.APIFY_ACT_ID}`;
exports.CURRENT_STATE_KEY = 'current_state';
exports.PREVIOUS_STATE_KEY = 'previous_state';
exports.LOG_DATASET_NAME = 'sitemap-monitor-log';
exports.MONITOR_TYPES = {
    ALL_CHANGES: 'all',
    ONLY_NEW_URLS: 'onlyNewUrls',
    ONLY_REMOVED_URLS: 'onlyRemovedUrls',
    ONLY_LAST_MOD_CHANGES: 'onlyLastModifiedChanges',
};
