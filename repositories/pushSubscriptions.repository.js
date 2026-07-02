const client = require("../db/db.js");
const {
  ScanCommand,
  PutCommand,
  DeleteCommand,
} = require("@aws-sdk/lib-dynamodb");
const { docClient, TABLES } = require("../db/dynamo.js");
const {
  readsFromDynamo,
  bestEffortDynamo,
  toIso,
} = require("./repository.util.js");

const myDB = client.db("livelydesktopnotes");
const subscriptionsCollection = myDB.collection("pushSubscriptions");

// Keyed by the subscription endpoint in both stores (natural key, no UUID).

async function save(subscription) {
  const result = await subscriptionsCollection.updateOne(
    { endpoint: subscription.endpoint },
    { $set: { ...subscription, updatedAt: new Date() } },
    { upsert: true }
  );

  await bestEffortDynamo("pushSubscriptions.save", () =>
    docClient.send(
      new PutCommand({
        TableName: TABLES.pushSubscriptions,
        Item: { ...subscription, updatedAt: toIso(new Date()) },
      })
    )
  );

  return result;
}

async function remove(endpoint) {
  const result = await subscriptionsCollection.deleteOne({ endpoint });

  await bestEffortDynamo("pushSubscriptions.remove", () =>
    docClient.send(
      new DeleteCommand({
        TableName: TABLES.pushSubscriptions,
        Key: { endpoint },
      })
    )
  );

  return result;
}

async function getAll() {
  if (readsFromDynamo()) {
    const { Items } = await docClient.send(
      new ScanCommand({ TableName: TABLES.pushSubscriptions })
    );
    return Items || [];
  }
  return subscriptionsCollection.find({}).toArray();
}

module.exports = {
  save,
  remove,
  getAll,
};
