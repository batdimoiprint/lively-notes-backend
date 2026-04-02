const client = require("../db/db.js");
const { ObjectId } = require("mongodb");
const myDB = client.db("livelydesktopnotes");
const notesCollection = myDB.collection("notes");

async function getAll() {
  const cursor = await notesCollection.find({}).sort({ order: 1 });
  return cursor.toArray();
}

async function getBySection(sectionId) {
  const cursor = await notesCollection.find({ sectionId }).sort({ order: 1 });
  return cursor.toArray();
}

async function createNote(payload) {
  const note = {
    title: payload.title,
    body: payload.body,
    sectionId: payload.sectionId || "default",
  };
  await notesCollection.insertOne(note);
  return { ...note };
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
    const updateFields = {
      title: payload.title,
      body: payload.body,
    };
    
    if (payload.sectionId !== undefined) {
      updateFields.sectionId = payload.sectionId;
    }
    
    const result = await notesCollection.replaceOne(
      { _id: id },
      updateFields
    );
    return {
      acknowledged: result.acknowledged,
      modified: result.modifiedCount,
    };
  } catch (error) {
    console.log(error);
  }
}

async function updateOrder(orderedIds) {
  const bulkOps = orderedIds.map((id, index) => ({
    updateOne: {
      filter: { _id: new ObjectId(id) },
      update: { $set: { order: index } },
    },
  }));

  const result = await notesCollection.bulkWrite(bulkOps);
  return {
    acknowledged: result.ok === 1,
    modified: result.modifiedCount,
  };
}

async function moveToSection(noteId, sectionId) {
  if (!ObjectId.isValid(noteId)) {
    return { acknowledged: false, modified: 0 };
  }

  const id = new ObjectId(noteId);
  const result = await notesCollection.updateOne(
    { _id: id },
    { $set: { sectionId } }
  );

  return {
    acknowledged: result.acknowledged,
    modified: result.modifiedCount,
  };
}

function isValidObjectId(id) {
  return ObjectId.isValid(id);
}

module.exports = {
  getAll,
  getBySection,
  createNote,
  deleteNote,
  updateNote,
  updateOrder,
  moveToSection,
  isValidObjectId,
};
