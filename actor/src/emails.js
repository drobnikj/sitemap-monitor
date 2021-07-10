const fs = require('fs');
const path = require('path');
const Apify = require('apify');
const Handlebars = require('handlebars');
const moment = require('moment');
const { convert } = require('html-to-text');

const { utils: { log } } = Apify;

const printDate = (date) => {
    return moment(date).format('YYYY-MM-DDTHH:mm');
};

const printPrevChangedDate = (changeDetails, crawledAt, url) => {
    const { lastModifiedPrevious } = changeDetails[url];
    if (!lastModifiedPrevious) return 'Empty';
    let date;
    try {
        date = new Date(lastModifiedPrevious);
    } catch (err) {
        console.log('Cannot parse date!');
        console.error(err);
        return 'Empty';
    }
    return printDate(date);
};
const printChangedDate = (changeDetails, crawledAt, url) => {
    const { lastModified } = changeDetails[url];
    if (!lastModified) return 'Empty';
    let date;
    try {
        date = new Date(lastModified);
    } catch (err) {
        console.log('Cannot parse date!');
        console.error(err);
        return 'Empty';
    }
    return printDate(date);
};
Handlebars.registerHelper('printChangedDate', printChangedDate);
Handlebars.registerHelper('printPrevChangedDate', printPrevChangedDate);
Handlebars.registerHelper('printDate', printDate);

const templateSource = fs.readFileSync(path.join(__dirname, `../templates/changes_email.hbs`));
const emailTemplate = Handlebars.compile(templateSource.toString());

const templateTextSource = fs.readFileSync(path.join(__dirname, `../templates/changes_text.hbs`));
const textTemplate = Handlebars.compile(templateTextSource.toString());

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

const sendAndLogChanges = async (emailAddress, sitemapUrls, sitemapsChanges, logDataset) => {
    const hostnames = uniqueHostnames(sitemapUrls);
    let changeDetails = {};
    Object.keys(sitemapsChanges.sitemaps).forEach((url) => {
        changeDetails = { ...changeDetails, ...sitemapsChanges.sitemaps[url].changeDetails };
    });
    const context = {
        crawledAt: sitemapsChanges.crawledAt,
        previousCrawledAt: sitemapsChanges.previousCrawledAt,
        sitemaps: Object.keys(sitemapsChanges.sitemaps).map((url) => ({ ...sitemapsChanges.sitemaps[url], url })),
        changeDetails,
        sitemapsChanges,
    };
    const email = {
        to: emailAddress,
        subject: `Sitemap changes monitor: ${hostnames.join(', ')}`,
        html: emailTemplate(context),
    };
    const changesText = convert(textTemplate({ ...context, skipGreeting: true }));
    await Promise.all([
        logDataset.pushData({
            createdAt: new Date(),
            sitemapUrls: sitemapUrls.map(({ url }) => url).join('\n'),
            sitemap: hostnames.join(', '),
            changes: changesText,
        }),
        sendEmail(email),
    ]);
};

module.exports = {
    sendEmail,
    sendAndLogChanges,
    sendIntro,
    uniqueHostnames,
    printChangedDate,
    printPrevChangedDate,
};
