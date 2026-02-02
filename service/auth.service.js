const client = require("../db/db.js");
const { ObjectId } = require("mongodb");
const myDB = client.db("livelydesktopnotes");
const notesCollection = myDB.collection("user");

async function getAll() {
  const cursor = await notesCollection.find({});
  return cursor.toArray();
}

async function createNote(payload) {
  await notesCollection.insertOne(payload);
  return { ...payload };
}

async function updateNote(payload) {
  try {
    if (!ObjectId.isValid(payload._id)) {
      return { acknowledged: false, modified: 0 };
    }

    const id = new ObjectId(payload._id);
    const result = await notesCollection.replaceOne(
      { _id: id },
      { title: payload.title, body: payload.body }
    );
    return {
      acknowledged: result.acknowledged,
      modified: result.modifiedCount,
    };
  } catch (error) {
    console.log(error);
  }
}

function isValidObjectId(id) {
  return ObjectId.isValid(id);
}

module.exports = {
  getAll,
  createNote,
  updateNote,
  isValidObjectId,
};
