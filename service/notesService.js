const client = require("../db/db.js");
const { ObjectId } = require('mongodb');
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
    deletedCount: result.deletedCount
  };
}

function isValidObjectId(id) {
  return ObjectId.isValid(id);
}

module.exports = { getAll, createNote, deleteNote, isValidObjectId };
