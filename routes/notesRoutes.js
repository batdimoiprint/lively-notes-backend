const express = require("express");
const notesController = require("../controller/notesController");

const router = express.Router();

router.get("/", notesController.listNotes);
router.post("/", notesController.createNote);
router.delete("/", notesController.deleteNote);
router.put("/", notesController.editNotes);

module.exports = router;
