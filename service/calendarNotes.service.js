const calendarNotesRepository = require("../repositories/calendarNotes.repository.js");
const { isValidId } = require("../repositories/repository.util.js");

async function getAll() {
  return calendarNotesRepository.getAll();
}

async function getByMonth(year, month) {
  // month is 1-based (1=Jan, 12=Dec)
  return calendarNotesRepository.getByMonth(year, month);
}

async function createNote(payload) {
  return calendarNotesRepository.create({
    title: payload.title,
    body: payload.body,
    date: payload.date, // "YYYY-MM-DD"
    reminderAt: payload.reminderAt ? new Date(payload.reminderAt) : null,
    reminderInterval: payload.reminderInterval || "once",
    reminderSent: false,
    isWholeDay: !!payload.isWholeDay,
    createdAt: new Date(),
  });
}

async function updateNote(payload) {
  if (!isValidId(payload._id)) {
    return { acknowledged: false, modified: 0 };
  }

  const updateFields = {};
  if (payload.title !== undefined) updateFields.title = payload.title;
  if (payload.body !== undefined) updateFields.body = payload.body;
  if (payload.date !== undefined) updateFields.date = payload.date;
  if (payload.reminderAt !== undefined) {
    updateFields.reminderAt = payload.reminderAt
      ? new Date(payload.reminderAt)
      : null;
    // Reset reminderSent if reminder time is changed
    updateFields.reminderSent = false;
  }
  if (payload.reminderInterval !== undefined) {
    updateFields.reminderInterval = payload.reminderInterval || "once";
  }
  if (payload.isWholeDay !== undefined) {
    updateFields.isWholeDay = !!payload.isWholeDay;
  }

  return calendarNotesRepository.update(payload._id, updateFields);
}

async function deleteNote(id) {
  if (!isValidId(id)) {
    return { acknowledged: false, deletedCount: 0 };
  }
  return calendarNotesRepository.remove(id);
}

async function getDueReminders() {
  return calendarNotesRepository.getDueReminders();
}

async function markReminderSent(id) {
  return calendarNotesRepository.markReminderSent(id);
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
  isValidId,
  isValidDateString,
};
