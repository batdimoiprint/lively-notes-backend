const express = require("express");
const settingsController = require("../controller/settings.controller");
const { authJWT } = require("../middleware/jwt.config");
const router = express.Router();

/**
 * @swagger
 * /api/settings:
 *   get:
 *     tags:
 *       - Settings
 *     summary: Get settings
 *     description: Retrieves the current application settings.
 *     responses:
 *       200:
 *         description: Current settings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   rainbowSpeed:
 *                     type: number
 *                   rainbow:
 *                     type: boolean
 *                   matrixspeed:
 *                     type: number
 *                   textColor:
 *                     type: string
 *                   trailOpacity:
 *                     type: number
 */
router.get("/", settingsController.getSettings);

/**
 * @swagger
 * /api/settings:
 *   post:
 *     tags:
 *       - Settings
 *     summary: Reset settings
 *     description: Drops the current settings and inserts the provided payload. Requires authentication.
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rainbowSpeed:
 *                 type: number
 *                 example: 0.05
 *               rainbow:
 *                 type: boolean
 *                 example: true
 *               matrixspeed:
 *                 type: number
 *                 example: 50
 *               textColor:
 *                 type: string
 *                 example: "#ff0000"
 *               trailOpacity:
 *                 type: number
 *                 example: 0.05
 *     responses:
 *       200:
 *         description: Settings reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post("/",authJWT, settingsController.resetSettings);

/**
 * @swagger
 * /api/settings:
 *   patch:
 *     tags:
 *       - Settings
 *     summary: Patch settings
 *     description: Updates specific fields in the settings. Requires authentication.
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               backgroundColor:
 *                 type: string
 *                 example: "#ffffff"
 *     responses:
 *       204:
 *         description: Settings patched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.patch("/",authJWT, settingsController.patchSettings);

module.exports = router;
