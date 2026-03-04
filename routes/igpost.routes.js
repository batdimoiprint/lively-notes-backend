const express = require('express');
const router = express.Router()
const igpost_controller = require('../controller/igpost.controller');


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


module.exports = router;
