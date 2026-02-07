const express = require("express");
const router = express.Router();
/**
 * @swagger
 * /api/wake:
 *   get:
 *     tags:
 *       - Wake
 *     summary: Wake Backend
 *     responses:
 *       200:
 *         description: Success
 */
router.get("/",(req, res) => {
  res.status(200).send();
})

module.exports = router;