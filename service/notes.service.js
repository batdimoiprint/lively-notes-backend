const notesRepository = require("../repositories/notes.repository.js");
const { isValidId } = require("../repositories/repository.util.js");
const { broadcastSyncEvent } = require("./sync.service.js");
const sectionsRepository = require("../repositories/sections.repository.js");

async function getAll() {
  return notesRepository.getAll();
}

async function getBySection(sectionId) {
  return notesRepository.getBySection(sectionId);
}

async function searchNotes(query) {
  const [notes, sections] = await Promise.all([
    notesRepository.search(query),
    sectionsRepository.getAll(),
  ]);
  const sectionTitles = new Map(sections.map((section) => [section._id, section.title]));
  return notes.map((note) => ({
    ...note,
    sectionTitle: sectionTitles.get(note.sectionId || "default") || "Notes",
  }));
}

async function createNote(payload) {
  const result = await notesRepository.create(payload);
  const id = result?._id || result?.insertedId || result?.id;
  await broadcastSyncEvent("global_user", { domain: "notes", action: "create", id });
  await broadcastSyncEvent("global_user", { domain: "sections", action: "update" });
  return result;
}

async function deleteNote(id) {
  // defensive check (controller already validates, but keep service safe)
  if (!isValidId(id)) {
    return { acknowledged: false, deletedCount: 0 };
  }
  const result = await notesRepository.remove(id);
  await broadcastSyncEvent("global_user", { domain: "notes", action: "delete", id });
  await broadcastSyncEvent("global_user", { domain: "sections", action: "update" });
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
    await broadcastSyncEvent("global_user", { domain: "notes", action: "update", id: payload._id });
    if (payload.sectionId !== undefined) {
      await broadcastSyncEvent("global_user", { domain: "sections", action: "update" });
    }
    return result;
  } catch (error) {
    console.log(error);
  }
}

async function updateOrder(orderedIds) {
  const result = await notesRepository.updateOrder(orderedIds);
  await broadcastSyncEvent("global_user", { domain: "notes", action: "reorder" });
  return result;
}

async function moveToSection(noteId, sectionId) {
  if (!isValidId(noteId)) {
    return { acknowledged: false, modified: 0 };
  }
  const result = await notesRepository.update(noteId, { sectionId });
  await broadcastSyncEvent("global_user", { domain: "notes", action: "update", id: noteId });
  await broadcastSyncEvent("global_user", { domain: "sections", action: "update" });
  return result;
}

module.exports = {
  getAll,
  getBySection,
  searchNotes,
  createNote,
  deleteNote,
  updateNote,
  updateOrder,
  moveToSection,
  isValidId,
};
