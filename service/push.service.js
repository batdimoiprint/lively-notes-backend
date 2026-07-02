const webpush = require("web-push");
const pushSubscriptionsRepository = require("../repositories/pushSubscriptions.repository.js");

// Configure VAPID
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT;

if (vapidPublicKey && vapidPrivateKey && vapidSubject) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

async function saveSubscription(subscription) {
  return pushSubscriptionsRepository.save(subscription);
}

async function removeSubscription(endpoint) {
  return pushSubscriptionsRepository.remove(endpoint);
}

async function getAllSubscriptions() {
  return pushSubscriptionsRepository.getAll();
}

async function sendNotification(subscription, payload) {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    return { success: true };
  } catch (error) {
    // If subscription is expired/invalid, remove it
    if (error.statusCode === 410 || error.statusCode === 404) {
      await removeSubscription(subscription.endpoint);
    }
    return { success: false, error: error.message };
  }
}

async function sendToAll(payload) {
  const subscriptions = await getAllSubscriptions();
  const results = [];

  for (const sub of subscriptions) {
    const result = await sendNotification(sub, payload);
    results.push(result);
  }

  return results;
}

function getVapidPublicKey() {
  return vapidPublicKey;
}

module.exports = {
  saveSubscription,
  removeSubscription,
  getAllSubscriptions,
  sendNotification,
  sendToAll,
  getVapidPublicKey,
};
