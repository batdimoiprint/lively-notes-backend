const sectionsRepository = require("../repositories/sections.repository.js");
const { broadcastSyncEvent } = require("./sync.service.js");

async function getAll() {
  return sectionsRepository.getAll();
}

async function getAllWithNoteCounts() {
  return sectionsRepository.getAllWithNoteCounts();
}

async function createSection(payload) {
  const result = await sectionsRepository.create(payload);
  broadcastSyncEvent("global_user", { domain: "sections", action: "create", id: payload?._id || payload?.id });
  return result;
}

async function deleteSection(id) {
  const result = await sectionsRepository.remove(id);
  broadcastSyncEvent("global_user", { domain: "sections", action: "delete", id });
  return result;
}

async function updateSection(payload) {
  const result = await sectionsRepository.update(payload);
  broadcastSyncEvent("global_user", { domain: "sections", action: "update", id: payload?._id || payload?.id });
  return result;
}

async function initializeDefaultSection() {
  return sectionsRepository.initializeDefaultSection();
}

async function updateOrder(orderedIds) {
  const result = await sectionsRepository.updateOrder(orderedIds);
  broadcastSyncEvent("global_user", { domain: "sections", action: "reorder" });
  return result;
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
