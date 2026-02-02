const express = require("express");
const notesController = require("../controller/notes.controller");

const router = express.Router();

/**
 * @swagger
 * /api/notes:
 *   get:
 *     tags:
 *       - Notes
 *     summary: Get all notes
 *     responses:
 *       200:
 *         description: List of notes
 */
router.get("/", notesController.listNotes);

/**
 * @swagger
 * /api/notes:
 *   post:
 *     tags:
 *       - Notes
 *     summary: Create a new note
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "testing"
 *               body:
 *                 type: string
 *                 example: "testing to be edited"
 *     responses:
 *       201:
 *         description: Note created
 */
router.post("/", notesController.createNote);

/**
 * @swagger
 * /api/notes:
 *   delete:
 *     tags:
 *       - Notes
 *     summary: Delete a note
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               _id:
 *                 type: string
 *                 example: "68d6720abb392b1320776431"
 *     responses:
 *       200:
 *         description: Note deleted
 */
router.delete("/", notesController.deleteNote);

/**
 * @swagger
 * /api/notes:
 *   put:
 *     tags:
 *       - Notes
 *     summary: Replace a note
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               _id:
 *                 type: string
 *                 example: "68fdd6bd0c14eeb0772e6e0f"
 *               title:
 *                 type: string
 *                 example: "Update Successful"
 *               body:
 *                 type: string
 *                 example: "Update Successful"
 *     responses:
 *       200:
 *         description: Note replaced
 */
router.put("/", notesController.editNotes);

module.exports = router;
