const sectionsRepository = require("../repositories/sections.repository.js");

async function getAll() {
  return sectionsRepository.getAll();
}

async function getAllWithNoteCounts() {
  return sectionsRepository.getAllWithNoteCounts();
}

async function createSection(payload) {
  return sectionsRepository.create(payload);
}

async function deleteSection(id) {
  return sectionsRepository.remove(id);
}

async function updateSection(payload) {
  return sectionsRepository.update(payload);
}

async function initializeDefaultSection() {
  return sectionsRepository.initializeDefaultSection();
}

async function updateOrder(orderedIds) {
  return sectionsRepository.updateOrder(orderedIds);
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
