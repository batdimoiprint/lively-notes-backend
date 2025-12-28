const express = require("express");
const settingsController = require("../controller/settingsController");
const router = express.Router();

router.get("/", settingsController.getSettings);
router.post("/", settingsController.resetSettings);
router.patch("/", settingsController.patchSettings);

module.exports = router;
