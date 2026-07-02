const notesRepository = require("../repositories/notes.repository.js");
const { isValidId } = require("../repositories/repository.util.js");

async function getAll() {
  return notesRepository.getAll();
}

async function getBySection(sectionId) {
  return notesRepository.getBySection(sectionId);
}

async function createNote(payload) {
  return notesRepository.create(payload);
}

async function deleteNote(id) {
  // defensive check (controller already validates, but keep service safe)
  if (!isValidId(id)) {
    return { acknowledged: false, deletedCount: 0 };
  }
  return notesRepository.remove(id);
}

async function updateNote(payload) {
  try {
    if (!isValidId(payload._id)) {
      return { acknowledged: false, modified: 0 };
    }

    const updateFields = {};
    if (payload.title !== undefined) {
      updateFields.title = payload.title;
    }
    if (payload.body !== undefined) {
      updateFields.body = payload.body;
    }
    if (payload.sectionId !== undefined) {
      updateFields.sectionId = payload.sectionId;
    }

    return await notesRepository.update(payload._id, updateFields);
  } catch (error) {
    console.log(error);
  }
}

async function updateOrder(orderedIds) {
  return notesRepository.updateOrder(orderedIds);
}

async function moveToSection(noteId, sectionId) {
  if (!isValidId(noteId)) {
    return { acknowledged: false, modified: 0 };
  }
  return notesRepository.update(noteId, { sectionId });
}

module.exports = {
  getAll,
  getBySection,
  createNote,
  deleteNote,
  updateNote,
  updateOrder,
  moveToSection,
  isValidId,
};
