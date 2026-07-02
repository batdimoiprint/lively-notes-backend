const client = require("../db/db.js");
const {
  ScanCommand,
  QueryCommand,
  UpdateCommand,
  TransactWriteCommand,
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
const notesCollection = myDB.collection("notes");

// Mongo sorts docs missing "order" first on {order: 1}; mirror that when
// sorting Dynamo scans client-side.
function byOrderAsc(a, b) {
  return (a.order ?? -Infinity) - (b.order ?? -Infinity);
}

async function getAll() {
  if (readsFromDynamo()) {
    const { Items } = await docClient.send(
      new ScanCommand({ TableName: TABLES.notes })
    );
    return fromDynamoItems(Items).sort(byOrderAsc);
  }
  const cursor = notesCollection.find({}).sort({ order: 1 });
  return cursor.toArray();
}

async function getBySection(sectionId) {
  if (readsFromDynamo()) {
    const { Items } = await docClient.send(
      new QueryCommand({
        TableName: TABLES.notes,
        IndexName: "sectionId-order-index",
        KeyConditionExpression: "#sid = :sid",
        ExpressionAttributeNames: { "#sid": "sectionId" },
        ExpressionAttributeValues: { ":sid": sectionId },
      })
    );
    return fromDynamoItems(Items);
  }
  const cursor = notesCollection.find({ sectionId }).sort({ order: 1 });
  return cursor.toArray();
}

async function create(payload) {
  const _id = newId();
  const note = {
    title: payload.title,
    body: payload.body,
    sectionId: payload.sectionId || "default",
    // New notes sort to the top, matching Mongo's missing-order behavior.
    order: -1,
    createdAt: new Date(),
  };

  await notesCollection.insertOne({ _id, ...note });

  // The section's noteCount is a maintained counter in DynamoDB (replaces the
  // Mongo $lookup aggregation), so note create/delete/move must adjust it.
  await bestEffortDynamo("notes.create", () =>
    docClient.send(
      new TransactWriteCommand({
        TransactItems: [
          {
            Put: {
              TableName: TABLES.notes,
              Item: { id: _id, ...note, createdAt: toIso(note.createdAt) },
            },
          },
          {
            Update: {
              TableName: TABLES.sections,
              Key: { id: note.sectionId },
              UpdateExpression: "ADD noteCount :one",
              ExpressionAttributeValues: { ":one": 1 },
            },
          },
        ],
      })
    )
  );

  return { _id, ...note };
}

function buildSetExpression(fields) {
  const names = {};
  const values = {};
  const sets = [];
  Object.entries(fields).forEach(([key, value], i) => {
    names[`#f${i}`] = key;
    values[`:v${i}`] = value;
    sets.push(`#f${i} = :v${i}`);
  });
  return { names, values, expression: `SET ${sets.join(", ")}` };
}

async function update(id, fields) {
  // Read the current sectionId first (from the authoritative store) so a
  // section move can adjust both sections' noteCount counters in DynamoDB.
  let previousSectionId = null;
  if (fields.sectionId !== undefined) {
    const current = await notesCollection.findOne(
      { _id: toMongoId(id) },
      { projection: { sectionId: 1 } }
    );
    previousSectionId = current ? current.sectionId || "default" : null;
  }

  const result = await notesCollection.updateOne(
    { _id: toMongoId(id) },
    { $set: fields }
  );

  await bestEffortDynamo("notes.update", async () => {
    const { names, values, expression } = buildSetExpression(fields);
    const movingSections =
      fields.sectionId !== undefined &&
      previousSectionId !== null &&
      previousSectionId !== fields.sectionId;

    if (movingSections) {
      // Condition on the note existing so the counters only shift when the
      // note item is actually updated; a missing item fails the whole
      // transaction and is reconciled by the backfill instead.
      await docClient.send(
        new TransactWriteCommand({
          TransactItems: [
            {
              Update: {
                TableName: TABLES.notes,
                Key: { id },
                UpdateExpression: expression,
                ConditionExpression: "attribute_exists(id)",
                ExpressionAttributeNames: names,
                ExpressionAttributeValues: values,
              },
            },
            {
              Update: {
                TableName: TABLES.sections,
                Key: { id: previousSectionId },
                UpdateExpression: "ADD noteCount :minus",
                ExpressionAttributeValues: { ":minus": -1 },
              },
            },
            {
              Update: {
                TableName: TABLES.sections,
                Key: { id: fields.sectionId },
                UpdateExpression: "ADD noteCount :plus",
                ExpressionAttributeValues: { ":plus": 1 },
              },
            },
          ],
        })
      );
    } else {
      await docClient.send(
        new UpdateCommand({
          TableName: TABLES.notes,
          Key: { id },
          UpdateExpression: expression,
          ConditionExpression: "attribute_exists(id)",
          ExpressionAttributeNames: names,
          ExpressionAttributeValues: values,
        })
      );
    }
  });

  return {
    acknowledged: result.acknowledged,
    modified: result.modifiedCount,
  };
}

async function remove(id) {
  const current = await notesCollection.findOne(
    { _id: toMongoId(id) },
    { projection: { sectionId: 1 } }
  );

  const result = await notesCollection.deleteOne({ _id: toMongoId(id) });

  if (result.deletedCount > 0) {
    const sectionId = current ? current.sectionId || "default" : "default";
    await bestEffortDynamo("notes.remove", () =>
      docClient.send(
        new TransactWriteCommand({
          TransactItems: [
            {
              Delete: {
                TableName: TABLES.notes,
                Key: { id },
                ConditionExpression: "attribute_exists(id)",
              },
            },
            {
              Update: {
                TableName: TABLES.sections,
                Key: { id: sectionId },
                UpdateExpression: "ADD noteCount :minus",
                ExpressionAttributeValues: { ":minus": -1 },
              },
            },
          ],
        })
      )
    );
  }

  return {
    acknowledged: result.acknowledged,
    deletedCount: result.deletedCount,
  };
}

async function updateOrder(orderedIds) {
  const bulkOps = orderedIds.map((id, index) => ({
    updateOne: {
      filter: { _id: toMongoId(id) },
      update: { $set: { order: index } },
    },
  }));
  const result = await notesCollection.bulkWrite(bulkOps);

  await bestEffortDynamo("notes.updateOrder", () =>
    Promise.all(
      orderedIds.map((id, index) =>
        docClient
          .send(
            new UpdateCommand({
              TableName: TABLES.notes,
              Key: { id },
              UpdateExpression: "SET #o = :o",
              ConditionExpression: "attribute_exists(id)",
              ExpressionAttributeNames: { "#o": "order" },
              ExpressionAttributeValues: { ":o": index },
            })
          )
          .catch((err) => {
            console.error(
              `[dynamo-write-failed] notes.updateOrder(${id}):`,
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

module.exports = {
  getAll,
  getBySection,
  create,
  update,
  remove,
  updateOrder,
};
