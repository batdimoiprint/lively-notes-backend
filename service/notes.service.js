const client = require("../db/db.js");
const { ObjectId } = require("mongodb");
const myDB = client.db("livelydesktopnotes");
const notesCollection = myDB.collection("notes");

async function getAll() {
  const cursor = await notesCollection.find({});
  return cursor.toArray();
}

async function createNote(payload) {
  await notesCollection.insertOne(payload);
  return { ...payload };
}

async function deleteNote(id) {
  // defensive check (controller already validates, but keep service safe)
  if (!ObjectId.isValid(id)) {
    return { acknowledged: false, deletedCount: 0 };
  }

  const _id = new ObjectId(id);
  const result = await notesCollection.deleteOne({ _id });
  return {
    acknowledged: result.acknowledged,
    deletedCount: result.deletedCount,
  };
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
  deleteNote,
  updateNote,
  isValidObjectId,
};
