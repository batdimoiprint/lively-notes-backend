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
 *     description: Retrieves a list of all notes from the database.
 *     responses:
 *       200:
 *         description: List of notes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     example: "60d5ec49f1b2c8b1f8e4e1a2"
 *                   title:
 *                     type: string
 *                     example: "My Note"
 *                   body:
 *                     type: string
 *                     example: "Note content"
 */
router.get("/", notesController.listNotes);

/**
 * @swagger
 * /api/notes:
 *   post:
 *     tags:
 *       - Notes
 *     summary: Create a new note
 *     description: Creates a new note in the database.
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
 *         description: Note created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Success"
 */
router.post("/", notesController.createNote);

/**
 * @swagger
 * /api/notes:
 *   delete:
 *     tags:
 *       - Notes
 *     summary: Delete a note
 *     description: Deletes a note from the database by its ID.
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
 *         description: Note deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 acknowledged:
 *                   type: boolean
 *                   example: true
 *                 deletedCount:
 *                   type: number
 *                   example: 1
 *       400:
 *         description: Invalid ID format
 *       404:
 *         description: Note not found
 */
router.delete("/", notesController.deleteNote);

/**
 * @swagger
 * /api/notes:
 *   put:
 *     tags:
 *       - Notes
 *     summary: Replace a note
 *     description: Updates an existing note's title and body.
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
 *         description: Note replaced successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 acknowledged:
 *                   type: boolean
 *                   example: true
 *                 modified:
 *                   type: number
 *                   example: 1
 *       400:
 *         description: Invalid ID format
 */
router.put("/", notesController.editNotes);

/**
 * @swagger
 * /api/notes/reorder:
 *   patch:
 *     tags:
 *       - Notes
 *     summary: Reorder notes
 *     description: Updates the order of notes based on an array of IDs in their new order.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orderedIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["68d6720abb392b1320776431", "68d6720abb392b1320776432"]
 *     responses:
 *       200:
 *         description: Notes reordered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 acknowledged:
 *                   type: boolean
 *                   example: true
 *                 modified:
 *                   type: number
 *                   example: 2
 *       400:
 *         description: Invalid request body
 */
router.patch("/reorder", notesController.reorderNotes);

module.exports = router;
