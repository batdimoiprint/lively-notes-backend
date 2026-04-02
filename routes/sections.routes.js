const express = require("express");
const sectionsController = require("../controller/sections.controller");

const router = express.Router();

/**
 * @swagger
 * /api/sections/initialize:
 *   post:
 *     tags:
 *       - Sections
 *     summary: Initialize sections
 *     description: Creates default section and adds sectionId to existing notes
 *     responses:
 *       200:
 *         description: Sections initialized
 */
router.post("/initialize", sectionsController.initializeSections);

/**
 * @swagger
 * /api/sections:
 *   get:
 *     tags:
 *       - Sections
 *     summary: Get all sections
 *     description: Retrieves all sections with note counts
 *     responses:
 *       200:
 *         description: List of sections
 */
router.get("/", sectionsController.listSections);

/**
 * @swagger
 * /api/sections:
 *   post:
 *     tags:
 *       - Sections
 *     summary: Create a new section
 *     description: Creates a new section
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Work"
 *               _id:
 *                 type: string
 *                 example: "work"
 *               order:
 *                 type: number
 *                 example: 1
 *     responses:
 *       201:
 *         description: Section created
 */
router.post("/", sectionsController.createSection);

/**
 * @swagger
 * /api/sections:
 *   delete:
 *     tags:
 *       - Sections
 *     summary: Delete a section
 *     description: Deletes a section and moves its notes to default
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               _id:
 *                 type: string
 *                 example: "work"
 *     responses:
 *       200:
 *         description: Section deleted
 */
router.delete("/", sectionsController.deleteSection);

/**
 * @swagger
 * /api/sections:
 *   put:
 *     tags:
 *       - Sections
 *     summary: Update a section
 *     description: Updates a section's title or order
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               _id:
 *                 type: string
 *                 example: "work"
 *               title:
 *                 type: string
 *                 example: "Work Notes"
 *               order:
 *                 type: number
 *                 example: 1
 *     responses:
 *       200:
 *         description: Section updated
 */
router.put("/", sectionsController.updateSection);

/**
 * @swagger
 * /api/sections/reorder:
 *   patch:
 *     tags:
 *       - Sections
 *     summary: Reorder sections
 *     description: Updates the order of sections based on an array of IDs
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orderedIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["default", "work", "personal"]
 *     responses:
 *       200:
 *         description: Sections reordered successfully
 */
router.patch("/reorder", sectionsController.reorderSections);

module.exports = router;
