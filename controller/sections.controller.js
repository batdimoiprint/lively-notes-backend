const sectionsService = require("../service/sections.service");

async function listSections(req, res, next) {
  try {
    const sections = await sectionsService.getAllWithNoteCounts();
    res.status(200).json(sections);
  } catch (err) {
    next(err);
  }
}

async function createSection(req, res, next) {
  try {
    const { title, _id, order } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: "Title is required" });
    }
    const section = await sectionsService.createSection({ title: title.trim(), _id, order });
    res.status(201).json(section);
  } catch (err) {
    next(err);
  }
}

async function deleteSection(req, res, next) {
  try {
    const sectionId = req.body._id;

    if (!sectionId) {
      return res.status(400).json({ error: "Section ID is required" });
    }

    if (sectionId === "default") {
      return res.status(400).json({ error: "Cannot delete default section" });
    }

    const remove = await sectionsService.deleteSection(sectionId);

    if (remove.deletedCount === 0) {
      return res.status(404).json({ error: "Section not found" });
    }

    res.status(200).json(remove);
  } catch (err) {
    next(err);
  }
}

async function updateSection(req, res, next) {
  try {
    const sectionId = req.body._id;

    if (!sectionId) {
      return res.status(400).json({ error: "Section ID is required" });
    }

    const update = await sectionsService.updateSection(req.body);
    res.status(200).json(update);
  } catch (error) {
    next(error);
  }
}

async function initializeSections(req, res, next) {
  try {
    await sectionsService.initializeDefaultSection();
    res.status(200).json({ message: "Sections initialized" });
  } catch (err) {
    next(err);
  }
}

async function reorderSections(req, res, next) {
  try {
    const { orderedIds } = req.body;

    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return res.status(400).json({ error: "orderedIds must be a non-empty array" });
    }

    const result = await sectionsService.updateOrder(orderedIds);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = { listSections, createSection, deleteSection, updateSection, initializeSections, reorderSections };
