/**
 * @fileoverview Main entry point for the Express application.
 */

// Imports
require('dotenv').config();
const express = require('express');
const app = express();

// CORS
const cors = require('cors')
const options = require('./config/corsConfig');
app.use(cors(options))
// Ports
const port = process.env.PORT || 3000


// Express Json
app.use(express.json());

// Notes Routes
const notesRouter = require('./routes/notesRoutes');
app.use('/api/notes', notesRouter);

/**
 * Default route handler.
 * @param {object} req - The Express request object.
 * @param {object} res - The Express response object.
 */
app.get('/', (req, res) => {
    res.send('Bakit ka andito')
})

/**
 * Starts the Express server.
 * @param {number} port - The port to listen on.
 * @param {function} callback - The function to call once the server is listening.
 */
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
