const express = require("express");
const pushController = require("../controller/push.controller.js");

const router = express.Router();

/**
 * @swagger
 * /api/push/vapid-public-key:
 *   get:
 *     tags:
 *       - Push Notifications
 *     summary: Get VAPID public key
 *     responses:
 *       200:
 *         description: VAPID public key for push subscription
 */
router.get("/vapid-public-key", pushController.getVapidPublicKey);

/**
 * @swagger
 * /api/push/subscribe:
 *   post:
 *     tags:
 *       - Push Notifications
 *     summary: Subscribe to push notifications
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               endpoint:
 *                 type: string
 *               keys:
 *                 type: object
 *                 properties:
 *                   p256dh:
 *                     type: string
 *                   auth:
 *                     type: string
 *     responses:
 *       201:
 *         description: Subscription saved
 */
router.post("/subscribe", pushController.subscribe);

/**
 * @swagger
 * /api/push/unsubscribe:
 *   post:
 *     tags:
 *       - Push Notifications
 *     summary: Unsubscribe from push notifications
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               endpoint:
 *                 type: string
 *     responses:
 *       200:
 *         description: Subscription removed
 */
router.post("/unsubscribe", pushController.unsubscribe);

/**
 * @swagger
 * /api/push/test:
 *   post:
 *     tags:
 *       - Push Notifications
 *     summary: Send a test push notification
 *     responses:
 *       200:
 *         description: Test notification sent
 */
router.post("/test", pushController.testNotification);

module.exports = router;
