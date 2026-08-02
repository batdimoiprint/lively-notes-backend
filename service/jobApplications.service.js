const jobApplicationsRepository = require("../repositories/jobApplications.repository.js");
const { isValidId, newId } = require("../repositories/repository.util.js");
const { broadcastSyncEvent } = require("./sync.service.js");

const STATUS_VALUES = [
  "applied",
  "screening",
  "interview",
  "offer",
  "rejected",
  "withdrawn",
];

function isValidStatus(status) {
  return STATUS_VALUES.includes(status);
}

function isValidDateString(dateStr) {
  if (typeof dateStr !== "string") return false;
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;
  const date = new Date(dateStr + "T00:00:00Z");
  return !isNaN(date.getTime());
}

// Stages are fully user-defined subitems; each keeps a stable server/client
// id so the frontend can PATCH the whole array without losing identity.
function normalizeStages(stages) {
  if (!Array.isArray(stages)) return [];
  return stages
    .filter((s) => s && typeof s.title === "string" && s.title.trim())
    .map((s) => ({
      id: typeof s.id === "string" && s.id ? s.id : newId(),
      title: s.title.trim(),
      ...(typeof s.link === "string" && s.link ? { link: s.link } : {}),
      ...(typeof s.body === "string" && s.body ? { body: s.body } : {}),
    }));
}

async function getAll() {
  return jobApplicationsRepository.getAll();
}

async function createJob(payload) {
  const result = await jobApplicationsRepository.create({
    company: payload.company,
    position: payload.position,
    dateApplied: payload.dateApplied, // "YYYY-MM-DD"
    status: payload.status || "applied",
    link: payload.link || "",
    reference: payload.reference || "",
    notes: payload.notes || "",
    stages: normalizeStages(payload.stages),
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  await broadcastSyncEvent("global_user", { domain: "jobApplications", action: "create", id: result?._id || result?.insertedId });
  return result;
}

async function updateJob(payload) {
  if (!isValidId(payload._id)) {
    return { acknowledged: false, modified: 0 };
  }

  const updateFields = {};
  if (payload.company !== undefined) updateFields.company = payload.company;
  if (payload.position !== undefined) updateFields.position = payload.position;
  if (payload.dateApplied !== undefined) updateFields.dateApplied = payload.dateApplied;
  if (payload.status !== undefined) updateFields.status = payload.status || "applied";
  if (payload.link !== undefined) updateFields.link = payload.link;
  if (payload.reference !== undefined) updateFields.reference = payload.reference;
  if (payload.notes !== undefined) updateFields.notes = payload.notes;
  if (payload.stages !== undefined) {
    updateFields.stages = normalizeStages(payload.stages);
  }
  updateFields.updatedAt = new Date();

  const result = await jobApplicationsRepository.update(payload._id, updateFields);
  await broadcastSyncEvent("global_user", { domain: "jobApplications", action: "update", id: payload._id });
  return result;
}

async function deleteJob(id) {
  if (!isValidId(id)) {
    return { acknowledged: false, deletedCount: 0 };
  }
  const result = await jobApplicationsRepository.remove(id);
  await broadcastSyncEvent("global_user", { domain: "jobApplications", action: "delete", id });
  return result;
}

module.exports = {
  getAll,
  createJob,
  updateJob,
  deleteJob,
  isValidId,
  isValidStatus,
  isValidDateString,
  STATUS_VALUES,
};
