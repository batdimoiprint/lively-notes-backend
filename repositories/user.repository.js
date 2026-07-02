const client = require("../db/db.js");
const {
  ScanCommand,
  GetCommand,
  PutCommand,
  UpdateCommand,
} = require("@aws-sdk/lib-dynamodb");
const { docClient, TABLES } = require("../db/dynamo.js");
const {
  readsFromDynamo,
  newId,
  toMongoId,
  bestEffortDynamo,
  fromDynamoItem,
} = require("./repository.util.js");

const myDB = client.db("livelydesktopnotes");
const userCollection = myDB.collection("user");

// ⚠️ pomodoroSound (an embedded binary blob) is EXPLICITLY NOT MIGRATED to
// DynamoDB — it stays MongoDB-only regardless of READ_SOURCE. Full MongoDB
// retirement is blocked until it gets a separate resolution (likely moving
// the audio to Cloudinary). See getPomodoroSound/setPomodoroSound below.

async function getFirstUser() {
  // Single-tenant login pattern: load the one user row.
  if (readsFromDynamo()) {
    const { Items } = await docClient.send(
      new ScanCommand({ TableName: TABLES.user, Limit: 1 })
    );
    return fromDynamoItem((Items || [])[0]);
  }
  const users = await userCollection.find({}).limit(1).toArray();
  return users[0] || null;
}

async function getAllUsers() {
  if (readsFromDynamo()) {
    const { Items } = await docClient.send(
      new ScanCommand({ TableName: TABLES.user })
    );
    return (Items || []).map(fromDynamoItem);
  }
  return userCollection.find({}).toArray();
}

async function getById(userId) {
  if (readsFromDynamo()) {
    const { Item } = await docClient.send(
      new GetCommand({ TableName: TABLES.user, Key: { id: String(userId) } })
    );
    return fromDynamoItem(Item);
  }
  return userCollection.findOne({ _id: toMongoId(userId) });
}

async function create({ code }) {
  const _id = newId();
  await userCollection.insertOne({
    _id,
    code,
    igUsernames: [],
    pomodoroSound: null,
  });

  await bestEffortDynamo("user.create", () =>
    docClient.send(
      new PutCommand({
        TableName: TABLES.user,
        // No pomodoroSound attribute — Mongo-only, see note above.
        Item: { id: _id, code, igUsernames: [] },
      })
    )
  );

  return { _id, code, igUsernames: [] };
}

async function updateIgUsernames(userId, igUsernames) {
  const result = await userCollection.updateOne(
    { _id: toMongoId(userId) },
    { $set: { igUsernames } }
  );

  await bestEffortDynamo("user.updateIgUsernames", () =>
    docClient.send(
      new UpdateCommand({
        TableName: TABLES.user,
        Key: { id: String(userId) },
        UpdateExpression: "SET igUsernames = :list",
        ConditionExpression: "attribute_exists(id)",
        ExpressionAttributeValues: { ":list": igUsernames },
      })
    )
  );

  return result;
}

// --- pomodoroSound: MongoDB-only (out of migration scope) ------------------

async function getPomodoroSound(userId) {
  const user = await userCollection.findOne({ _id: toMongoId(userId) });
  if (!user) {
    return { notFound: true, sound: null };
  }
  return { notFound: false, sound: user.pomodoroSound || null };
}

async function setPomodoroSound(userId, sound) {
  const user = await userCollection.findOne({ _id: toMongoId(userId) });
  if (!user) {
    return { notFound: true };
  }
  await userCollection.updateOne(
    { _id: user._id },
    { $set: { pomodoroSound: sound } }
  );
  return { notFound: false };
}

module.exports = {
  getFirstUser,
  getAllUsers,
  getById,
  create,
  updateIgUsernames,
  getPomodoroSound,
  setPomodoroSound,
};
