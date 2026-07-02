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
  newId,
  toMongoId,
  bestEffortDynamo,
  fromDynamoItems,
  toIso,
} = require("./repository.util.js");

const myDB = client.db("livelydesktopnotes");
const calendarNotesCollection = myDB.collection("calendarNotes");

function byDateCreatedAtAsc(a, b) {
  const dateCompare = (a.date || "").localeCompare(b.date || "");
  if (dateCompare !== 0) return dateCompare;
  return String(a.createdAt || "").localeCompare(String(b.createdAt || ""));
}

// Derived DynamoDB attributes:
// - monthKey/dateCreatedAt serve the month-date-index GSI (getByMonth).
// - pendingPk/pendingReminderAt are sparse: present only while a reminder is
//   unsent, so the pending-reminders-index GSI holds exactly the due-check
//   working set and getDueReminders never scans.
function toDynamoItem(doc) {
  const createdAtIso = toIso(doc.createdAt);
  const item = {
    id: String(doc._id),
    title: doc.title,
    body: doc.body,
    date: doc.date,
    reminderAt: toIso(doc.reminderAt),
    reminderInterval: doc.reminderInterval || "once",
    reminderSent: !!doc.reminderSent,
    isWholeDay: !!doc.isWholeDay,
    createdAt: createdAtIso,
    monthKey: String(doc.date).slice(0, 7),
    dateCreatedAt: `${doc.date}#${createdAtIso}`,
  };
  if (doc.reminderAt && !doc.reminderSent) {
    item.pendingPk = "PENDING";
    item.pendingReminderAt = toIso(doc.reminderAt);
  }
  return item;
}

async function getAll() {
  if (readsFromDynamo()) {
    const { Items } = await docClient.send(
      new ScanCommand({ TableName: TABLES.calendarNotes })
    );
    return fromDynamoItems(Items).sort(byDateCreatedAtAsc);
  }
  const cursor = calendarNotesCollection
    .find({})
    .sort({ date: 1, createdAt: 1 });
  return cursor.toArray();
}

async function getByMonth(year, month) {
  if (readsFromDynamo()) {
    const monthKey = `${year}-${String(month).padStart(2, "0")}`;
    const { Items } = await docClient.send(
      new QueryCommand({
        TableName: TABLES.calendarNotes,
        IndexName: "month-date-index",
        KeyConditionExpression: "#mk = :mk",
        ExpressionAttributeNames: { "#mk": "monthKey" },
        ExpressionAttributeValues: { ":mk": monthKey },
      })
    );
    return fromDynamoItems(Items);
  }

  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endMonth = month === 12 ? 1 : month + 1;
  const endYear = month === 12 ? year + 1 : year;
  const endDate = `${endYear}-${String(endMonth).padStart(2, "0")}-01`;

  const cursor = calendarNotesCollection
    .find({ date: { $gte: startDate, $lt: endDate } })
    .sort({ date: 1, createdAt: 1 });
  return cursor.toArray();
}

async function create(note) {
  const _id = newId();
  const doc = { _id, ...note };
  await calendarNotesCollection.insertOne(doc);

  await bestEffortDynamo("calendarNotes.create", () =>
    docClient.send(
      new PutCommand({
        TableName: TABLES.calendarNotes,
        Item: toDynamoItem(doc),
      })
    )
  );

  return doc;
}

async function update(id, updateFields) {
  const result = await calendarNotesCollection.updateOne(
    { _id: toMongoId(id) },
    { $set: updateFields }
  );

  // Several DynamoDB attributes are derived (monthKey, dateCreatedAt, the
  // sparse pending pair), so instead of translating the partial update,
  // re-read the authoritative doc and replace the whole item.
  await bestEffortDynamo("calendarNotes.update", async () => {
    const doc = await calendarNotesCollection.findOne({ _id: toMongoId(id) });
    if (!doc) return;
    await docClient.send(
      new PutCommand({
        TableName: TABLES.calendarNotes,
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
  const result = await calendarNotesCollection.deleteOne({
    _id: toMongoId(id),
  });

  if (result.deletedCount > 0) {
    await bestEffortDynamo("calendarNotes.remove", () =>
      docClient.send(
        new DeleteCommand({ TableName: TABLES.calendarNotes, Key: { id } })
      )
    );
  }

  return {
    acknowledged: result.acknowledged,
    deletedCount: result.deletedCount,
  };
}

async function getDueReminders() {
  const now = new Date();
  if (readsFromDynamo()) {
    const { Items } = await docClient.send(
      new QueryCommand({
        TableName: TABLES.calendarNotes,
        IndexName: "pending-reminders-index",
        KeyConditionExpression: "#pk = :pk AND #due <= :now",
        ExpressionAttributeNames: {
          "#pk": "pendingPk",
          "#due": "pendingReminderAt",
        },
        ExpressionAttributeValues: { ":pk": "PENDING", ":now": toIso(now) },
      })
    );
    return fromDynamoItems(Items);
  }

  const cursor = calendarNotesCollection.find({
    reminderAt: { $lte: now },
    reminderSent: false,
  });
  return cursor.toArray();
}

async function markReminderSent(id) {
  const result = await calendarNotesCollection.updateOne(
    { _id: toMongoId(id) },
    { $set: { reminderSent: true } }
  );

  await bestEffortDynamo("calendarNotes.markReminderSent", () =>
    docClient.send(
      new UpdateCommand({
        TableName: TABLES.calendarNotes,
        Key: { id: String(id) },
        UpdateExpression:
          "SET reminderSent = :sent REMOVE pendingPk, pendingReminderAt",
        ConditionExpression: "attribute_exists(id)",
        ExpressionAttributeValues: { ":sent": true },
      })
    )
  );

  return result;
}

module.exports = {
  getAll,
  getByMonth,
  create,
  update,
  remove,
  getDueReminders,
  markReminderSent,
};
