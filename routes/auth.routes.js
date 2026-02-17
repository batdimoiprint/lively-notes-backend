const express = require("express");
const authController = require("../controller/auth.controller");
const {
  authJWT,
  refreshJWT,
  removeCookie,
} = require("../middleware/jwt.config.js");
const router = express.Router();

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Login and set JWT cookie
 *     description: Authenticates a user using a passcode and sets an httpOnly cookie named `JWT_KEY` on success.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Login successful, JWT cookie set (Set-Cookie header)
 *       400:
 *         description: Wrong passkey or bad request
 */
router.post("/login", authController.login);

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Register a new user
 *     description: Register a new user with a passcode.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       201:
 *         description: Registration successful
 *       400:
 *         description: Invalid input
 */
router.post("/register", authController.register);

/**
 * @swagger
 * /api/notes:
 *   get:
 *     tags:
 *       - Auth
 *     summary: Get Me Data
 *     responses:
 *       200:
 *         description: Me
 */
router.get("/me", authController.getMe);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Refresh JWT cookie
 *     description: Verifies the current JWT cookie and issues a new one with a renewed expiry.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Token refreshed and new cookie set
 *       401:
 *         description: No cookie provided
 *       403:
 *         description: Invalid or expired token
 */
router.post("/refresh", authJWT, refreshJWT);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Logout and clear JWT cookie
 *     description: Clears the `JWT_KEY` cookie on the client.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Logged out, cookie cleared
 *       401:
 *         description: No cookie provided
 */
router.post("/logout", authJWT, removeCookie);

module.exports = router;
