/**
 * @fileoverview CORS configuration options.
 * @module config/corsConfig
 */

/**
 * CORS configuration options for the Express application.
 * @type {object}
 * @property {Array<string>} origin - The allowed origins.
 * @property {boolean} credentials - Whether to allow credentials.
 * @property {Array<string>} methods - The allowed HTTP methods.
 */
const options = {
    origin: ['http://localhost:5500', 'https://df0091eeb1e5193e.localhost'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE']
};
module.exports = options