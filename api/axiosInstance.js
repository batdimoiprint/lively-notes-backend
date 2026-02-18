const axios = require('axios');

const apify_api = axios.create({
    baseURL: process.env.APIFY_URL,
    headers: { "Content-Type": "application/json" },
})

module.exports = apify_api