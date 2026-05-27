const express = require("express");
const calendarNotesController = require("../controller/calendarNotes.controller.js");

const router = express.Router();

/**
 * @swagger
 * /api/calendar-notes:
 *   get:
 *     tags:
 *       - Calendar Notes
 *     summary: Get all calendar notes
 *     responses:
 *       200:
 *         description: List of calendar notes
 */
router.get("/", calendarNotesController.listNotes);

/**
 * @swagger
 * /api/calendar-notes/month/{year}/{month}:
 *   get:
 *     tags:
 *       - Calendar Notes
 *     summary: Get calendar notes for a specific month
 *     parameters:
 *       - in: path
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *         example: 2026
 *       - in: path
 *         name: month
 *         required: true
 *         schema:
 *           type: integer
 *         example: 5
 *     responses:
 *       200:
 *         description: List of calendar notes for the month
 */
router.get("/month/:year/:month", calendarNotesController.getByMonth);

/**
 * @swagger
 * /api/calendar-notes:
 *   post:
 *     tags:
 *       - Calendar Notes
 *     summary: Create a calendar note
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Team meeting"
 *               body:
 *                 type: string
 *                 example: "Discuss Q3 goals"
 *               date:
 *                 type: string
 *                 example: "2026-05-28"
 *               reminderAt:
 *                 type: string
 *                 format: date-time
 *                 example: "2026-05-28T09:00:00.000Z"
 *     responses:
 *       201:
 *         description: Calendar note created
 */
router.post("/", calendarNotesController.createNote);

/**
 * @swagger
 * /api/calendar-notes:
 *   patch:
 *     tags:
 *       - Calendar Notes
 *     summary: Update a calendar note
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               _id:
 *                 type: string
 *               title:
 *                 type: string
 *               body:
 *                 type: string
 *               date:
 *                 type: string
 *               reminderAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Calendar note updated
 */
router.patch("/", calendarNotesController.updateNote);

/**
 * @swagger
 * /api/calendar-notes:
 *   delete:
 *     tags:
 *       - Calendar Notes
 *     summary: Delete a calendar note
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               _id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Calendar note deleted
 */
router.delete("/", calendarNotesController.deleteNote);

module.exports = router;
