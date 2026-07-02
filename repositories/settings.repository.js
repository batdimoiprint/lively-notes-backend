const client = require("../db/db.js");
const { GetCommand, PutCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const { docClient, TABLES } = require("../db/dynamo.js");
const {
  readsFromDynamo,
  bestEffortDynamo,
  fromDynamoItem,
} = require("./repository.util.js");

const myDB = client.db("livelydesktopnotes");
const settingsCollection = myDB.collection("settings");

// Settings is a single global document; in DynamoDB it lives under a fixed key.
const SETTINGS_ID = "SETTINGS";

function stripIds(payload) {
  const { _id, id, ...rest } = payload;
  return rest;
}

async function getSettings() {
  if (readsFromDynamo()) {
    const { Item } = await docClient.send(
      new GetCommand({ TableName: TABLES.settings, Key: { id: SETTINGS_ID } })
    );
    // The API returns an array (Mongo find().toArray() shape).
    return Item ? [fromDynamoItem(Item)] : [];
  }
  const cursor = settingsCollection.find({});
  return cursor.toArray();
}

async function resetSettings(payload) {
  // Mongo keeps its historical drop()+reinsert pattern; DynamoDB just
  // replaces the single fixed item.
  await settingsCollection.drop();
  await settingsCollection.insertOne(payload);

  await bestEffortDynamo("settings.reset", () =>
    docClient.send(
      new PutCommand({
        TableName: TABLES.settings,
        Item: { id: SETTINGS_ID, ...stripIds(payload) },
      })
    )
  );

  return { ...payload };
}

async function patchSettings(payload) {
  const result = await settingsCollection.updateMany(
    {},
    { $set: payload },
    { upsert: true }
  );

  await bestEffortDynamo("settings.patch", async () => {
    const fields = stripIds(payload);
    const names = {};
    const values = {};
    const sets = [];
    Object.entries(fields).forEach(([key, value], i) => {
      names[`#f${i}`] = key;
      values[`:v${i}`] = value;
      sets.push(`#f${i} = :v${i}`);
    });
    if (sets.length === 0) return;

    await docClient.send(
      new UpdateCommand({
        TableName: TABLES.settings,
        Key: { id: SETTINGS_ID },
        UpdateExpression: `SET ${sets.join(", ")}`,
        ExpressionAttributeNames: names,
        ExpressionAttributeValues: values,
      })
    );
  });

  return {
    acknowledged: result.acknowledged,
    modified: result.modifiedCount,
  };
}

module.exports = {
  getSettings,
  resetSettings,
  patchSettings,
};
