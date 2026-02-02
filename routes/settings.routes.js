const express = require("express");
const settingsController = require("../controller/settings.controller");
const router = express.Router();

/**
 * @swagger
 * /api/settings:
 *   get:
 *     tags:
 *       - Settings
 *     summary: Get settings
 *     responses:
 *       200:
 *         description: Current settings
 */
router.get("/", settingsController.getSettings);

/**
 * @swagger
 * /api/settings:
 *   post:
 *     tags:
 *       - Settings
 *     summary: Reset settings
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
 *         description: Settings reset
 */
router.post("/", settingsController.resetSettings);

/**
 * @swagger
 * /api/settings:
 *   patch:
 *     tags:
 *       - Settings
 *     summary: Patch settings
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
 *       200:
 *         description: Settings patched
 */
router.patch("/", settingsController.patchSettings);

module.exports = router;
