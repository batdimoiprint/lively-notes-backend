const express = require("express");
const router = express.Router();
const syncController = require("../controller/sync.controller");

router.get("/events", syncController.connectSyncStream);

module.exports = router;
