const express = require("express");
const router = express.Router();
const { getAllImages } = require("../controller/cloudinaryController");

router.get("/", getAllImages);

module.exports = router;
