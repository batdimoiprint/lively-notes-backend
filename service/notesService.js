const client = require("../db/db.js");
const { ObjectId } = require('mongodb');
const myDB = client.db("livelydesktopnotes");
const notesCollection = myDB.collection("notes");

/**
 * Retrieves all notes from the database.
 * @returns {Promise<Array>} A promise that resolves to an array of note objects.
 */
async function getAll() {
  const cursor = await notesCollection.find({});
  return cursor.toArray();
}

/**
 * Creates a new note in the database.
 * @param {object} payload - The note object to create.
 * @returns {Promise<object>} A promise that resolves to the created note object.
 */
async function createNote(payload) {
  await notesCollection.insertOne(payload);
  return { ...payload };
}

/**
 * Deletes a note from the database by its ID.
 * @param {string} id - The ID of the note to delete.
 * @returns {Promise<object>} A promise that resolves to an object containing the acknowledgment and deleted count.
 */
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

/**
 * Checks if a given string is a valid MongoDB ObjectId.
 * @param {string} id - The ID to validate.
 * @returns {boolean} True if the ID is a valid ObjectId, false otherwise.
 */
function isValidObjectId(id) {
  return ObjectId.isValid(id);
}

module.exports = { getAll, createNote, deleteNote, isValidObjectId };
