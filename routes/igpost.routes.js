const express = require('express');
const router = express.Router()
const igpost_controller = require('../controller/igpost.controller');
const igusername_controller = require('../controller/igusername.controller');


/**
 * @swagger
 * /api/igpost:
 *   get:
 *     tags:
 *       - IG Posts
 *     summary: Get one random IG post from DB
 *     description: Returns a single random Instagram post from the database, including its caption, image URL, likes count, and owner username.
 *     responses:
 *       200:
 *         description: Random IG post retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 postID:
 *                   type: string
 *                   example: "17984326944312345"
 *                 caption:
 *                   type: string
 *                   example: "A beautiful sunset."
 *                 url:
 *                   type: string
 *                   example: "https://www.instagram.com/p/xyz123/"
 *                 likesCount:
 *                   type: integer
 *                   example: 150
 *                 ownerUsername:
 *                   type: string
 *                   example: "liz.yeyo"
 *                 cloudinaryPics:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       public_id:
 *                         type: string
 *                         example: "Liz/17984326944312345/image1"
 *                       secure_url:
 *                         type: string
 *                         example: "https://res.cloudinary.com/..."
 *       500:
 *         description: Internal server error
 */
router.get("/", igpost_controller.returnOneRandomPost)

/**
 * @swagger
 * /api/igpost/events:
 *   get:
 *     tags:
 *       - IG Posts
 *     summary: Stream IG post refresh events
 *     description: Keeps an SSE connection open so the frontend can refresh idol posts after scraping finishes.
 *     responses:
 *       200:
 *         description: SSE stream opened successfully
 *       400:
 *         description: Invalid user
 */
router.get("/events", igpost_controller.streamIgPostsUpdates);

/**
 * @swagger
 * /api/igpost/idol-posts:
 *   get:
 *     tags:
 *       - IG Posts
 *     summary: Get one random IG post for each saved IG username
 *     description: Returns an array of random Instagram posts where each item corresponds to one saved username for the authenticated user. Usernames without posts are skipped.
 *     responses:
 *       200:
 *         description: IG posts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   postID:
 *                     type: string
 *                     example: "17984326944312345"
 *                   caption:
 *                     type: string
 *                     example: "A beautiful sunset."
 *                   url:
 *                     type: string
 *                     example: "https://www.instagram.com/p/xyz123/"
 *                   likesCount:
 *                     type: integer
 *                     example: 150
 *                   ownerUsername:
 *                     type: string
 *                     example: "liz.yeyo"
 *                   cloudinaryPics:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         public_id:
 *                           type: string
 *                           example: "liz.yeyo-abc123/image1"
 *                         secure_url:
 *                           type: string
 *                           example: "https://res.cloudinary.com/..."
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.get("/idol-posts", igpost_controller.getIdolPosts)

/**
 * @swagger
 * /api/igpost/usernames:
 *   get:
 *     tags:
 *       - IG Posts
 *     summary: List IG usernames for authenticated user
 *     responses:
 *       200:
 *         description: IG usernames fetched successfully
 *       404:
 *         description: User not found
 */
router.get("/usernames", igusername_controller.listIgUsernames);

/**
 * @swagger
 * /api/igpost/usernames:
 *   post:
 *     tags:
 *       - IG Posts
 *     summary: Add an IG username for authenticated user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               igUsername:
 *                 type: string
 *                 example: "liz.yeyo"
 *     responses:
 *       201:
 *         description: IG username created
 *       409:
 *         description: Duplicate IG username
 */
router.post("/usernames", igusername_controller.createIgUsername);

/**
 * @swagger
 * /api/igpost/usernames/{autoIncrement}:
 *   put:
 *     tags:
 *       - IG Posts
 *     summary: Update an IG username by autoIncrement id
 *     parameters:
 *       - in: path
 *         name: autoIncrement
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: IG username updated
 *       404:
 *         description: Entry not found
 */
router.put("/usernames/:autoIncrement", igusername_controller.updateIgUsername);

/**
 * @swagger
 * /api/igpost/usernames/{autoIncrement}:
 *   delete:
 *     tags:
 *       - IG Posts
 *     summary: Delete an IG username by autoIncrement id
 *     parameters:
 *       - in: path
 *         name: autoIncrement
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: IG username deleted
 *       404:
 *         description: Entry not found
 */
router.delete("/usernames/:autoIncrement", igusername_controller.deleteIgUsername);


module.exports = router;
