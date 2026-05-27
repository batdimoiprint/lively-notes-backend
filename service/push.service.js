const webpush = require("web-push");
const client = require("../db/db.js");
const myDB = client.db("livelydesktopnotes");
const subscriptionsCollection = myDB.collection("pushSubscriptions");

// Configure VAPID
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT;

if (vapidPublicKey && vapidPrivateKey && vapidSubject) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

async function saveSubscription(subscription) {
  // Upsert by endpoint to avoid duplicates
  const result = await subscriptionsCollection.updateOne(
    { endpoint: subscription.endpoint },
    { $set: { ...subscription, updatedAt: new Date() } },
    { upsert: true }
  );
  return result;
}

async function removeSubscription(endpoint) {
  return subscriptionsCollection.deleteOne({ endpoint });
}

async function getAllSubscriptions() {
  return subscriptionsCollection.find({}).toArray();
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
