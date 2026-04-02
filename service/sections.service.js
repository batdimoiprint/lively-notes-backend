const client = require("../db/db.js");
const myDB = client.db("livelydesktopnotes");
const sectionsCollection = myDB.collection("sections");
const notesCollection = myDB.collection("notes");

async function getAll() {
  const cursor = await sectionsCollection.find({}).sort({ order: 1 });
  return cursor.toArray();
}

async function getAllWithNoteCounts() {
  const sections = await sectionsCollection.aggregate([
    {
      $lookup: {
        from: "notes",
        localField: "_id",
        foreignField: "sectionId",
        as: "notes"
      }
    },
    {
      $addFields: {
        noteCount: { $size: "$notes" }
      }
    },
    {
      $project: {
        notes: 0
      }
    },
    { $sort: { order: 1 } }
  ]).toArray();
  
  return sections;
}

async function createSection(payload) {
  const section = {
    _id: payload._id || payload.title.toLowerCase().replace(/\s+/g, '-'),
    title: payload.title,
    order: payload.order || 0,
    createdAt: new Date(),
  };
  await sectionsCollection.insertOne(section);
  return section;
}

async function deleteSection(id) {
  // Move notes from deleted section to default
  await notesCollection.updateMany(
    { sectionId: id },
    { $set: { sectionId: "default" } }
  );
  
  const result = await sectionsCollection.deleteOne({ _id: id });
  return {
    acknowledged: result.acknowledged,
    deletedCount: result.deletedCount,
  };
}

async function updateSection(payload) {
  const updateFields = {};
  
  if (payload.title !== undefined) {
    updateFields.title = payload.title;
  }
  if (payload.order !== undefined) {
    updateFields.order = payload.order;
  }

  const result = await sectionsCollection.updateOne(
    { _id: payload._id },
    { $set: updateFields }
  );
  
  return {
    acknowledged: result.acknowledged,
    modified: result.modifiedCount,
  };
}

async function initializeDefaultSection() {
  const defaultExists = await sectionsCollection.findOne({ _id: "default" });
  if (!defaultExists) {
    await sectionsCollection.insertOne({
      _id: "default",
      title: "Notes",
      order: 0,
      createdAt: new Date()
    });
  }
  
  // Add sectionId to notes that don't have it
  await notesCollection.updateMany(
    { sectionId: { $exists: false } },
    { $set: { sectionId: "default" } }
  );
}

async function updateOrder(orderedIds) {
  const bulkOps = orderedIds.map((id, index) => ({
    updateOne: {
      filter: { _id: id },
      update: { $set: { order: index } },
    },
  }));

  const result = await sectionsCollection.bulkWrite(bulkOps);
  return {
    acknowledged: result.ok === 1,
    modified: result.modifiedCount,
  };
}

module.exports = {
  getAll,
  getAllWithNoteCounts,
  createSection,
  deleteSection,
  updateSection,
  updateOrder,
  initializeDefaultSection,
};
