const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload.config");
const { authJWT } = require("../middleware/jwt.config");
const {
  uploadSinglePicture,
  getSingleImageByFolder,
} = require("../controller/cloudinary.controller");

/**
 * @swagger
 * /api/backgroundimage:
 *   get:
 *     tags:
 *       - Background Image
 *     summary: Get a single background image
 *     description: Returns one image from the Cloudinary wallpapers folder for use as the app background.
 *     responses:
 *       200:
 *         description: A background image record
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 public_id:
 *                   type: string
 *                   example: wallpapers/my-wallpaper
 *                 secure_url:
 *                   type: string
 *                   example: https://res.cloudinary.com/demo/image/upload/v1/wallpapers/my-wallpaper.jpg
 *       404:
 *         description: No background image found in wallpapers folder
 *       500:
 *         description: Failed to fetch background image
 */
router.get("/", getSingleImageByFolder);

/**
 * @swagger
 * /api/backgroundimage:
 *   post:
 *     tags:
 *       - Background Image
 *     summary: Upload a background image
 *     description: Uploads a single image file to the Cloudinary wallpapers folder.
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Image file to upload
 *     responses:
 *       201:
 *         description: Image uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 public_id:
 *                   type: string
 *                   example: wallpapers/my-wallpaper
 *                 secure_url:
 *                   type: string
 *                   example: https://res.cloudinary.com/demo/image/upload/v1/wallpapers/my-wallpaper.jpg
 *       400:
 *         description: Image file is required
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to upload image
 */
router.post("/", authJWT, upload.single("image"), uploadSinglePicture);

module.exports = router;
