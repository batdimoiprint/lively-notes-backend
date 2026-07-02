const crypto = require("crypto");
const { ObjectId } = require("mongodb");

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// READ_SOURCE gates which store serves reads: "mongo" (default) or "dynamo".
// Writes always go to both stores; MongoDB stays authoritative.
function readSource() {
  return process.env.READ_SOURCE === "dynamo" ? "dynamo" : "mongo";
}

function readsFromDynamo() {
  return readSource() === "dynamo";
}

// New records get an app-generated UUID used as BOTH the Mongo _id and the
// DynamoDB partition key, so the two stores agree on identity. Historical
// records use their Mongo ObjectId hex string as the shared id (see
// scripts/migrate-to-dynamo.js).
function newId() {
  return crypto.randomUUID();
}

// Ids are either legacy ObjectId hex strings or app-generated UUIDs.
function isValidId(id) {
  return (
    typeof id === "string" && (ObjectId.isValid(id) || UUID_REGEX.test(id))
  );
}

// Mongo _id is an ObjectId for legacy docs and a UUID string for new docs.
function toMongoId(id) {
  return typeof id === "string" && ObjectId.isValid(id) ? new ObjectId(id) : id;
}

// The DynamoDB write is best-effort during the dual-write window: Mongo has
// already succeeded, so log the failure for reconciliation (re-run the
// backfill) instead of failing the request.
async function bestEffortDynamo(label, fn) {
  try {
    return await fn();
  } catch (err) {
    console.error(`[dynamo-write-failed] ${label}:`, err.message);
    return null;
  }
}

// DynamoDB items store the shared id under "id"; the API contract (and the
// frontend) expect Mongo-shaped documents keyed by "_id".
function fromDynamoItem(item) {
  if (!item) return null;
  const { id, ...rest } = item;
  return id !== undefined ? { _id: id, ...rest } : rest;
}

function fromDynamoItems(items) {
  return (items || []).map(fromDynamoItem);
}

// DynamoDB cannot marshall Date objects; store ISO strings instead.
function toIso(value) {
  if (value === null || value === undefined) return null;
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function chunk(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

module.exports = {
  readSource,
  readsFromDynamo,
  newId,
  isValidId,
  toMongoId,
  bestEffortDynamo,
  fromDynamoItem,
  fromDynamoItems,
  toIso,
  chunk,
};
