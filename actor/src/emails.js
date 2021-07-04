const fs = require('fs');
const path = require('path');
const Apify = require('apify');
const Handlebars = require('handlebars');
const moment = require('moment');

const { utils: { log } } = Apify;

/**
 * isRemoved - Url is removing change date is crawledAt!
 */
Handlebars.registerHelper('printChangedDate', (changeDetails, crawledAt, url, isRemoved = false) => {
    const { lastModified } = changeDetails[url];
    let date;
    try {
        date = lastModified && !isRemoved ? new Date(lastModified) : new Date(crawledAt);
    } catch (err) {
        console.log('Cannot parse date!');
        console.error(err);
        date = new Date(crawledAt);
    }
    return moment(date).format('MMMM Do YYYY, h:mm');
});

const templateSource = fs.readFileSync(path.join(__dirname, `../templates/changes_email.hbs`));
const emailTemplate = Handlebars.compile(templateSource.toString());

const uniqueHostnames = (urls) => {
    const hostNames = new Set();
    urls.forEach(({ url }) => {
        const parsedUrl = new URL(url);
        hostNames.add(parsedUrl.hostname);
    });

    return Array.from(hostNames);
};

const sendEmail = async (email) => {
    if (!Apify.isAtHome()) {
        log.warning('Run is not running on platform, skipping email sending.', email);
        return;
    }
    await Apify.call('apify/send-mail', email);
    log.info(`Email send to ${email.to}`);
};

const sendIntro = async (emailAddress, sitemapUrls) => {
    const hostnames = uniqueHostnames(sitemapUrls);
    const email = {
        to: emailAddress,
        subject: `Sitemap changes monitor: ${hostnames.join(', ')}`,
        html: '<p>Hey there,<br><br>The monitor for sitemap urls changes is active.'
            + '<br>You should receive email for every change in selected sitemaps.</p>',
    };
    await sendEmail(email);
};

const sendChanges = async (emailAddress, sitemapUrls, sitemapsChanges) => {
    const hostnames = uniqueHostnames(sitemapUrls);
    let changeDetails = {};
    Object.keys(sitemapsChanges.sitemaps).forEach((url) => {
        changeDetails = { ...changeDetails, ...sitemapsChanges.sitemaps[url].changeDetails };
    });
    const context = {
        crawledAt: sitemapsChanges.crawledAt,
        sitemaps: Object.keys(sitemapsChanges.sitemaps).map((url) => ({ ...sitemapsChanges.sitemaps[url], url })),
        changeDetails,
        sitemapsChanges,
    };
    const email = {
        to: emailAddress,
        subject: `Sitemap changes monitor: ${hostnames.join(', ')}`,
        html: emailTemplate(context),
    };
    await sendEmail(email);
};

module.exports = {
    sendEmail,
    sendChanges,
    sendIntro,
    uniqueHostnames,
};
