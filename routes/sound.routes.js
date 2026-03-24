const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload.config");
const { authJWT } = require("../middleware/jwt.config");
const {
  getPomodoroSound,
  upsertPomodoroSound,
  deletePomodoroSound,
} = require("../controller/sound.controller");

/**
 * @swagger
 * /api/sound:
 *   get:
 *     tags:
 *       - Pomodoro Sound
 *     summary: Get the authenticated user's Pomodoro sound
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Audio stream returned successfully
 *       404:
 *         description: No sound uploaded yet
 */
router.get("/", authJWT, getPomodoroSound);

/**
 * @swagger
 * /api/sound:
 *   post:
 *     tags:
 *       - Pomodoro Sound
 *     summary: Upload or replace the authenticated user's Pomodoro sound
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               sound:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Sound saved
 *       400:
 *         description: Invalid file
 */
router.post("/", authJWT, upload.single("sound"), upsertPomodoroSound);

/**
 * @swagger
 * /api/sound:
 *   put:
 *     tags:
 *       - Pomodoro Sound
 *     summary: Update the authenticated user's Pomodoro sound
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               sound:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Sound updated
 */
router.put("/", authJWT, upload.single("sound"), upsertPomodoroSound);

/**
 * @swagger
 * /api/sound:
 *   delete:
 *     tags:
 *       - Pomodoro Sound
 *     summary: Delete the authenticated user's Pomodoro sound
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Sound deleted
 */
router.delete("/", authJWT, deletePomodoroSound);

module.exports = router;