const express = require("express");
const router = express.Router();
const apifyController = require("../controller/apify.controller");

/**
 * @swagger
 * /api/igpost:
 *   get:
 *     tags:
 *       - IG Posts
 *     summary: Get one random post from DB
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

// Kinda Not needed anymore
/**
 * @swagger
 * /api/apify/actor:
 *   get:
 *     tags:
 *       - Apify
 *     summary: Get Actor Information
 *     description: Retrieves metadata and configuration details about the Instagram scraper actor from Apify.
 *     responses:
 *       200:
 *         description: Actor information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "instagram-scraper-id"
 *                 name:
 *                   type: string
 *                   example: "instagram-scraper"
 *                 username:
 *                   type: string
 *                   example: "apify"
 *                 description:
 *                   type: string
 *                   example: "Scrapes Instagram posts, profiles, and hashtags"
 *       500:
 *         description: Internal server error or Apify API error
 */
router.get("/actor" , apifyController.getActorInfo)

/**
 * @swagger
 * /api/apify/actor/dataset:
 *   post:
 *     tags:
 *       - Apify
 *     summary: Get Actor Dataset
 *     description: Starts the Instagram scraper actor to collect posts from a specific profile. Returns the scraped data including caption, URL, likes count, and owner username.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               runID:
 *                 type: string
 *                 example: liz.yeyo
 *     responses:
 *       200:
 *         description: Scraping completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       caption:
 *                         type: string
 *                         example: "A beautiful sunset."
 *                       url:
 *                         type: string
 *                         example: "https://www.instagram.com/p/xyz123/"
 *                       likesCount:
 *                         type: integer
 *                         example: 150
 *                       ownerUsername:
 *                         type: string
 *                         example: "liz.yeyo"
 *       500:
 *         description: Failed to start actor or retrieve data
 */
router.post("/actor/dataset" , apifyController.getDataset)

/**
 * @swagger
 * /api/apify/run-actor:
 *   post:
 *     tags:
 *       - Apify
 *     summary: Run Instagram Scraper
 *     description: Starts the Instagram scraper actor for a specific profile and stores returned posts in MongoDB after uploading images to Cloudinary.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: liz.yeyo
 *     responses:
 *       200:
 *         description: Scraping completed successfully and posts were stored
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Success"
 *                 insertedCount:
 *                   type: integer
 *                   example: 1
 *       400:
 *         description: Invalid request body
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "username is required"
 *       404:
 *         description: No posts were returned for the supplied username
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "No posts were returned for this username"
 *       500:
 *         description: Failed to start actor or retrieve data
 */
router.post("/run-actor" , apifyController.runActor)



module.exports = router;
