const jobApplicationsService = require("../service/jobApplications.service.js");

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isOptionalString(value) {
  return value === undefined || value === null || typeof value === "string";
}

function isOptionalPositiveInteger(value) {
  if (value === undefined || value === null || value === "") return true;
  const num = Number(value);
  return Number.isInteger(num) && num > 0;
}

function normalizeRank(value) {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const num = Number(value);
  return Number.isInteger(num) && num > 0 ? num : null;
}

// Stages are free-form subitems: required title, optional link and body.
function validateStages(stages) {
  if (stages === undefined) return null; // field absent = untouched
  if (!Array.isArray(stages)) return "Stages must be an array";
  for (const stage of stages) {
    if (!stage || typeof stage !== "object") return "Each stage must be an object";
    if (!isNonEmptyString(stage.title)) return "Each stage needs a non-empty title";
    if (stage.link !== undefined && typeof stage.link !== "string") {
      return "Stage link must be a string";
    }
    if (stage.body !== undefined && typeof stage.body !== "string") {
      return "Stage body must be a string";
    }
  }
  return null;
}

async function listJobs(req, res, next) {
  try {
    const jobs = await jobApplicationsService.getAll();
    res.status(200).json(jobs);
  } catch (err) {
    next(err);
  }
}

async function createJob(req, res, next) {
  try {
    const { company, position, dateApplied, preferredRank, status, link, reference, notes, stages } = req.body;

    if (!isNonEmptyString(company)) {
      return res.status(400).json({ error: "Company is required" });
    }
    if (!isNonEmptyString(position)) {
      return res.status(400).json({ error: "Position is required" });
    }
    if (!dateApplied || !jobApplicationsService.isValidDateString(dateApplied)) {
      return res.status(400).json({ error: "Valid dateApplied (YYYY-MM-DD) is required" });
    }
    if (!isOptionalPositiveInteger(preferredRank)) {
      return res.status(400).json({ error: "preferredRank must be a positive integer or null" });
    }
    if (status && !jobApplicationsService.isValidStatus(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }
    if (![link, reference, notes].every(isOptionalString)) {
      return res.status(400).json({ error: "link, reference and notes must be strings" });
    }
    const stageError = validateStages(stages);
    if (stageError) {
      return res.status(400).json({ error: stageError });
    }

    const job = await jobApplicationsService.createJob({
      company: company.trim(),
      position: position.trim(),
      dateApplied,
      preferredRank: normalizeRank(preferredRank),
      status: status || "applied",
      link: link ? link.trim() : "",
      reference: reference ? reference.trim() : "",
      notes: notes ? notes.trim() : "",
      stages,
    });
    res.status(201).json(job);
  } catch (err) {
    next(err);
  }
}

async function updateJob(req, res, next) {
  try {
    const { _id, company, position, dateApplied, preferredRank, status, link, reference, notes, stages } = req.body;

    if (!_id || !jobApplicationsService.isValidId(_id)) {
      return res.status(400).json({ error: "Valid _id is required" });
    }
    if (company !== undefined && !isNonEmptyString(company)) {
      return res.status(400).json({ error: "Company must be a non-empty string" });
    }
    if (position !== undefined && !isNonEmptyString(position)) {
      return res.status(400).json({ error: "Position must be a non-empty string" });
    }
    if (dateApplied !== undefined && !jobApplicationsService.isValidDateString(dateApplied)) {
      return res.status(400).json({ error: "Valid dateApplied (YYYY-MM-DD) is required" });
    }
    if (preferredRank !== undefined && !isOptionalPositiveInteger(preferredRank)) {
      return res.status(400).json({ error: "preferredRank must be a positive integer or null" });
    }
    if (status !== undefined && !jobApplicationsService.isValidStatus(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }
    if (![link, reference, notes].every(isOptionalString)) {
      return res.status(400).json({ error: "link, reference and notes must be strings" });
    }
    const stageError = validateStages(stages);
    if (stageError) {
      return res.status(400).json({ error: stageError });
    }

    const result = await jobApplicationsService.updateJob({
      _id,
      ...(company !== undefined && { company: company.trim() }),
      ...(position !== undefined && { position: position.trim() }),
      ...(dateApplied !== undefined && { dateApplied }),
      ...(preferredRank !== undefined && { preferredRank: normalizeRank(preferredRank) }),
      ...(status !== undefined && { status }),
      ...(link !== undefined && { link: link ? link.trim() : "" }),
      ...(reference !== undefined && { reference: reference ? reference.trim() : "" }),
      ...(notes !== undefined && { notes: notes ? notes.trim() : "" }),
      ...(stages !== undefined && { stages }),
    });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function deleteJob(req, res, next) {
  try {
    const { _id } = req.body;

    if (!_id || !jobApplicationsService.isValidId(_id)) {
      return res.status(400).json({ error: "Valid _id is required" });
    }

    const result = await jobApplicationsService.deleteJob(_id);
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Job application not found" });
    }
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listJobs,
  createJob,
  updateJob,
  deleteJob,
};
