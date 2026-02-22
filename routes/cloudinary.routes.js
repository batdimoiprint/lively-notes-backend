const express = require("express");
const router = express.Router();
const {
  getAllImages,
  getImagesByFolder,
} = require("../controller/cloudinary.controller");

/**
 * @swagger
 * /api/images:
 *   get:
 *     tags:
 *       - Cloudinary
 *     summary: Get all images
 *     description: Fetches all uploaded images from Cloudinary (up to 500).
 *     responses:
 *       200:
 *         description: List of image public IDs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *                 example: "folder/image123"
 *       500:
 *         description: Failed to fetch images
 */
router.get("/", getAllImages);

/**
 * @swagger
 * /api/images/folder/{folderName}:
 *   get:
 *     tags:
 *       - Cloudinary
 *     summary: Get images by folder
 *     description: Fetches images from a specific Cloudinary folder (up to 500).
 *     parameters:
 *       - in: path
 *         name: folderName
 *         required: true
 *         schema:
 *           type: string
 *         description: Cloudinary folder name
 *     responses:
 *       200:
 *         description: List of image public IDs in the folder
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *                 example: "folderName/image123"
 *       500:
 *         description: Failed to fetch images from folder
 */
router.get("/folder/:folderName", getImagesByFolder);

module.exports = router;
