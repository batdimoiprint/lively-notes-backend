const express = require("express");
const authController = require("../controller/auth.controller");
const { authJWT } = require("../middleware/jwt.config.js");
const router = express.Router();

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Test Login
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Success Login
 *       400:
 *         description: Wrong Passkey
 */
router.post("/login", authController.login)


/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Register or authenticate a user with a code
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       201:
 *         description: Registration or authentication successful
 *       400:
 *         description: Invalid input
 */
router.post("/register", authJWT, authController.register)


module.exports = router;