// config/apify.client.js
const { ApifyClient } = require('apify-client');

const apify_client = new ApifyClient({
    token: process.env.APIFY_PAT,
});

module.exports = apify_client;