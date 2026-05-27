const client = require("../db/db.js");
const { ObjectId } = require("mongodb");
const myDB = client.db("livelydesktopnotes");
const calendarNotesCollection = myDB.collection("calendarNotes");

async function getAll() {
  const cursor = await calendarNotesCollection.find({}).sort({ date: 1, createdAt: 1 });
  return cursor.toArray();
}

async function getByMonth(year, month) {
  // month is 1-based (1=Jan, 12=Dec)
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endMonth = month === 12 ? 1 : month + 1;
  const endYear = month === 12 ? year + 1 : year;
  const endDate = `${endYear}-${String(endMonth).padStart(2, "0")}-01`;

  const cursor = await calendarNotesCollection
    .find({ date: { $gte: startDate, $lt: endDate } })
    .sort({ date: 1, createdAt: 1 });
  return cursor.toArray();
}

async function createNote(payload) {
  const note = {
    title: payload.title,
    body: payload.body,
    date: payload.date, // "YYYY-MM-DD"
    reminderAt: payload.reminderAt ? new Date(payload.reminderAt) : null,
    reminderInterval: payload.reminderInterval || "once",
    reminderSent: false,
    isWholeDay: !!payload.isWholeDay,
    createdAt: new Date(),
  };
  const result = await calendarNotesCollection.insertOne(note);
  return { _id: result.insertedId, ...note };
}

async function updateNote(payload) {
  if (!ObjectId.isValid(payload._id)) {
    return { acknowledged: false, modified: 0 };
  }

  const id = new ObjectId(payload._id);
  const updateFields = {};

  if (payload.title !== undefined) updateFields.title = payload.title;
  if (payload.body !== undefined) updateFields.body = payload.body;
  if (payload.date !== undefined) updateFields.date = payload.date;
  if (payload.reminderAt !== undefined) {
    updateFields.reminderAt = payload.reminderAt ? new Date(payload.reminderAt) : null;
    // Reset reminderSent if reminder time is changed
    updateFields.reminderSent = false;
  }
  if (payload.reminderInterval !== undefined) {
    updateFields.reminderInterval = payload.reminderInterval || "once";
  }
  if (payload.isWholeDay !== undefined) {
    updateFields.isWholeDay = !!payload.isWholeDay;
  }

  const result = await calendarNotesCollection.updateOne({ _id: id }, { $set: updateFields });
  return {
    acknowledged: result.acknowledged,
    modified: result.modifiedCount,
  };
}

async function deleteNote(id) {
  if (!ObjectId.isValid(id)) {
    return { acknowledged: false, deletedCount: 0 };
  }

  const _id = new ObjectId(id);
  const result = await calendarNotesCollection.deleteOne({ _id });
  return {
    acknowledged: result.acknowledged,
    deletedCount: result.deletedCount,
  };
}

async function getDueReminders() {
  const now = new Date();
  const cursor = await calendarNotesCollection.find({
    reminderAt: { $lte: now },
    reminderSent: false,
  });
  return cursor.toArray();
}

async function markReminderSent(id) {
  const _id = new ObjectId(id);
  return calendarNotesCollection.updateOne(
    { _id },
    { $set: { reminderSent: true } }
  );
}

function isValidObjectId(id) {
  return ObjectId.isValid(id);
}

function isValidDateString(dateStr) {
  if (typeof dateStr !== "string") return false;
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;
  const date = new Date(dateStr + "T00:00:00Z");
  return !isNaN(date.getTime());
}

module.exports = {
  getAll,
  getByMonth,
  createNote,
  updateNote,
  deleteNote,
  getDueReminders,
  markReminderSent,
  isValidObjectId,
  isValidDateString,
};
