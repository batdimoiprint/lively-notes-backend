const client = require("../db/db.js");
const myDB = client.db("livelydesktopnotes");
const notesCollection = myDB.collection("notes");

async function getAll() {
  const cursor = await notesCollection.find({});
  return cursor.toArray();
}

async function create(payload) {
  await notesCollection.insertOne(payload);
  return { ...payload };
}

module.exports = { getAll, create };