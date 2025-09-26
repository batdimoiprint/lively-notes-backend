const express = require('express');
const notesController = require('../controller/notesController');

const router = express.Router();

router.get('/', notesController.listNotes);
router.post('/', notesController.createNote);

module.exports = router;