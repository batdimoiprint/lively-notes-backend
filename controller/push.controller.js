const pushService = require("../service/push.service.js");

async function subscribe(req, res, next) {
  try {
    const subscription = req.body;

    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ error: "Valid push subscription is required" });
    }

    await pushService.saveSubscription(subscription);
    res.status(201).json({ message: "Subscription saved" });
  } catch (err) {
    next(err);
  }
}

async function unsubscribe(req, res, next) {
  try {
    const { endpoint } = req.body;

    if (!endpoint) {
      return res.status(400).json({ error: "Endpoint is required" });
    }

    await pushService.removeSubscription(endpoint);
    res.status(200).json({ message: "Subscription removed" });
  } catch (err) {
    next(err);
  }
}

async function testNotification(req, res, next) {
  try {
    const payload = {
      title: "🔔 Test Notification",
      body: "Push notifications are working! — Lively Notes",
      url: "/",
      tag: "test-notification",
    };

    const results = await pushService.sendToAll(payload);
    const successCount = results.filter((r) => r.success).length;

    res.status(200).json({
      message: `Test notification sent to ${successCount}/${results.length} subscription(s)`,
      results,
    });
  } catch (err) {
    next(err);
  }
}

async function getVapidPublicKey(req, res) {
  const key = pushService.getVapidPublicKey();
  if (!key) {
    return res.status(500).json({ error: "VAPID keys not configured" });
  }
  res.status(200).json({ publicKey: key });
}

module.exports = { subscribe, unsubscribe, testNotification, getVapidPublicKey };
