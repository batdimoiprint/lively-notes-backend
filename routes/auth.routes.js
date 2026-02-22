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
 *     summary: Login and set JWT cookies
 *     description: Authenticates a user using a passcode and sets `access_token` and `refresh_token` cookies on success.
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
 *         description: Login successful, JWT cookies set
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Success"
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
 * /api/auth/me:
 *   get:
 *     tags:
 *       - Auth
 *     summary: Get current user data
 *     description: Returns the user ID of the currently authenticated user.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: User data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 userId:
 *                   type: string
 *                   example: "60d5ec49f1b2c8b1f8e4e1a2"
 *       401:
 *         description: Invalid Token
 *       403:
 *         description: No Access Token
 */
router.get("/me", authJWT, authController.getMe);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Refresh JWT cookies
 *     description: Verifies the current `refresh_token` cookie and issues new `access_token` and `refresh_token` cookies.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Tokens refreshed and new cookies set
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Token Refreshed"
 *       401:
 *         description: No Refresh Token
 *       403:
 *         description: Invalid Refresh Token
 */
router.post("/refresh",  refreshJWT);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Logout user
 *     description: Clears the JWT cookies.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Logged out"
 *       401:
 *         description: Unauthorized
 */
router.post("/logout", authJWT, removeCookie);

module.exports = router;
