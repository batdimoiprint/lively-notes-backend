const client = require("../db/db.js");
const {
  ScanCommand,
  PutCommand,
  DeleteCommand,
} = require("@aws-sdk/lib-dynamodb");
const { docClient, TABLES } = require("../db/dynamo.js");
const {
  readsFromDynamo,
  newId,
  toMongoId,
  bestEffortDynamo,
  fromDynamoItems,
  toIso,
} = require("./repository.util.js");

const myDB = client.db("livelydesktopnotes");
const jobApplicationsCollection = myDB.collection("jobApplications");

// No GSIs on this table: job applications are a small, full-list domain, so
// reads are a plain scan sorted in memory, and no derived attributes exist.
function byDateAppliedDesc(a, b) {
  const dateCompare = (b.dateApplied || "").localeCompare(a.dateApplied || "");
  if (dateCompare !== 0) return dateCompare;
  return String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
}

// DynamoDB cannot marshall Date objects; store ISO strings instead. Stages
// are an embedded list of { id, title, link?, body? } — no derived keys.
function toDynamoItem(doc) {
  return {
    id: String(doc._id),
    company: doc.company,
    position: doc.position,
    dateApplied: doc.dateApplied,
    preferredRank: doc.preferredRank !== undefined ? doc.preferredRank : null,
    status: doc.status || "applied",
    link: doc.link,
    reference: doc.reference,
    notes: doc.notes,
    stages: Array.isArray(doc.stages) ? doc.stages : [],
    createdAt: toIso(doc.createdAt),
    updatedAt: toIso(doc.updatedAt),
  };
}

async function getAll() {
  if (readsFromDynamo()) {
    const { Items } = await docClient.send(
      new ScanCommand({ TableName: TABLES.jobApplications })
    );
    return fromDynamoItems(Items).sort(byDateAppliedDesc);
  }
  const cursor = jobApplicationsCollection
    .find({})
    .sort({ dateApplied: -1, createdAt: -1 });
  return cursor.toArray();
}

async function create(job) {
  const _id = newId();
  const doc = { _id, ...job };
  await jobApplicationsCollection.insertOne(doc);

  await bestEffortDynamo("jobApplications.create", () =>
    docClient.send(
      new PutCommand({
        TableName: TABLES.jobApplications,
        Item: toDynamoItem(doc),
      })
    )
  );

  return doc;
}

async function update(id, updateFields) {
  const query = { $or: [{ _id: toMongoId(id) }, { _id: String(id) }] };
  const result = await jobApplicationsCollection.updateOne(
    query,
    { $set: updateFields }
  );

  // Re-read the authoritative doc and replace the whole DynamoDB item, same
  // as the calendar-notes repository: cheaper than translating partial
  // updates when embedded lists (stages) are involved.
  await bestEffortDynamo("jobApplications.update", async () => {
    const doc = await jobApplicationsCollection.findOne(query);
    if (!doc) return;
    await docClient.send(
      new PutCommand({
        TableName: TABLES.jobApplications,
        Item: { ...toDynamoItem(doc), id },
      })
    );
  });

  return {
    acknowledged: result.acknowledged,
    modified: result.modifiedCount,
  };
}

async function remove(id) {
  const result = await jobApplicationsCollection.deleteOne({
    $or: [{ _id: toMongoId(id) }, { _id: String(id) }],
  });

  if (result.deletedCount > 0) {
    await bestEffortDynamo("jobApplications.remove", () =>
      docClient.send(
        new DeleteCommand({ TableName: TABLES.jobApplications, Key: { id } })
      )
    );
  }

  return {
    acknowledged: result.acknowledged,
    deletedCount: result.deletedCount,
  };
}

module.exports = {
  getAll,
  create,
  update,
  remove,
};
