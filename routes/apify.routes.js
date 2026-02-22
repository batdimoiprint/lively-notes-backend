const express = require("express");
const router = express.Router();
const apifyController = require("../controller/apify.controller");

/**
 * @swagger
 * /api/apify:
 *   get:
 *     tags:
 *       - Apify
 *     summary: Scrape and upload pictures
 *     description: Fetches images from Apify dataset and uploads them to Cloudinary folders (Sana, Momo, Liz).
 *     responses:
 *       200:
 *         description: Images successfully scraped and stored
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Images Stored All to sana only for now"
 *       500:
 *         description: Internal server error
 */
router.get("/", apifyController.getScrappedPictures);

module.exports = router;
