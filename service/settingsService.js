const client = require("../db/db.js");
const { ObjectId } = require("mongodb");
const myDB = client.db("livelydesktopnotes");
const settingsCollection = myDB.collection("settings");

async function getSettings() {
  try {
    const cursor = await settingsCollection.find({});
    return cursor.toArray();
  } catch (error) {
    throw new Error(error);
  }
}

async function resetSettingsPost(payload) {
  try {
    await settingsCollection.drop();
    await settingsCollection.insertOne(payload);
    return { ...payload };
  } catch (error) {
    throw new Error(error);
  }
}

async function patchSettings(payload) {
  try {
    const result = await settingsCollection.updateMany(
      {},
      {
        $set: payload,
      },
      { upsert: true }
    );
    return {
      acknowledged: result.acknowledged,
      modified: result.modifiedCount,
    };
  } catch (error) {
    throw new Error(error);
  }
}

module.exports = {
  getSettings,
  resetSettingsPost,
  patchSettings,
};
