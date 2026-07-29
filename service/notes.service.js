const notesRepository = require("../repositories/notes.repository.js");
const { isValidId } = require("../repositories/repository.util.js");
const { broadcastSyncEvent } = require("./sync.service.js");

async function getAll() {
  return notesRepository.getAll();
}

async function getBySection(sectionId) {
  return notesRepository.getBySection(sectionId);
}

async function createNote(payload) {
  const result = await notesRepository.create(payload);
  const id = result?._id || result?.insertedId || result?.id;
  broadcastSyncEvent("global_user", { domain: "notes", action: "create", id });
  broadcastSyncEvent("global_user", { domain: "sections", action: "update" });
  return result;
}

async function deleteNote(id) {
  // defensive check (controller already validates, but keep service safe)
  if (!isValidId(id)) {
    return { acknowledged: false, deletedCount: 0 };
  }
  const result = await notesRepository.remove(id);
  broadcastSyncEvent("global_user", { domain: "notes", action: "delete", id });
  broadcastSyncEvent("global_user", { domain: "sections", action: "update" });
  return result;
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

    const result = await notesRepository.update(payload._id, updateFields);
    broadcastSyncEvent("global_user", { domain: "notes", action: "update", id: payload._id });
    if (payload.sectionId !== undefined) {
      broadcastSyncEvent("global_user", { domain: "sections", action: "update" });
    }
    return result;
  } catch (error) {
    console.log(error);
  }
}

async function updateOrder(orderedIds) {
  const result = await notesRepository.updateOrder(orderedIds);
  broadcastSyncEvent("global_user", { domain: "notes", action: "reorder" });
  return result;
}

async function moveToSection(noteId, sectionId) {
  if (!isValidId(noteId)) {
    return { acknowledged: false, modified: 0 };
  }
  const result = await notesRepository.update(noteId, { sectionId });
  broadcastSyncEvent("global_user", { domain: "notes", action: "update", id: noteId });
  broadcastSyncEvent("global_user", { domain: "sections", action: "update" });
  return result;
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
