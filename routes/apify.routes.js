const express = require("express");
const router = express.Router();
const apifyController = require("../controller/apify.controller");

/**
 * @swagger
 * /api/apify:
 *   get:
 *     tags:
 *       - Apify
 *     summary: Get all images
 *     responses:
 *       200:
 *         description: List of images
 */
router.get("/", apifyController.getScrappedPictures);

module.exports = router;
