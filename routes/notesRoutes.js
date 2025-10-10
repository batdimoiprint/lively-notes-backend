/**
 * @fileoverview Express router for notes-related routes.
 * @module routes/notesRoutes
 */

const express = require('express');
const notesController = require('../controller/notesController');

const router = express.Router();

/**
 * @description Route to list all notes.
 */
router.get('/', notesController.listNotes);

/**
 * @description Route to create a new note.
 */
router.post('/', notesController.createNote);

/**
 * @description Route to delete a note.
 */
router.delete('/', notesController.deleteNote);

module.exports = router;