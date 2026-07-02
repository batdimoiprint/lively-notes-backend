const client = require("../db/db.js");
const {
  ScanCommand,
  QueryCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
} = require("@aws-sdk/lib-dynamodb");
const { docClient, TABLES } = require("../db/dynamo.js");
const {
  readsFromDynamo,
  bestEffortDynamo,
  fromDynamoItems,
  toIso,
} = require("./repository.util.js");

const myDB = client.db("livelydesktopnotes");
const sectionsCollection = myDB.collection("sections");
const notesCollection = myDB.collection("notes");

function byOrderAsc(a, b) {
  return (a.order ?? -Infinity) - (b.order ?? -Infinity);
}

async function scanSections() {
  const { Items } = await docClient.send(
    new ScanCommand({ TableName: TABLES.sections })
  );
  return fromDynamoItems(Items).sort(byOrderAsc);
}

async function getAll() {
  if (readsFromDynamo()) {
    return scanSections();
  }
  const cursor = sectionsCollection.find({}).sort({ order: 1 });
  return cursor.toArray();
}

async function getAllWithNoteCounts() {
  if (readsFromDynamo()) {
    // noteCount is a maintained counter attribute (kept in sync by the notes
    // repository), so this is a plain scan — no join needed.
    const sections = await scanSections();
    return sections.map((section) => ({
      ...section,
      noteCount: section.noteCount ?? 0,
    }));
  }

  return sectionsCollection
    .aggregate([
      {
        $lookup: {
          from: "notes",
          localField: "_id",
          foreignField: "sectionId",
          as: "notes",
        },
      },
      { $addFields: { noteCount: { $size: "$notes" } } },
      { $project: { notes: 0 } },
      { $sort: { order: 1 } },
    ])
    .toArray();
}

async function create(payload) {
  const section = {
    _id: payload._id || payload.title.toLowerCase().replace(/\s+/g, "-"),
    title: payload.title,
    order: payload.order || 0,
    createdAt: new Date(),
  };
  await sectionsCollection.insertOne(section);

  await bestEffortDynamo("sections.create", () =>
    docClient.send(
      new PutCommand({
        TableName: TABLES.sections,
        Item: {
          id: section._id,
          title: section.title,
          order: section.order,
          createdAt: toIso(section.createdAt),
          noteCount: 0,
        },
      })
    )
  );

  return section;
}

async function remove(id) {
  // Orphaned notes cascade to the default section in both stores.
  await notesCollection.updateMany(
    { sectionId: id },
    { $set: { sectionId: "default" } }
  );
  const result = await sectionsCollection.deleteOne({ _id: id });

  await bestEffortDynamo("sections.remove", async () => {
    const { Items = [] } = await docClient.send(
      new QueryCommand({
        TableName: TABLES.notes,
        IndexName: "sectionId-order-index",
        KeyConditionExpression: "#sid = :sid",
        ExpressionAttributeNames: { "#sid": "sectionId" },
        ExpressionAttributeValues: { ":sid": id },
      })
    );

    await Promise.all(
      Items.map((note) =>
        docClient.send(
          new UpdateCommand({
            TableName: TABLES.notes,
            Key: { id: note.id },
            UpdateExpression: "SET #sid = :default",
            ExpressionAttributeNames: { "#sid": "sectionId" },
            ExpressionAttributeValues: { ":default": "default" },
          })
        )
      )
    );

    if (Items.length > 0) {
      await docClient.send(
        new UpdateCommand({
          TableName: TABLES.sections,
          Key: { id: "default" },
          UpdateExpression: "ADD noteCount :moved",
          ExpressionAttributeValues: { ":moved": Items.length },
        })
      );
    }

    await docClient.send(
      new DeleteCommand({ TableName: TABLES.sections, Key: { id } })
    );
  });

  return {
    acknowledged: result.acknowledged,
    deletedCount: result.deletedCount,
  };
}

async function update(payload) {
  const updateFields = {};
  if (payload.title !== undefined) updateFields.title = payload.title;
  if (payload.order !== undefined) updateFields.order = payload.order;

  const result = await sectionsCollection.updateOne(
    { _id: payload._id },
    { $set: updateFields }
  );

  await bestEffortDynamo("sections.update", async () => {
    const names = {};
    const values = {};
    const sets = [];
    Object.entries(updateFields).forEach(([key, value], i) => {
      names[`#f${i}`] = key;
      values[`:v${i}`] = value;
      sets.push(`#f${i} = :v${i}`);
    });
    if (sets.length === 0) return;

    await docClient.send(
      new UpdateCommand({
        TableName: TABLES.sections,
        Key: { id: payload._id },
        UpdateExpression: `SET ${sets.join(", ")}`,
        ConditionExpression: "attribute_exists(id)",
        ExpressionAttributeNames: names,
        ExpressionAttributeValues: values,
      })
    );
  });

  return {
    acknowledged: result.acknowledged,
    modified: result.modifiedCount,
  };
}

async function updateOrder(orderedIds) {
  const bulkOps = orderedIds.map((id, index) => ({
    updateOne: {
      filter: { _id: id },
      update: { $set: { order: index } },
    },
  }));
  const result = await sectionsCollection.bulkWrite(bulkOps);

  await bestEffortDynamo("sections.updateOrder", () =>
    Promise.all(
      orderedIds.map((id, index) =>
        docClient
          .send(
            new UpdateCommand({
              TableName: TABLES.sections,
              Key: { id },
              UpdateExpression: "SET #o = :o",
              ConditionExpression: "attribute_exists(id)",
              ExpressionAttributeNames: { "#o": "order" },
              ExpressionAttributeValues: { ":o": index },
            })
          )
          .catch((err) => {
            console.error(
              `[dynamo-write-failed] sections.updateOrder(${id}):`,
              err.message
            );
          })
      )
    )
  );

  return {
    acknowledged: result.ok === 1,
    modified: result.modifiedCount,
  };
}

async function initializeDefaultSection() {
  const defaultExists = await sectionsCollection.findOne({ _id: "default" });
  if (!defaultExists) {
    await sectionsCollection.insertOne({
      _id: "default",
      title: "Notes",
      order: 0,
      createdAt: new Date(),
    });
  }

  // Legacy heal for notes created before sections existed (Mongo only; the
  // backfill copies the healed docs to DynamoDB).
  await notesCollection.updateMany(
    { sectionId: { $exists: false } },
    { $set: { sectionId: "default" } }
  );

  await bestEffortDynamo("sections.initializeDefaultSection", () =>
    docClient
      .send(
        new PutCommand({
          TableName: TABLES.sections,
          Item: {
            id: "default",
            title: "Notes",
            order: 0,
            createdAt: toIso(new Date()),
            noteCount: 0,
          },
          ConditionExpression: "attribute_not_exists(id)",
        })
      )
      .catch((err) => {
        if (err.name !== "ConditionalCheckFailedException") throw err;
      })
  );
}

module.exports = {
  getAll,
  getAllWithNoteCounts,
  create,
  remove,
  update,
  updateOrder,
  initializeDefaultSection,
};
