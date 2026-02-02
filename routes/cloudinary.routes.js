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
 *     responses:
 *       200:
 *         description: List of images
 */
router.get("/", getAllImages);

/**
 * @swagger
 * /api/images/folder/{folderName}:
 *   get:
 *     tags:
 *       - Cloudinary
 *     summary: Get images by folder
 *     parameters:
 *       - in: path
 *         name: folderName
 *         required: true
 *         schema:
 *           type: string
 *         description: Cloudinary folder name
 *     responses:
 *       200:
 *         description: List of images in folder
 */
router.get("/folder/:folderName", getImagesByFolder);

module.exports = router;
