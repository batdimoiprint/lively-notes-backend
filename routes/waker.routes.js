const express = require("express");
const router = express.Router();
/**
 * @swagger
 * /api/wake:
 *   get:
 *     tags:
 *       - Wake
 *     summary: Wake Backend
 *     description: A simple endpoint to wake up the backend service.
 *     responses:
 *       200:
 *         description: Backend is awake
 */
router.get("/",(req, res) => {
  res.status(200).send();
})

module.exports = router;