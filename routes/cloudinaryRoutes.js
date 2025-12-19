const express = require("express");
const router = express.Router();
const {
  getAllImages,
  getImagesByFolder,
} = require("../controller/cloudinaryController");

router.get("/", getAllImages);
router.get("/folder/:folderName", getImagesByFolder);

module.exports = router;
