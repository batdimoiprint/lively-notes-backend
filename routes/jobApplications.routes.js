const express = require("express");
const jobApplicationsController = require("../controller/jobApplications.controller.js");

const router = express.Router();

/**
 * @swagger
 * /api/job-applications:
 *   get:
 *     tags:
 *       - Job Applications
 *     summary: Get all job applications
 *     responses:
 *       200:
 *         description: List of job applications
 */
router.get("/", jobApplicationsController.listJobs);

/**
 * @swagger
 * /api/job-applications:
 *   post:
 *     tags:
 *       - Job Applications
 *     summary: Create a job application
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - company
 *               - position
 *               - dateApplied
 *             properties:
 *               company:
 *                 type: string
 *               position:
 *                 type: string
 *               dateApplied:
 *                 type: string
 *                 example: "2026-08-02"
 *               status:
 *                 type: string
 *                 enum: [applied, screening, interview, offer, rejected, withdrawn, viewed, ghosted]
 *               link:
 *                 type: string
 *               reference:
 *                 type: string
 *               notes:
 *                 type: string
 *               stages:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                     link:
 *                       type: string
 *                     body:
 *                       type: string
 *     responses:
 *       201:
 *         description: Created job application
 */
router.post("/", jobApplicationsController.createJob);

/**
 * @swagger
 * /api/job-applications:
 *   patch:
 *     tags:
 *       - Job Applications
 *     summary: Update a job application
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - _id
 *             properties:
 *               _id:
 *                 type: string
 *               company:
 *                 type: string
 *               position:
 *                 type: string
 *               dateApplied:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [applied, screening, interview, offer, rejected, withdrawn, viewed, ghosted]
 *               link:
 *                 type: string
 *               reference:
 *                 type: string
 *               notes:
 *                 type: string
 *               stages:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Update result
 */
router.patch("/", jobApplicationsController.updateJob);

/**
 * @swagger
 * /api/job-applications:
 *   delete:
 *     tags:
 *       - Job Applications
 *     summary: Delete a job application
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - _id
 *             properties:
 *               _id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Delete result
 *       404:
 *         description: Job application not found
 */
router.delete("/", jobApplicationsController.deleteJob);

module.exports = router;
